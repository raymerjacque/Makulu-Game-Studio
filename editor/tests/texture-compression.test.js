import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/core/editor.js';

test('Texture compression settings persist in project JSON exports', () => {
  const editor = new Editor();
  editor.textureCompressionSettings = {
    targetFormat: 'bc7',
    qualityLevel: 'high',
    maxAnisotropy: 16,
    generateMipmaps: true
  };

  const jsonStr = editor.exportSceneJSON();
  const parsed = JSON.parse(jsonStr);

  assert.ok(parsed.textureCompression);
  assert.equal(parsed.textureCompression.targetFormat, 'bc7');
  assert.equal(parsed.textureCompression.qualityLevel, 'high');
  assert.equal(parsed.textureCompression.maxAnisotropy, 16);
  assert.equal(parsed.textureCompression.generateMipmaps, true);

  // Restore
  const editor2 = new Editor();
  editor2.loadSceneJSON(jsonStr);
  assert.equal(editor2.textureCompressionSettings.targetFormat, 'bc7');
});
