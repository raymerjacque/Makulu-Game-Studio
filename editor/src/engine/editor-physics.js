/** Authoring must not silently simulate bodies once the real physics backend is available. */
export function bindEditorPhysics(app, events) {
  const physics = app.systems.rigidbody;
  if (!physics?.physicsWorld) throw new Error('Editor physics backend is unavailable.');
  physics.timeScale = 0;
  const disposePlay = events.on('game:play', () => { physics.timeScale = 1; });
  const disposeStop = events.on('game:stop', () => { physics.timeScale = 0; });
  const dispose = () => { disposePlay(); disposeStop(); };
  app.once('destroy', dispose);
  return dispose;
}
