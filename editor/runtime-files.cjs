const fs = require('fs/promises');
const path = require('path');
const descriptor = require('./runtime-manifest.json');

/** No caller-supplied path: return only this release's fixed runtime/license files. */
async function readExportRuntimes(dist, { development = false } = {}) {
  const sources = { engine: 'node_modules/playcanvas/build/playcanvas.min.js', physics: 'vendor/ammo/ammo.js', engineLicense: 'node_modules/playcanvas/LICENSE', physicsLicense: 'vendor/ammo/LICENSE' };
  const result = {};
  for (const [key, entry] of Object.entries(descriptor.files)) {
    const file = development ? path.join(dist, sources[key]) : path.join(dist, 'runtime', entry.file), stat = await fs.stat(file);
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024) throw new Error('Runtime file is invalid.');
    result[key] = await fs.readFile(file, 'utf8');
  }
  return result;
}
module.exports = { readExportRuntimes };
