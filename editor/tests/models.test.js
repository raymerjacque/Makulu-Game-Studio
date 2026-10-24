import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODEL_CATALOG } from '../src/store/model-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelsDir = path.resolve(__dirname, '../public/models');

test('All catalog models exist and are valid glTF 2.0 GLB files', () => {
  assert.ok(MODEL_CATALOG.length >= 19, `Expected at least 19 catalog models, got ${MODEL_CATALOG.length}`);

  for (const item of MODEL_CATALOG) {
    const filename = path.basename(item.url);
    const filePath = path.join(modelsDir, filename);

    assert.ok(fs.existsSync(filePath), `Model file not found: ${filePath} for item ${item.name} (${item.id})`);

    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 1000, `Model file ${filename} appears too small (${stat.size} bytes)`);

    const buffer = fs.readFileSync(filePath);
    const magic = buffer.toString('utf8', 0, 4);
    assert.equal(magic, 'glTF', `File ${filename} must have glTF magic header`);

    const version = buffer.readUInt32LE(4);
    assert.equal(version, 2, `File ${filename} must be glTF 2.0`);

    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonChunkType = buffer.readUInt32LE(16);
    assert.equal(jsonChunkType, 0x4E4F534A, `File ${filename} chunk 0 must be JSON (0x4E4F534A)`);

    const jsonStr = buffer.toString('utf8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);

    assert.ok(gltf.asset, `File ${filename} missing glTF asset metadata`);
    assert.equal(gltf.asset.version, '2.0', `File ${filename} glTF version must be 2.0`);

    // Verify all images are embedded bufferViews or valid local files
    if (gltf.images) {
      for (const img of gltf.images) {
        if (img.bufferView !== undefined) {
          assert.ok(typeof img.bufferView === 'number', `Image bufferView must be number in ${filename}`);
        } else if (img.uri) {
          const imgPath = path.join(modelsDir, img.uri);
          assert.ok(fs.existsSync(imgPath), `Referenced texture ${img.uri} must exist for ${filename}`);
        } else {
          assert.fail(`Image in ${filename} must specify bufferView or valid uri`);
        }
      }
    }
  }
});

test('Hero and Enemy Warrior character models are self-contained with embedded textures', () => {
  const heroPath = path.join(modelsDir, 'character_hero.glb');
  const warriorPath = path.join(modelsDir, 'character_warrior.glb');

  [heroPath, warriorPath].forEach(modelPath => {
    const buffer = fs.readFileSync(modelPath);
    const jsonLength = buffer.readUInt32LE(12);
    const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength));

    assert.ok(gltf.images && gltf.images.length > 0, `Character ${path.basename(modelPath)} should have embedded textures`);
    assert.ok(gltf.images[0].bufferView !== undefined, `Character ${path.basename(modelPath)} texture must be packed in binary bufferView`);
    assert.equal(gltf.images[0].mimeType, 'image/png');
  });
});
