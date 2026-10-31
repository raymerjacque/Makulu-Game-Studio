import descriptor from '../../runtime-manifest.json' with { type: 'json' };
export const EXPORT_RUNTIME = descriptor;

/** Runtime bytes are read only from the installed application and checked against pinned hashes. */
export async function loadExportRuntimes({ readText, crypto = globalThis.crypto, baseUrl = globalThis.document?.baseURI } = {}) {
  let texts;
  if (readText) texts = Object.fromEntries(await Promise.all(Object.entries(descriptor.files).map(async ([key, entry]) => [key, await readText(entry.file)])));
  else if (globalThis.window?.makuluDesktop?.getExportRuntimes) texts = await window.makuluDesktop.getExportRuntimes();
  else texts = Object.fromEntries(await Promise.all(Object.entries(descriptor.files).map(async ([key, entry]) => {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(new URL(`runtime/${entry.file}`, baseUrl), { credentials: 'omit', redirect: 'error', signal: controller.signal });
      if (!response.ok || Number(response.headers.get('content-length')) > 8 * 1024 * 1024) throw new Error('Missing runtime.');
      const text = await response.text();
      if (text.length > 8 * 1024 * 1024) throw new Error('Runtime size limit.');
      return [key, text];
    } finally { clearTimeout(timeout); }
  })));
  if (!texts || !crypto?.subtle) throw new Error('Pinned runtime files or integrity checking are unavailable.');
  for (const [key, entry] of Object.entries(descriptor.files)) {
    if (typeof texts[key] !== 'string') throw new Error(`Bundled ${key} runtime is unavailable.`);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texts[key]))), value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== entry.sha256) throw new Error(`Bundled ${key} runtime failed its integrity check.`);
  }
  return { ...texts, descriptor };
}

/** Initialize the same physics build before editor application creation. */
export async function initializeEditorPhysics() {
  const bundle = await loadExportRuntimes();
  const script = document.createElement('script'); script.textContent = bundle.physics;
  document.head.appendChild(script); script.remove();
  if (typeof globalThis.Ammo !== 'function') throw new Error('Physics factory did not load.');
  globalThis.Ammo = await globalThis.Ammo();
  if (typeof globalThis.Ammo.btVector3 !== 'function') throw new Error('Physics initialization failed.');
}
