import * as pc from 'playcanvas';
import { ResourceLoadSession } from '../project/resource-load-session.js';

export const MATERIAL_MAPS = [['diffuseMapUrl', 'diffuseMap'], ['normalMapUrl', 'normalMap'], ['roughnessMapUrl', 'glossMap'], ['emissiveMapUrl', 'emissiveMap']];
const keyFor = (type, url) => `${type}:${url}`;

/** Load into the engine cache without attaching anything to the editable scene. */
export class PreparedResources {
  constructor(app, { timeoutMs = 30000, onChange = () => {} } = {}) {
    this.assets = new Map(); this.requests = new Set();
    this.session = new ResourceLoadSession({ timeoutMs, onChange }); this.app = app;
  }

  add(type, url) {
    const key = keyFor(type, url); if (this.requests.has(key)) return;
    if (!this.app?.assets) throw new Error('The scene asset loader is unavailable.');
    this.requests.add(key);
    this.session.add({ kind: type, entityName: `Asset ${this.requests.size}` },
      done => this.app.assets.loadFromUrl(url, type, done),
      (resource, asset) => {
        if (asset.type !== type || (type === 'texture' ? !(resource instanceof pc.Texture) : typeof resource.instantiateRenderEntity !== 'function')) throw new Error('Unexpected asset resource type.');
        this.assets.set(key, { asset, resource });
      });
  }

  collect(actions) {
    for (const action of actions) {
      if (action.action === 'spawn_model') this.add('container', action.url);
      if (action.action === 'create_material') for (const [field] of MATERIAL_MAPS) if (action[field]) this.add('texture', action[field]);
    }
  }

  async load() {
    const report = await this.session.start();
    if (report.status === 'cancelled') throw new Error('AI asset loading cancelled. No edits from this batch were applied.');
    if (report.status !== 'ready') throw new Error('AI assets could not be prepared. A required resource failed or timed out; no edits from this batch were applied. ' + report.failures.map(failure => `${failure.kind}: ${failure.reason}`).join(' '));
  }

  get(type, url) {
    const prepared = this.assets.get(keyFor(type, url));
    if (!prepared?.resource || prepared.asset.resource !== prepared.resource) throw new Error('Required prepared asset changed or is unavailable. Retry the batch.');
    return prepared.asset;
  }

  cancel() { this.session.cancel(); }
}
