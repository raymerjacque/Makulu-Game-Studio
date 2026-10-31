import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from 'playcanvas';
import { AIAssistantUI } from '../src/ui/ai-assistant.js';
import { EngineRuntime } from '../src/engine/pc-app.js';

function uiFixture() {
  const ui = Object.create(AIAssistantUI.prototype), input = { disabled: false }, send = { disabled: false }, events = [];
  ui.panel = { querySelector: selector => selector === '#ai-text-input' ? input : send };
  ui.editor = { events: { emit: (...args) => events.push(args) } };
  return { ui, input, send, events };
}

test('chat permits one request at a time and publishes a settled event after re-enabling controls', async () => {
  const { ui, input, send, events } = uiFixture(); let finish, calls = 0;
  ui.performUserPrompt = async () => { calls++; await new Promise(resolve => { finish = resolve; }); };
  const active = ui.sendUserPrompt('Create a game');
  assert.equal(ui.isBusy, true); assert.equal(input.disabled, true); assert.equal(send.disabled, true);
  await ui.sendUserPrompt('Duplicate'); assert.equal(calls, 1);
  finish(); await active;
  assert.equal(ui.isBusy, false); assert.equal(input.disabled, false); assert.equal(send.disabled, false);
  assert.deepEqual(events, [['ai:request:state', { busy: true }], ['ai:request:state', { busy: false }], ['ai:request:settled']]);
});

test('unexpected chat failures release controls and blank prompts never start a request', async () => {
  const { ui, input, events } = uiFixture();
  ui.performUserPrompt = async () => { throw new Error('Synthetic failure'); };
  await ui.sendUserPrompt(' '); assert.equal(events.length, 0);
  await assert.rejects(ui.sendUserPrompt('Try'), /Synthetic failure/);
  assert.equal(ui.isBusy, false); assert.equal(input.disabled, false); assert.equal(events.at(-1)[0], 'ai:request:settled');
});

test('atmosphere restoration uses the pinned engine fog parameter API without replacing its read-only object', () => {
  const app = new pc.AppBase({ id: 'simple-fog-test' }), options = new pc.AppOptions();
  options.graphicsDevice = new pc.NullGraphicsDevice({ width: 64, height: 64 }); options.componentSystems = []; options.resourceHandlers = []; app.init(options);
  try {
    const runtime = Object.create(EngineRuntime.prototype); runtime.app = app;
    const fog = app.scene.fog;
    runtime.setAtmosphere('sunset'); assert.equal(app.scene.fog, fog); assert.equal(fog.type, pc.FOG_EXP2); assert.equal(fog.density, 0.015);
    runtime.setAtmosphere('day'); assert.equal(fog.type, pc.FOG_NONE);
  } finally { app.destroy(); }
});
