import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));

/** Fail the build rather than silently shipping different dependency/runtime versions. */
export function exportRuntimeAssets() {
  const descriptor = JSON.parse(fs.readFileSync(path.join(root, 'runtime-manifest.json'), 'utf8'));
  const installed = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/playcanvas/package.json'), 'utf8'));
  if (installed.version !== descriptor.engineVersion) throw new Error('Installed PlayCanvas does not match the pinned export runtime.');
  const sources = { engine: 'node_modules/playcanvas/build/playcanvas.min.js', physics: 'vendor/ammo/ammo.js', engineLicense: 'node_modules/playcanvas/LICENSE', physicsLicense: 'vendor/ammo/LICENSE' };
  const assets = new Map();
  for (const [key, source] of Object.entries(sources)) {
    const bytes = fs.readFileSync(path.join(root, source));
    if (createHash('sha256').update(bytes).digest('hex') !== descriptor.files[key].sha256) throw new Error(`Export runtime integrity mismatch: ${key}`);
    assets.set(`runtime/${descriptor.files[key].file}`, bytes);
  }
  assets.set('runtime/manifest.json', Buffer.from(JSON.stringify(descriptor, null, 2)));
  return assets;
}

export function runtimeAssetPlugin() {
  const assets = exportRuntimeAssets();
  return {
    name: 'pinned-export-runtimes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://127.0.0.1').pathname.slice(1);
        if (!assets.has(pathname)) return next();
        res.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.json') ? 'application/json' : 'text/plain');
        res.end(assets.get(pathname));
      });
    },
    generateBundle() { for (const [fileName, source] of assets) this.emitFile({ type: 'asset', fileName, source }); }
  };
}
