import { parseProjectDocument } from './project-document.js';

const MIME = { glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4' };
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const parseModel = bytes => { try { return JSON.parse(decoder.decode(bytes)); } catch { throw new Error('Model JSON is invalid.'); } };
const base64 = bytes => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
  return btoa(binary);
};
const decodeData = value => {
  const match = /^data:([^,]*),(.*)$/s.exec(value);
  if (!match) throw new Error('Invalid embedded asset.');
  const bytes = /;base64$/i.test(match[1]) ? Uint8Array.from(atob(match[2]), ch => ch.charCodeAt(0)) : encoder.encode(decodeURIComponent(match[2]));
  return { bytes, mime: match[1].replace(/;base64$/i, '') || 'application/octet-stream' };
};
const modelType = (bytes, mime, url) => bytes.length >= 4 && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) === 0x46546c67 ? 'glb' : /gltf\+json|\.gltf(?:[?#]|$)/i.test(mime + url) ? 'gltf' : null;

// Bound embedded JSON before serialization can allocate an enormous repeated data-URI string.
function checkOutputBudget(value, limit = 128 * 1024 * 1024) {
  let size = 0;
  const cost = new Map();
  const visit = item => {
    if (typeof item === 'string') {
      if (!cost.has(item)) cost.set(item, item.startsWith('data:') ? item.length + 2 : JSON.stringify(item).length);
      size += cost.get(item);
    } else if (Array.isArray(item)) { size += item.length + 2; for (const child of item) visit(child); }
    else if (item && typeof item === 'object') { size += 2; for (const [key, child] of Object.entries(item)) { size += key.length + 4; visit(child); } }
    else size += 32;
    if (size > limit) throw new Error('Embedded output is too large for the current single-file format. Reduce asset size or instances.');
  };
  visit(value);
}

/** Packages explicit project resources. No script/provider URLs or provenance links are fetched. */
export class AssetPackager {
  constructor({ baseUrl = globalThis.document?.baseURI, fetcher = globalThis.fetch, localReader = globalThis.window?.makuluDesktop?.readBundledAsset,
    crypto = globalThis.crypto, timeoutMs = 20000, maxFileBytes = 32 * 1024 * 1024, maxTotalBytes = 64 * 1024 * 1024, onProgress = () => {} } = {}) {
    this.baseUrl = baseUrl; this.fetcher = (...args) => fetcher.call(globalThis, ...args); this.localReader = localReader; this.crypto = crypto;
    this.timeoutMs = timeoutMs; this.maxFileBytes = maxFileBytes; this.maxTotalBytes = maxTotalBytes; this.onProgress = onProgress;
    this.cache = new Map(); this.entries = new Map(); this.totalBytes = 0; this.completed = 0;
  }

  progress() { this.onProgress({ completed: this.completed, discovered: this.cache.size, bytes: this.totalBytes }); }

  async packageProject(input) {
    const project = parseProjectDocument(input);
    for (const scene of project.scenes) await this.scene(scene.data);
    for (const prefab of project.prefabs) await this.prefab(prefab.data?.entityData);
    for (const asset of project.assets) {
      if (asset.url || asset.base64Data) {
        if (['models', 'model', 'textures', 'texture', 'audio'].includes(asset.type)) {
          const packed = await this.asset(asset.base64Data || asset.url, asset.type === 'models' || asset.type === 'model' ? 'model' : 'resource');
          asset.url = packed; asset.base64Data = packed;
        }
      }
      if (asset.materialData) await this.material(asset.materialData);
      if (asset.prefabData?.entityData) await this.prefab(asset.prefabData.entityData);
    }
    project.assetPackage = { version: 1, scope: 'explicit-project-assets', engineIncluded: false, physicsRuntimeIncluded: false, entries: [...this.entries.values()] };
    checkOutputBudget(project);
    const json = JSON.stringify(parseProjectDocument(project), null, 2);
    if (json.length > 128 * 1024 * 1024) throw new Error('Packaged project is too large for the current JSON format. Reduce asset sizes.');
    return { project, json, manifest: project.assetPackage };
  }

  async packageScene(scene) {
    const data = JSON.parse(JSON.stringify(scene));
    await this.scene(data);
    checkOutputBudget(data);
    return { scene: data, manifest: { version: 1, scope: 'active-scene-assets', engineIncluded: false, physicsRuntimeIncluded: false, entries: [...this.entries.values()] } };
  }

  async scene(scene) { for (const node of scene.root?.children || []) await this.node(node); }
  async node(node) {
    if (node.modelUrl) node.modelUrl = await this.asset(node.modelUrl, 'model');
    await this.material(node.components?.render?.material);
    const sound = node.components?.sound;
    if (sound?.assetUrl) sound.assetUrl = await this.asset(sound.assetUrl);
    for (const slot of sound?.slots || []) if (slot.url) slot.url = await this.asset(slot.url);
    for (const child of node.children || []) await this.node(child);
  }
  async material(material) {
    for (const field of ['diffuseMapUrl', 'normalMapUrl', 'roughnessMapUrl', 'emissiveMapUrl']) if (material?.[field]) material[field] = await this.asset(material[field]);
  }
  async prefab(node) {
    if (!node) return;
    if (node.modelUrl) node.modelUrl = await this.asset(node.modelUrl, 'model');
    for (const component of node.components || []) {
      if (component.type === 'render') await this.material(component.material || component.properties?.material);
      if (component.type === 'sound') {
        const data = component.properties || {};
        if (data.assetUrl) data.assetUrl = await this.asset(data.assetUrl);
        for (const slot of data.slots || []) if (slot.url) slot.url = await this.asset(slot.url);
      }
    }
    for (const child of node.children || []) await this.prefab(child);
  }

  async asset(source, kind = 'resource', parentUrl = this.baseUrl, ancestry = []) {
    if (typeof source !== 'string' || !source) throw new Error('An asset reference is invalid.');
    const url = source.startsWith('data:') ? source : new URL(source, parentUrl).href;
    if (ancestry.includes(url)) throw new Error('A model contains cyclic external asset references.');
    const key = `${kind}:${url}`;
    if (!this.cache.has(key)) {
      if (this.cache.size >= 2048) throw new Error('Asset dependency count exceeds the current packaging limit.');
      const work = this.packAsset(url, kind, [...ancestry, url]);
      this.cache.set(key, work); this.progress();
    }
    return this.cache.get(key);
  }

  async read(url) {
    let result;
    if (url.startsWith('data:')) result = decodeData(url);
    else {
      const parsed = new URL(url);
      if (parsed.username || parsed.password || !['http:', 'https:', 'file:'].includes(parsed.protocol)) throw new Error('Asset URL scheme or credentials are not supported.');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        if (parsed.protocol === 'file:') {
          if (!this.localReader) throw new Error('Bundled desktop asset access is unavailable.');
          const response = await Promise.race([this.localReader(url), new Promise((resolve, reject) => controller.signal.addEventListener('abort', () => reject(new Error('Timed out.')), { once: true }))]);
          if (!response?.bytes) throw new Error('Bundled asset could not be read.');
          result = { bytes: new Uint8Array(response.bytes), mime: response.mime || '' };
        } else {
          const response = await this.fetcher(url, { credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal });
          if (!response.ok) throw new Error('Asset download failed.');
          if (Number(response.headers.get('content-length')) > this.maxFileBytes) throw new Error('Asset exceeds the packaging size limit.');
          const chunks = []; let size = 0;
          if (response.body?.getReader) {
            const reader = response.body.getReader();
            while (true) {
              const { value, done } = await reader.read(); if (done) break;
              size += value.length;
              if (size > this.maxFileBytes) { await reader.cancel(); throw new Error('Asset exceeds the packaging size limit.'); }
              chunks.push(value);
            }
            const bytes = new Uint8Array(size); let offset = 0;
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
            result = { bytes, mime: response.headers.get('content-type')?.split(';')[0] || '' };
          } else result = { bytes: new Uint8Array(await response.arrayBuffer()), mime: response.headers.get('content-type')?.split(';')[0] || '' };
        }
      } catch { throw new Error('An asset could not be packaged (missing, blocked, timed out, or oversized).'); }
      finally { clearTimeout(timeout); }
    }
    if (result.bytes.length > this.maxFileBytes || this.totalBytes + result.bytes.length > this.maxTotalBytes) throw new Error('Asset packaging size budget exceeded.');
    this.totalBytes += result.bytes.length;
    return result;
  }

  async packAsset(url, kind, ancestry) {
    let { bytes, mime } = await this.read(url);
    if (!mime || mime === 'application/octet-stream') mime = MIME[url.split(/[?#]/)[0].split('.').pop()?.toLowerCase()] || mime || 'application/octet-stream';
    const type = modelType(bytes, mime, url) || (kind === 'model' ? 'gltf' : null);
    if (kind === 'model' && !type) throw new Error('Only glTF 2.0/GLB model packaging is supported.');
    if (type) {
      let gltf, chunks = [];
      if (type === 'glb') {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        if (bytes.length < 20 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.length) throw new Error('Invalid GLB header.');
        for (let offset = 12; offset < bytes.length;) {
          if (offset + 8 > bytes.length) throw new Error('Invalid GLB chunk.');
          const length = view.getUint32(offset, true), chunkType = view.getUint32(offset + 4, true);
          if (length % 4 || offset + 8 + length > bytes.length) throw new Error('Invalid GLB chunk bounds.');
          chunks.push({ type: chunkType, bytes: bytes.slice(offset + 8, offset + 8 + length) }); offset += 8 + length;
        }
        if (chunks[0]?.type !== 0x4e4f534a) throw new Error('GLB JSON chunk is missing.');
        gltf = parseModel(chunks[0].bytes);
      } else gltf = parseModel(bytes);
      if (gltf.asset?.version !== '2.0') throw new Error('Only glTF 2.0 is supported.');
      if ((gltf.extensionsUsed || []).some(extension => ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'].includes(extension))) throw new Error('Compressed model decoders are not yet packaged. Use an uncompressed glTF/GLB.');
      for (const entry of [...(gltf.buffers || []), ...(gltf.images || [])]) {
        if (entry.uri) {
          if (url.startsWith('data:') && !entry.uri.startsWith('data:')) throw new Error('Embedded model has unresolved external dependencies. Import a self-contained GLB or use its original URL.');
          entry.uri = await this.asset(entry.uri, 'resource', url, ancestry);
        }
      }
      const json = encoder.encode(JSON.stringify(gltf));
      if (type === 'glb') {
        const padded = new Uint8Array(Math.ceil(json.length / 4) * 4); padded.fill(32); padded.set(json); chunks[0].bytes = padded;
        bytes = new Uint8Array(12 + chunks.reduce((sum, chunk) => sum + 8 + chunk.bytes.length, 0));
        const output = new DataView(bytes.buffer); output.setUint32(0, 0x46546c67, true); output.setUint32(4, 2, true); output.setUint32(8, bytes.length, true);
        let offset = 12;
        for (const chunk of chunks) { output.setUint32(offset, chunk.bytes.length, true); output.setUint32(offset + 4, chunk.type, true); bytes.set(chunk.bytes, offset + 8); offset += 8 + chunk.bytes.length; }
        mime = 'model/gltf-binary';
      } else { bytes = json; mime = 'model/gltf+json'; }
    }
    if (bytes.length > this.maxFileBytes) throw new Error('Repacked model exceeds the per-file size limit.');
    if (!this.crypto?.subtle) throw new Error('Integrity hashing is unavailable in this environment.');
    const hash = Array.from(new Uint8Array(await this.crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
    const source = url.startsWith('data:') ? 'embedded' : (() => { const u = new URL(url); return u.protocol === 'file:' ? `bundled:${u.pathname.split('/').pop()}` : `${u.origin}${u.pathname}`; })();
    const entryKey = `${hash}:${mime}`;
    if (!this.entries.has(entryKey)) this.entries.set(entryKey, { sha256: hash, bytes: bytes.length, mime, sources: [source] });
    else if (!this.entries.get(entryKey).sources.includes(source)) this.entries.get(entryKey).sources.push(source);
    this.completed++; this.progress();
    return `data:${mime};base64,${base64(bytes)}`;
  }
}
