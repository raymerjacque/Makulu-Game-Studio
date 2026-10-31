/** Declared startup resources must finish before gameplay starts. Failures never count as ready. */
export function createRuntimeAssetLoader(app, { timeoutMs = 30000 } = {}) {
  const tasks = [];
  return {
    load(url, type, apply) {
      tasks.push(new Promise(resolve => {
        let finished = false;
        const finish = error => { if (finished) return; finished = true; clearTimeout(timer); resolve(error || null); };
        const timer = setTimeout(() => finish(`A ${type} resource timed out.`), timeoutMs);
        try {
          app.assets.loadFromUrl(url, type, (error, asset) => {
            if (finished) return;
            if (error || !asset?.resource) return finish(`A ${type} resource could not load.`);
            try { apply(null, asset); finish(); } catch { finish(`A ${type} resource could not initialize.`); }
          });
        } catch { finish(`A ${type} resource could not load.`); }
      }));
    },
    async wait() {
      const errors = (await Promise.all(tasks)).filter(Boolean);
      if (errors.length) throw new Error(errors.join(' '));
      return tasks.length;
    }
  };
}
/** Start desired slots only after all resources and the game audio listener are ready. */
export function startRuntimeAudio(app) {
  for (const sound of app.root.findComponents('sound')) {
    if (!sound.enabled || !sound.entity.enabled) continue;
    for (const slot of Object.values(sound.slots || {})) {
      if (sound._studioSlotAutoPlay?.[slot.name] && slot.asset !== null && slot.asset !== undefined) {
        slot.autoPlay = true;
        sound.play(slot.name);
      }
    }
  }
}
export const RUNTIME_ASSET_CODE = [createRuntimeAssetLoader, startRuntimeAudio].map(fn => fn.toString()).join('\n');
