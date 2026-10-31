import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCapabilityRegister, generatedArtifacts } from '../scripts/capability-audit.js';

const repository = new URL('../../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, repository), 'utf8');
const register = buildCapabilityRegister();

test('capability report stays synchronized with source inventory and reviewed findings', () => {
  for (const [file, content] of generatedArtifacts()) {
    assert.equal(read(file), content, `${file} is stale; run npm run audit:capabilities`);
  }
});

test('source presence never silently certifies a gameplay behavior or AI action', () => {
  for (const item of [...register.behaviors, ...register.aiActions]) {
    assert.notEqual(item.status, 'working', `${item.id} needs explicit runtime evidence before certification`);
    assert.ok(['partial', 'experimental', 'broken', 'absent'].includes(item.status));
    assert.ok(item.notes.length > 20);
  }
  for (const item of register.behaviors) {
    assert.equal(item.verification, 'not-certified-end-to-end');
    assert.equal(item.persistence, 'partial-generic-behavior-configuration-only');
  }
});

test('inventory IDs and evidence paths are usable and reviewed features have separate lifecycle findings', () => {
  for (const group of [register.behaviors, register.aiActions, register.uiModules, register.features]) {
    assert.equal(new Set(group.map(item => item.id)).size, group.length);
  }
  const sources = register.behaviors.flatMap(item => [...item.editorRuntimeBranches, ...item.exportedRuntimeBranches])
    .concat(register.aiActions.flatMap(item => item.executorHandlers))
    .concat(register.uiModules.flatMap(item => item.controls.map(control => control.source)));
  for (const source of sources) {
    assert.ok(source.line > 0 && source.line <= read(source.file).split('\n').length, `${source.file}:${source.line}`);
  }
  for (const feature of register.features) {
    assert.ok(Object.hasOwn(register.statusDefinitions, feature.status));
    for (const field of ['editor', 'persistence', 'export', 'next', 'proof']) assert.ok(feature[field]);
    for (const file of feature.evidence) assert.ok(fs.existsSync(new URL(file, repository)), file);
  }
});

test('known no-op and missing persistence outcomes remain visible release blockers', () => {
  for (const id of ['consult_skill', 'open_tool_modal', 'create_flow_graph']) {
    assert.equal(register.aiActions.find(item => item.id === id)?.status, 'broken', id);
  }
  for (const id of ['project-save', 'publish', 'graphs']) {
    assert.equal(register.features.find(item => item.id === id)?.status, 'broken', id);
  }
  assert.ok(register.gaps.actionsMissingFromPrompt.length > 0);
  assert.equal(register.features.find(item => item.id === 'complete-game-runner')?.status, 'absent');
});
