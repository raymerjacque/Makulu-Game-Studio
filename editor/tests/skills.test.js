import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILLS_CATALOG, getSkillsCatalog, getSkillBySlug, findSkillsByKeyword } from '../src/skills/skills-catalog.js';
import { AIExecutor } from '../src/ai/ai-executor.js';
import { Editor } from '../src/core/editor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillsRoot = path.resolve(__dirname, '../../skills');

test('Skills Library: Exactly 64 standardized micro-skills exist with valid SKILL.md frontmatter', () => {
  assert.ok(fs.existsSync(skillsRoot), 'skills/ directory exists');

  const skillDirs = fs.readdirSync(skillsRoot).filter(f => {
    const p = path.join(skillsRoot, f);
    return fs.statSync(p).isDirectory();
  });

  assert.equal(skillDirs.length, 64, `Expected 64 skill directories, found ${skillDirs.length}`);

  for (const dir of skillDirs) {
    const skillPath = path.join(skillsRoot, dir, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `Missing SKILL.md in ${dir}`);

    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.startsWith('---'), `${dir}/SKILL.md must start with YAML frontmatter ---`);

    const endFm = content.indexOf('---', 3);
    assert.ok(endFm > 3, `${dir}/SKILL.md must close frontmatter with ---`);

    const fm = content.substring(3, endFm);
    assert.ok(fm.includes('name:'), `${dir} frontmatter missing name`);
    assert.ok(fm.includes('category:'), `${dir} frontmatter missing category`);
    assert.ok(fm.includes('tags:'), `${dir} frontmatter missing tags`);
    assert.ok(fm.includes('description:'), `${dir} frontmatter missing description`);

    // Verify markdown structure
    assert.ok(content.includes('## 🎯 When to Use This Skill'), `${dir} missing When to Use section`);
    assert.ok(content.includes('## 🔑 Key Concepts & Architecture'), `${dir} missing Key Concepts section`);
  }
});

test('Skills Library: index.json and README.md are synchronized and valid', () => {
  const indexFile = path.join(skillsRoot, 'index.json');
  const readmeFile = path.join(skillsRoot, 'README.md');
  const skillbookFile = path.join(skillsRoot, 'SKILLBOOK.md');

  assert.ok(fs.existsSync(indexFile), 'skills/index.json exists');
  assert.ok(fs.existsSync(readmeFile), 'skills/README.md exists');
  assert.ok(fs.existsSync(skillbookFile), 'skills/SKILLBOOK.md exists');

  const jsonStr = fs.readFileSync(indexFile, 'utf8');
  const list = JSON.parse(jsonStr);
  assert.equal(list.length, 64, 'index.json contains 64 skills');

  const readmeStr = fs.readFileSync(readmeFile, 'utf8');
  assert.ok(readmeStr.includes('64 skills'));
  assert.ok(readmeStr.includes('addyosmani/agent-skills'));
});

test('Skills Catalog API: exports and keyword queries return expected matches', () => {
  assert.equal(SKILLS_CATALOG.length, 64);
  assert.equal(getSkillsCatalog().length, 64);

  // Lookup by exact slug
  const modelSkill = getSkillBySlug('spawn-3d-model');
  assert.ok(modelSkill);
  assert.equal(modelSkill.category, 'models-and-assets');

  const locoSkill = getSkillBySlug('character-locomotion');
  assert.ok(locoSkill);
  assert.equal(locoSkill.category, 'character-locomotion');

  // Query by keywords
  const physicsSkills = findSkillsByKeyword('physics');
  assert.ok(physicsSkills.length >= 3, `Expected at least 3 physics skills, got ${physicsSkills.length}`);

  const animSkills = findSkillsByKeyword('animation');
  assert.ok(animSkills.length >= 3, `Expected at least 3 animation skills, got ${animSkills.length}`);

  const combatSkills = findSkillsByKeyword('combat');
  assert.ok(combatSkills.length >= 3, `Expected at least 3 combat skills, got ${combatSkills.length}`);
});

test('AIExecutor processes consult_skill action without error', async () => {
  const editor = new Editor();
  const executor = new AIExecutor(editor);

  const actions = [
    { action: 'consult_skill', skill: 'spawn-3d-model' },
    { action: 'consult_skill', skill: 'character-locomotion' }
  ];

  const executed = await executor.executeActions(actions);
  assert.equal(executed.length, 2);
  assert.equal(executed[0].action, 'consult_skill');
  assert.equal(executed[0].target, 'spawn-3d-model');
  assert.equal(executed[1].target, 'character-locomotion');
});
