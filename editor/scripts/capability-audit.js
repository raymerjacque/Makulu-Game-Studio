import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BEHAVIOR_CATALOG } from '../src/ui/inspector.js';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const read = file => fs.readFileSync(path.join(repository, file), 'utf8');
const lineAt = (text, index) => text.slice(0, index).split('\n').length;
const reference = (file, text, match) => ({ file, line: lineAt(text, match.index) });
const unique = values => [...new Set(values)].sort();
const extract = (file, expression) => {
  const text = read(file);
  return [...text.matchAll(expression)].map(match => ({ id: match[1], source: reference(file, text, match) }));
};
const runtimeFile = 'editor/src/core/behaviors.js';
const exportFile = 'editor/src/compiler/game-bundler.js';
const executorFile = 'editor/src/ai/ai-executor.js';
const promptFile = 'editor/src/ai/ai-client.js';
const branchPattern = () => /b\.type\s*===\s*['"]([\w-]+)['"]/g;
const reviewPath = 'docs/capabilities/reviews.json';

/** Inventory signals describe source presence, never successful execution. */
export function buildCapabilityRegister() {
  const reviews = JSON.parse(read(reviewPath));
  const runtime = extract(runtimeFile, branchPattern());
  const exported = extract(exportFile, branchPattern());
  const actions = extract(executorFile, /case\s+['"]([\w-]+)['"]\s*:/g);
  const promptActions = extract(promptFile, /^\d+\.\s+"([\w-]+)":/gm);
  const tests = fs.readdirSync(path.join(repository, 'editor/tests')).filter(name => name.endsWith('.test.js'));
  const testSources = tests.map(name => ({ file: `editor/tests/${name}`, text: read(`editor/tests/${name}`) }));
  const mentions = id => testSources.filter(item => new RegExp(`['"\\x60]${id}['"\\x60]`).test(item.text)).map(item => item.file);
  const evidence = (items, id) => items.filter(item => item.id === id).map(item => item.source);
  const applyReview = (kind, id, fallback) => ({ status: 'experimental', notes: fallback, ...reviews[kind]?.[id] });
  const behaviorIds = unique([...BEHAVIOR_CATALOG.map(item => item.type), ...runtime.map(item => item.id), ...exported.map(item => item.id)]);
  const behaviors = behaviorIds.map(id => {
    const entry = BEHAVIOR_CATALOG.find(item => item.type === id);
    return {
      id, name: entry?.name || id, inspectorExposed: Boolean(entry), defaultParams: entry?.defaultParams || {},
      editorRuntimeBranches: evidence(runtime, id), exportedRuntimeBranches: evidence(exported, id),
      persistence: 'partial-generic-behavior-configuration-only', verification: 'not-certified-end-to-end',
      ...applyReview('behaviors', id, 'Source inventoried; behavior semantics, combinations, reset, save/open and delivered gameplay require certification.'),
      testMentions: mentions(id)
    };
  });
  const aiActions = unique(actions.map(item => item.id)).map(id => ({
    id, executorHandlers: evidence(actions, id), advertisedInSystemPrompt: promptActions.some(item => item.id === id),
    verification: 'handler-presence-only',
    ...applyReview('actions', id, 'Handler exists; payload validation, transactional undo, failure reporting and gameplay results are not certified.'),
    testMentions: mentions(id)
  }));
  const uiFiles = fs.readdirSync(path.join(repository, 'editor/src/ui')).filter(name => name.endsWith('.js')).sort();
  const uiModules = uiFiles.map(name => {
    const file = `editor/src/ui/${name}`;
    const text = read(file);
    const declarations = [...text.matchAll(/<(button|input|select|textarea|a)\b[^>]*>/g)];
    const controls = declarations.map(match => {
      const attributes = match[0];
      return {
        element: match[1], id: attributes.match(/\bid="([^"]*)"/)?.[1] || null,
        classes: attributes.match(/\bclass="([^"]*)"/)?.[1] || null,
        dataAttributes: [...attributes.matchAll(/\b(data-[\w-]+)="([^"]*)"/g)].map(item => ({ name: item[1], value: item[2] })),
        source: reference(file, text, match), verification: 'template-declaration-only'
      };
    });
    return { id: name.replace(/\.js$/, ''), source: file, controls,
      ...applyReview('ui', name.replace(/\.js$/, ''), 'UI source inventoried; interaction, persistence and export are not certified. See related feature findings.'),
      verification: 'source-inventory-only' };
  });
  const known = { behaviors: new Set(behaviorIds), actions: new Set(aiActions.map(item => item.id)), ui: new Set(uiModules.map(item => item.id)) };
  for (const kind of Object.keys(known)) for (const id of Object.keys(reviews[kind] || {})) {
    if (!known[kind].has(id)) throw new Error(`Stale review: ${kind}/${id}`);
  }
  return {
    schemaVersion: 1, reviewDate: '2026-10-31', purpose: 'P0.1/B02 baseline inventory; not a runtime tool schema or a certification list.',
    statusDefinitions: {
      working: 'Verified for the explicitly stated scope; does not imply a complete game workflow.',
      partial: 'Implemented in part, with a concrete known limitation.',
      experimental: 'Source exists, but semantic and end-to-end behavior is not certified.',
      broken: 'A specific advertised outcome is contradicted by current implementation or a reproduced failure.',
      absent: 'Required functionality has no implementation in the inspected path.'
    },
    methodology: [
      'Behavior union includes inspector catalog entries and literal b.type equality branches in both runtimes.',
      'AI inventory includes literal executor switch cases and numbered system-prompt action declarations.',
      'UI inventory includes every UI module and literal button/input/select/textarea/anchor opening tag. Dynamic IDs and templates are retained as patterns, not expanded instances.',
      'Source scanners are conservative inventory aids, not JavaScript parsers. Computed dispatch, programmatic controls and semantic correctness require manual review.',
      'Test mentions are literal name references only, not test execution, coverage or proof of gameplay.',
      'Persistence is evaluated separately from source/runtime presence. No behavior is certified merely because generic properties serialize.',
      'Explicit reviews override conservative experimental defaults. Runtime certification remains a P6/P7 task.'
    ],
    summary: {
      inspectorBehaviors: BEHAVIOR_CATALOG.length, behaviorUnion: behaviors.length,
      aiActions: aiActions.length, advertisedActions: promptActions.length, uiModules: uiModules.length,
      literalControlTemplates: uiModules.reduce((count, item) => count + item.controls.length, 0)
    },
    gaps: {
      inspectorWithoutEditorBranch: behaviors.filter(item => item.inspectorExposed && !item.editorRuntimeBranches.length).map(item => item.id),
      inspectorWithoutExportBranch: behaviors.filter(item => item.inspectorExposed && !item.exportedRuntimeBranches.length).map(item => item.id),
      runtimeWithoutInspector: behaviors.filter(item => !item.inspectorExposed).map(item => item.id),
      actionsMissingFromPrompt: aiActions.filter(item => !item.advertisedInSystemPrompt).map(item => item.id),
      promptWithoutHandler: promptActions.filter(item => !actions.some(action => action.id === item.id)).map(item => item.id)
    },
    features: reviews.features, behaviors, aiActions, uiModules
  };
}

const cell = value => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const refs = sources => sources.map(source => `[${source.file}:${source.line}](../../${source.file}#L${source.line})`).join(', ') || 'None detected';
export function renderCapabilityReport(register) {
  const s = register.summary;
  const rows = ['# Game Studio capability register', '',
    'Baseline review: 31 October 2026. Generated by `npm run audit:capabilities` in `editor/`.', '',
    '**This is an evidence inventory, not a claim that these features work end to end.** No game behavior is certified by source presence, attachment tests, or generated HTML text.', '',
    `Inventory: **${s.inspectorBehaviors} inspector behaviors**, **${s.behaviorUnion} runtime/catalog behavior IDs**, **${s.aiActions} AI actions**, **${s.uiModules} UI modules**, **${s.literalControlTemplates} literal control templates**.`, '',
    '## How to use this register', '',
    'Update `docs/capabilities/reviews.json` for reviewed findings, then regenerate. Commit both the JSON inventory and this report. `npm run audit:capabilities:check` fails if either generated artifact is stale. Literal test mentions are navigation aids only. See the JSON for control templates, defaults, source locations, methodology and status definitions.', '',
    'Do not use this baseline JSON as an executable AI tool contract. P5 must introduce validated, typed capabilities and P6/P7 must certify real outcomes.', '',
    '## Reviewed feature matrix', '', '| Feature | Status | Editor / runtime | Save / open | Export | Next proof or repair |', '| --- | --- | --- | --- | --- | --- |'];
  for (const f of register.features) rows.push(`| ${cell(f.name)} | ${f.status} | ${cell(f.editor)} | ${cell(f.persistence)} | ${cell(f.export)} | ${cell(f.next)} |`);
  rows.push('', '### Review evidence', '');
  for (const f of register.features) rows.push(`- **${f.id}:** ${f.evidence.map(file => `[${file}](../../${file})`).join(', ')}. ${f.proof}`);
  rows.push('', '## Detected source gaps', '');
  for (const [kind, ids] of Object.entries(register.gaps)) rows.push(`- **${kind}:** ${ids.length ? ids.map(id => `\`${id}\``).join(', ') : 'None detected by this scanner.'}`);
  rows.push('', '## Behavior inventory', '', '| Behavior | Status | Editor branch | Export branch | Finding |', '| --- | --- | --- | --- | --- |');
  for (const b of register.behaviors) rows.push(`| ${cell(b.id)} | ${b.status} | ${refs(b.editorRuntimeBranches)} | ${refs(b.exportedRuntimeBranches)} | ${cell(b.notes)} |`);
  rows.push('', '## AI action inventory', '', '| Action | Status | In prompt | Handler evidence | Finding |', '| --- | --- | --- | --- | --- |');
  for (const a of register.aiActions) rows.push(`| ${a.id} | ${a.status} | ${a.advertisedInSystemPrompt ? 'Yes' : 'No'} | ${refs(a.executorHandlers)} | ${cell(a.notes)} |`);
  rows.push('', '## Editor UI inventory', '', '| Module | Status | Control templates | Finding |', '| --- | --- | --- | --- |');
  for (const u of register.uiModules) rows.push(`| [${u.id}](../../${u.source}) | ${u.status} | ${u.controls.length} | ${cell(u.notes)} |`);
  rows.push('', '## Certification backlog', '',
    '1. Repair complete project persistence: every scene, script attachment, asset and reference.',
    '2. Route edits through awaited, reversible transactions and isolate play sessions.',
    '3. Extract one shared preview/export runtime and certify a focused gameplay set.',
    '4. Replace no-op and partial advanced features or hide them from release claims.',
    '5. Introduce typed AI tools with real project context, task persistence and bounded repair.',
    '6. Verify complete reference games and portable exports outside the editor.', '',
    'Certification requires recorded test scope, exact revision, observable gameplay results, save/open and export checks. Update reviewed statuses only when that evidence exists.', '');
  return rows.join('\n');
}

export function generatedArtifacts() {
  const register = buildCapabilityRegister();
  return new Map([
    ['docs/capabilities/register.json', JSON.stringify(register, null, 2) + '\n'],
    ['docs/capabilities/README.md', renderCapabilityReport(register)]
  ]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  let stale = false;
  for (const [file, content] of generatedArtifacts()) {
    const destination = path.join(repository, file);
    if (check) {
      if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== content) {
        console.error(`Stale capability artifact: ${file}`); stale = true;
      }
    } else fs.writeFileSync(destination, content);
  }
  if (stale) process.exitCode = 1;
  else console.log(check ? 'Capability artifacts are current.' : 'Capability register and report generated.');
}
