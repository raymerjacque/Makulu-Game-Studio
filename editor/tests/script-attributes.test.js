import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScriptAttributes } from '../src/core/script-attributes.js';
import { Editor } from '../src/core/editor.js';

test('parseScriptAttributes extracts number, boolean, string, color attributes correctly', () => {
  const code = `
    var MyCharacter = pc.createScript('myCharacter');
    MyCharacter.attributes.add('speed', { type: 'number', default: 12.5, title: 'Movement Speed', min: 0, max: 100, step: 0.5 });
    MyCharacter.attributes.add('isInvincible', { type: 'boolean', default: true, title: 'Invincible' });
    MyCharacter.attributes.add('playerName', { type: 'string', default: 'Hero', title: 'Player Name' });
    MyCharacter.attributes.add('auraColor', { type: 'color', default: [1, 0, 0], title: 'Aura Color' });
  `;

  const attrs = parseScriptAttributes(code);
  assert.equal(attrs.length, 4);

  assert.equal(attrs[0].name, 'speed');
  assert.equal(attrs[0].type, 'number');
  assert.equal(attrs[0].default, 12.5);
  assert.equal(attrs[0].title, 'Movement Speed');
  assert.equal(attrs[0].min, 0);
  assert.equal(attrs[0].max, 100);

  assert.equal(attrs[1].name, 'isInvincible');
  assert.equal(attrs[1].type, 'boolean');
  assert.equal(attrs[1].default, true);

  assert.equal(attrs[2].name, 'playerName');
  assert.equal(attrs[2].type, 'string');
  assert.equal(attrs[2].default, 'Hero');

  assert.equal(attrs[3].name, 'auraColor');
  assert.equal(attrs[3].type, 'color');
});

test('Script attributes persist in scene JSON serialization', () => {
  const editor = new Editor();
  const ent = editor.createEntity({ name: 'ScriptedEntity' });
  editor.addComponent(ent, 'script');

  ent.scriptData = {
    rotateScript: {
      speed: 45,
      axis: 'y'
    }
  };

  const jsonStr = editor.exportSceneJSON();
  const parsed = JSON.parse(jsonStr);

  const scriptedChild = parsed.root.children.find(c => c.name === 'ScriptedEntity');
  assert.ok(scriptedChild);
  assert.ok(scriptedChild.components.script);
  assert.equal(scriptedChild.components.script.attributes.rotateScript.speed, 45);
});
