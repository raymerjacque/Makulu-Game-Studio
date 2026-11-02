# Project continuity and agent handoff

Updated: 2 November 2026. Read this before continuing development.

## Purpose and user requirements
MakuluLinux Game Studio is a PlayCanvas-based Electron/web editor. The goal is
high-quality HTML games with integrated AI. Simple mode should mainly offer chat,
preview, save/open and export; Pro mode should provide a Unity-like editor using
the same project. The eventual AI workflow must plan, build, playtest, repair,
polish and deliver a complete game, rather than perform disconnected edits.

The user has authorized continued implementation. Mark verified completed work
in `roadmap.html` and commit/push completed milestones. The user also requested
better and more varied models, meshes, textures and asset packs. That request is
planned, not delivered: see `docs/asset-library-plan.md`. Review redistribution
rights for each exact pack/version before bundling assets.

## Durable records and read order
1. `AGENTS.md`: repository rules, credentials policy and handoff maintenance.
2. This file: current state and immediate next work.
3. `roadmap.html`: canonical detailed backlog and scoped completion log.
4. `docs/project-format.md`: persistence/runtime contracts, delivered increments
   and known limits.
5. `docs/capabilities/README.md`, `register.json`, `reviews.json`: generated source
   inventory and reviewed evidence; source presence is not gameplay certification.
6. `docs/asset-library-plan.md`: content library acquisition and integration plan.

Everything tracked here exists locally and is backed up through git pushes.
A different account using this same folder can read these files. A clone on a
new machine receives tracked files, but not dependencies, credentials, chat
history, browser IndexedDB recovery snapshots or untracked local configuration.
Reinstall dependencies in `editor/` with `npm ci`; configure authentication
separately without putting secrets in repository files.

## Current implementation state
Last implementation commit before this documentation milestone: `aff8d05`
(Prepare AI model and texture batches with cancellation and rollback).

Delivered foundations, with broader phases still open:
- Credential endpoint removal, escaped AI rendering and trusted desktop access.
- Schema 1 multi-scene editable JSON with stable IDs; awaited resource readiness.
- IndexedDB recovery, dirty-state handling and replacement checkpoints.
- Terrain height-grid/heightmap persistence, terrain placement UI fixes, declared
  audio persistence and portable declared-asset embedding.
- Verified embedded PlayCanvas 2.23.3 and Ammo runtime for offline HTML export.
- Disposable Pro Play/Stop scene copies and isolated iframe Game Preview using
  the export artifact/runtime.
- Simple chat/embedded-preview workspace with essential project actions.
- Validated synchronous core AI edit batches with grouped Undo/Redo and rollback.
- Prepared model/texture batches, timeout/cancellation, stale-project guards and
  late-callback protection. Twelve action names have transactional contracts.

Not delivered: a certified complete reference game; persistent Game Brief/task
graph/autonomous runner; whole-team/prompt atomicity; full legacy action migration;
complete component/prefab persistence; broad gameplay/packaged-release
certification; new production asset packs. Existing broad README/product claims
must not be taken as proof these features work.

## Immediate next implementation milestone
Build and certify one manual collect-and-exit reference game (B08), then use it
as the target for the persistent AI workflow (B10–B12).
No reference-game implementation was made before this handoff update.

Suggested work sequence:
1. Inspect `editor/src/ui/templates-modal.js`, `core/behaviors.js` and
   `compiler/game-bundler.js` for collectibles, player movement, cameras,
   objectives, victory and restart. Check editor/export behavioral differences.
2. Create a supported starter: collect five crystals then reach an exit, with
   clear progress, a locked exit before completion, reachable layout, camera,
   physics and restart. Make it available in Simple mode as well as Pro.
3. Verify real browser gameplay, objective gating, victory and restart; save/open
   and export the same game. Test exported HTML with external network blocked.
   Primitive art may establish mechanics, but does not certify visual quality.
4. Update roadmap and contract docs, run relevant regressions, commit and push.
5. Then implement persistent Game Brief/tasks, bounded runner, gameplay checks and
   repair. Continue migrating audio/legacy tools and acquiring licensed content.

## Implementation map and project-owned prompts
- `editor/src/ai/ai-client.js`: studio AI system prompt and provider interaction.
- `editor/src/ui/ai-assistant.js`: chat/request UI and loading cancellation.
- Search the source for additional team/role prompts before changing them; source
  files are the canonical project-owned prompts, not duplicated text in this file.
- `ai/action-contract.js`, `transactional-actions.js`, `prepared-resources.js`,
  `ai-executor.js`: validation, reversible actions and staged resource loading.
- `core/editor.js`, `command-bus.js`: document orchestration and edit history.
- `project/`: schema, resource sessions, recovery and asset packaging.
- `runtime/prepare-game.js`, `preview-document.js`, `runtime-assets.js`: shared
  artifact preparation, isolated preview policy and readiness.
- `compiler/game-bundler.js`: standalone HTML runtime; many legacy behaviors
  remain duplicated in `core/behaviors.js`. Test both paths when relevant.
- `ui/simple-workspace.js`, `ui/game-preview.js`: Simple shell and preview lifecycle.
- `engine/terrain-data.js`, `ui/terrain-modal.js`: terrain geometry and UI.

Paths above are relative to `editor/src/` unless already prefixed with `editor/`.
Private platform instructions are not project-owned prompts and are not stored.
No raw chat transcript or credentials should be added for continuity.

## Last recorded validation baseline
These results belong to the preceding implementation milestone, not a fresh run:
- 199 Node tests: `cd editor && npm test`.
- 37 Simple browser assertions at both 1440px and 660px:
  `npm run test:simple-browser`; narrow `SIMPLE_VIEWPORT=660,1000`.
- 45 Play/Stop, preview and terrain browser assertions: `npm run test:play-browser`.
- 13 recovery/heightmap/embedding checks: `npm run test:recovery-browser`.
- `npm run test:offline-export`: moved-file HTML, embedded GLB, actual Ammo contact.
- `npm run build`: passes with existing large-bundle warning.
- From repo root: `node editor/scripts/capability-audit.js --check` and
  `git diff --check`. Regenerate the inventory after relevant source changes.
Browser fixtures use temporary profiles; do not automate the user's real profile.
Tests binding local ports, git writes or pushes may need environment approval.

## Standing user rule: update local context for everything
Every work session must leave the local project records current, including
investigations, plans, decisions, implementation, validation and unfinished work.
Checkpoint meaningful progress during extended work and update this handoff
before ending. This requirement is recorded in `AGENTS.md` section 5.

Latest documentation change (2 November 2026): adopted this mandatory continuity
rule. No application code changed. Documentation whitespace checks passed;
application tests were not rerun for this documentation-only change. The next
implementation action remains the reference-game inspection described above.

## Handoff update checklist
Record what changed and why, checks actually run, known failures, and next steps.
Keep detailed backlog in the roadmap and contracts in their own documents.
Check `git status` and recent history before resuming; these notes can become stale.
Never store tokens, API key values or secret-bearing console output here.
