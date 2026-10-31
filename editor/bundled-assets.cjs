const fs = require('fs/promises');
const path = require('path');
const { fileURLToPath } = require('url');
const allowed = new Set(['.glb', '.gltf', '.bin', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.wav', '.mp3', '.ogg', '.m4a']);

/** Bounded access to packaged public assets only; no general filesystem bridge. */
async function readBundledAsset(root, url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'file:' || parsed.search || parsed.hash || parsed.host) throw new Error('Unsupported bundled asset URL.');
  const base = await fs.realpath(root), target = await fs.realpath(fileURLToPath(parsed));
  const relative = path.relative(base, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !allowed.has(path.extname(target).toLowerCase())) throw new Error('Asset is outside the bundled media directory.');
  const info = await fs.stat(target);
  if (!info.isFile() || info.size > 32 * 1024 * 1024) throw new Error('Bundled asset is invalid or oversized.');
  const bytes = new Uint8Array(await fs.readFile(target));
  if (bytes.length > 32 * 1024 * 1024) throw new Error('Bundled asset is oversized.');
  return { bytes };
}
module.exports = { readBundledAsset };
