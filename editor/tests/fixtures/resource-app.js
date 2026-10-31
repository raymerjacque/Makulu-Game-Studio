import * as pc from 'playcanvas';

/** Real engine systems without a browser GPU; resource tests must not substitute fallback boxes. */
export function createResourceTestApp() {
  const app = new pc.AppBase({ id: 'resource-actions' });
  const options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.soundManager = new pc.SoundManager();
  options.componentSystems = [pc.RenderComponentSystem, pc.ParticleSystemComponentSystem, pc.CollisionComponentSystem, pc.RigidBodyComponentSystem, pc.SoundComponentSystem];
  options.resourceHandlers = [];
  app.init(options);
  return app;
}

export function provideTestAudio(app) {
  const asset = new pc.Asset('Synthetic test audio', 'audio', { url: './models/wind.wav' });
  asset.resource = new pc.Sound({ duration: 2 }); asset.loaded = true; app.assets.add(asset);
  app.assets.loadFromUrl = (url, type, done) => {
    if (type === 'audio') done(null, asset); else done('No fixture for requested resource type');
  };
}
