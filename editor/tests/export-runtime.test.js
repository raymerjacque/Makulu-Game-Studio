import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import * as pc from 'playcanvas';
import { exportRuntimeAssets } from '../build-support/runtime-assets.js';
import { EXPORT_RUNTIME, loadExportRuntimes } from '../src/compiler/runtime-bundle.js';
import { Editor } from '../src/core/editor.js';
import { GameBundler } from '../src/compiler/game-bundler.js';
import { bindEditorPhysics } from '../src/engine/editor-physics.js';

const assets = exportRuntimeAssets();
const verified = () => loadExportRuntimes({ crypto: webcrypto, readText: file => assets.get(`runtime/${file}`).toString('utf8') });

test('runtime distribution uses the installed pinned engine and verifies physics and both license notices', async () => {
  const bundle = await verified();
  assert.equal(bundle.descriptor.engineVersion, pc.version); assert.equal(EXPORT_RUNTIME.physicsFormat, 'asm.js');
  assert.ok(bundle.engine.length > 1000000); assert.ok(bundle.physics.length > 1000000);
  assert.ok(bundle.engineLicense.includes('Permission is hereby granted')); assert.ok(bundle.physicsLicense.includes('ammo.js contributors'));
  assert.equal(assets.size, 5);
});

test('missing or changed runtime bytes fail integrity verification instead of generating a broken export', async () => {
  await assert.rejects(loadExportRuntimes({ crypto: webcrypto, readText: () => 'changed' }), /integrity check/);
  await assert.rejects(loadExportRuntimes({ crypto: webcrypto, readText: () => null }), /unavailable/);
});

test('embedded HTML has no runtime script URLs and includes pinned provenance and license notices', async () => {
  const editor = new Editor(), bundle = await verified();
  const html = new GameBundler(editor).compileStandaloneHTML({ runtimeBundle: bundle, embeddedAssets: [] });
  assert.ok(!/<script\b[^>]*\bsrc=/i.test(html));
  const manifest = JSON.parse(html.match(/id="makulu-export-manifest" type="application\/json">([^<]+)</)[1]);
  assert.equal(manifest.mode, 'embedded'); assert.equal(manifest.runtime.engineVersion, pc.version);
  const licenses = JSON.parse(html.match(/id="makulu-runtime-licenses" type="application\/json">([^<]+)</)[1]);
  assert.ok(licenses.ammo.includes('ammo.js contributors')); assert.ok(licenses.playcanvas.includes('Permission is hereby granted'));
});

test('real pinned physics initializes before engine world creation and authoring pauses while Play advances bodies', async () => {
  const bundle = await verified();
  const factory = vm.runInNewContext(bundle.physics + '\nAmmo;', { console, setTimeout, clearTimeout });
  const previous = globalThis.Ammo; globalThis.Ammo = await factory();
  const app = new pc.AppBase({ id: 'real-ammo' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 });
  options.componentSystems = [pc.CollisionComponentSystem, pc.RigidBodyComponentSystem]; options.resourceHandlers = [];
  app.init(options);
  try {
    app.systems.rigidbody.setPhysicsWorld(new pc.AmmoPhysicsWorld());
    const editor = new Editor(); editor.runtime = { app };
    bindEditorPhysics(app, editor.events);
    const body = new pc.Entity('Falling'); body.setPosition(0, 3, 0); app.root.addChild(body);
    body.addComponent('collision', { type: 'sphere', radius: 0.5 }); body.addComponent('rigidbody', { type: 'dynamic', mass: 1 });
    for (let i = 0; i < 30; i++) app.systems.rigidbody.onUpdate(1 / 60);
    assert.equal(body.getPosition().y, 3);
    editor.events.emit('game:play'); for (let i = 0; i < 30; i++) app.systems.rigidbody.onUpdate(1 / 60);
    assert.ok(body.getPosition().y < 2.5);
    editor.events.emit('game:stop'); const stopped = body.getPosition().y;
    for (let i = 0; i < 30; i++) app.systems.rigidbody.onUpdate(1 / 60);
    assert.equal(body.getPosition().y, stopped);
  } finally { app.destroy(); globalThis.Ammo = previous; }
});

test('serialization keeps locally enabled children enabled beneath a disabled ancestor', () => {
  const app = new pc.AppBase({ id: 'local-enabled' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 }); options.componentSystems = []; options.resourceHandlers = []; app.init(options);
  try {
    const editor = new Editor(); editor.runtime = { app };
    const parent = editor.createEntity({ name: 'DisabledParent' }), child = editor.createEntity({ name: 'EnabledChild', parent });
    parent.enabled = false;
    const scene = JSON.parse(editor.exportSceneJSON());
    assert.equal(scene.root.children[0].enabled, false); assert.equal(scene.root.children[0].children[0].enabled, true);
    assert.equal(editor.loadProjectJSON(editor.exportProjectJSON()), true);
    const restored = app.root.findByName('DisabledParent'); restored.enabled = true;
    assert.equal(app.root.findByName('EnabledChild').enabled, true);
  } finally { app.destroy(); }
});
