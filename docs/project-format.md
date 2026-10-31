# Editable project document, version 1

Implemented foundation: 31 October 2026. This format is an editable JSON document,
not yet a complete offline asset archive or a recovery system.

## User workflow

- **File → Save Project (JSON)** downloads `<project>_project.json` with all scenes
  and shared script source, rather than downloading only the active scene.
- **File → Open Project / Scene** accepts the new project format and older scene
  JSON. Legacy files migrate to a one-scene project in memory; the original file
  is not modified. Unknown formats and future schema versions are rejected.
- Stop play before opening or saving an editable project. Full play-session
  isolation remains pending; this prevents saving simulation changes as edits.
- Imported scripts are restored as text and attributes. Opening a project does
  not evaluate its script source. Full script activation/isolation is separate work.

## Document contract

| Field | Meaning |
| --- | --- |
| `format` | `makulu-game-studio-project` |
| `schemaVersion` | `1`; future versions require an explicit migration |
| `id`, `name` | Persistent project identity and display name |
| `engineVersion` | PlayCanvas version used when saving; informational, not a bundled runtime |
| `activeSceneId` | Existing scene ID to open |
| `scenes` | Nonempty array of `{ id, name, data }`; IDs and names must be unique |
| `scripts` | Project-wide mapping from script name to source text |
| `assets` | Allowlisted asset records, including existing embedded bytes when available |
| `prefabs` | Array of `{ id, data }` records from the prefab library |
| `settings` | Shadow resolution, clustered-lighting settings, audio volumes and texture-compression settings when present |
| `migration` | Optional legacy import provenance |

The scene `data` retains the existing scene representation, including supported
components, HUD, triggers, environment settings, animation configuration and
behavior properties. Version 1 adds `sceneFormatVersion`, persistent entity IDs,
local positions/rotations and script attribute metadata. World-space fields are
retained for compatibility. Current loaders prefer local fields; legacy loaders
in this release parent entities before applying world fields. The generated game
scene builder follows the same transform convention.

Scene names remain the editor's in-memory map keys. The project file adds stable
scene IDs and updates them on rename. Entity IDs survive save/open. Trigger and
behavior references still commonly use names; this is not yet a complete stable-ID
reference migration. IDs are unique within a scene, so duplicated scenes can
retain corresponding entity identities while receiving a new scene ID.

The shared script library is authoritative across scene switches. Stale script
copies in inactive scene snapshots must not replace the current library.

## Validation and replacement

`editor/src/project/project-document.js` validates JSON-compatible data, versions,
project/scene identity, all scene hierarchies, transforms, basic component and
behavior shapes, script registries, assets and prefab record identities. It rejects
unsafe prototype keys, non-finite numbers, duplicate identities and invalid active
scene references. Limits include 128 MiB of input JSON characters, nesting depth
64, hierarchy depth 48, and 100,000 entities per scene. These are defensive bounds,
not performance targets or comprehensive per-component runtime validation.

The entire document, including inactive scene structure, is validated before
adoption. Active scene construction uses a staging hierarchy. Synchronous
construction failure discards staging and keeps the previous hierarchy. Successful
replacement clears old selection/history and stale behavior entries, and refreshes
the scene list and asset cards. Old asynchronous model callbacks cannot populate a
subsequent scene. The synchronous compatibility API still reports data adoption. The asynchronous
File-menu path now awaits active-scene model/material/declared-audio loads as described below;
complete asynchronous transaction rollback and gameplay certification remain pending.

## Assets and portability

Only known asset fields are serialized; browser `File` objects, provider settings
and arbitrary extra asset properties are excluded. Local imports retain a temporary
URL alias, allowing saved model references to use completed data-URL bytes. A save
with an unresolved blob reference fails visibly rather than silently creating a
broken file. Generated model instance children are excluded because the model URL
reconstructs them; user-authored children are retained.

This implementation does **not** fetch and embed every bundled/remote model,
external glTF dependency, texture, animation or sound. Existing relative/remote URLs
remain dependencies. Keep access to those resources until full packaging lands.
Terrain and declared audio slots are covered by the later update below. Timeline
tracks, complete material/UV fields, complete prefab trees, runtime shader state,
graph semantics, and all script
execution/bindings are not certified by this format. Generated game export remains
a separate path and still has its documented portability limitations.

## Verification and next work

`editor/tests/project-document.test.js` checks fresh-editor multi-scene reopening,
script preservation, nested transforms, scene identity, behavior configuration,
script attributes, assets, prefab records, settings, legacy migration, rejected
imports, staging failure, temporary asset remapping, play guards and safe asset
labels. It also exercises collision extents and zero-valued physics using real
PlayCanvas systems with a NullGraphicsDevice, and runs the exported scene builder.

Next: extend readiness beyond restored model/material requests; finish missing
component/resource persistence and stable references; implement complete dependency packaging; add
atomic desktop saves, browser durable storage, saved/dirty state and rolling
recovery snapshots. Test real imported animated content and the full interactive
file workflow before declaring the P1 phase complete.

## Active-scene resource readiness update

The synchronous `loadProjectJSON` method remains a compatibility/data-adoption
API. The File menu now uses `await editor.openProjectJSON(...)`, which waits for
all registered model containers and material textures in the active scene. Its
report distinguishes `ready`, `failed`, `cancelled` and `invalid`, with a separate
`dataLoaded` flag. A missing model does not erase the restored project data and
is never reported as a fully successful open. `project:loaded` still denotes data
adoption; `project:resources:settled` denotes completion of the awaited checks.

`scene:resources` reports actual success/pending counts and failures identified
by entity and resource kind, without including raw provider errors or URLs. The
scene status label displays progress and missing assets; **Retry assets** reloads
the current scene while retaining its edited data, identities and script library.
Retry clears undo history because it reconstructs scene entity instances. The
Play control waits for this restoration to be ready. Superseding a scene cancels
the old wait, and late callbacks cannot apply to its replacement. Requests default
to a 30-second timeout, configurable via `assetTimeoutMs` for the API and tests.

Diffuse, normal, roughness and emissive texture references now restore and load
in both editor and exported scene builders. Roughness maps bind through
PlayCanvas's gloss texture with inversion. Manual diffuse-map application records
its source URL for saving. These changes do not certify every material property,
UV/channel setting, animation outcome or final rendered appearance.

Readiness currently covers registered model-container and material-texture loads
for the active scene restoration. It does not preload inactive scenes, certify standalone asset-library records or
newly imported files, test game scripts, validate gameplay or make exported games
offline-ready. Declared audio slots now join the restoration path in the update below.
Missing resources keep adopted project data available for correction; asynchronous
failures do not roll the whole open back. Actual transport abort and comprehensive
GPU/asset ownership cleanup remain separate work.

Regression checks live in `editor/tests/resource-readiness.test.js`: deferred and
cached completion, progress, failure, timeout, cancellation, stale callbacks,
retry preservation, UI/play guards, and real engine texture slots plus their
exported scene-builder bindings.

## Local recovery and file-state tracking update

The editor now initializes an origin-local IndexedDB recovery store after the
runtime and asset browser exist. It samples the editable project every 15 seconds
while the app is running, and requests a checkpoint when the document becomes
hidden. Common editor changes mark the file state dirty immediately. Sampling
also catches older tools that mutate serialized project data without events.
This is periodic recovery, not a guarantee that the final keystroke survives a
crash, forced quit or power loss.

The top bar distinguishes **Unsaved changes**, **No changes since open**,
**No changes since download**, and **Recovered · save a file**, alongside local
recovery status. Download means the browser download was requested; the browser
does not confirm that the user completed writing the file. A recovery snapshot
never clears unsaved state. Undoing back to the tracked document baseline clears
dirty state on the next comparison. Only data covered by version 1 serialization
participates in comparison/recovery; unsupported timeline/resource state
is not made recoverable by this feature.

History retains up to five snapshots per project and twenty overall. Writing a
snapshot and pruning older records use one IndexedDB transaction; an aborted
write leaves the previous records intact. Captured data is the editable project,
not AI provider settings or the credential store. Storage access, quota or
serialization failure is visible and does not report a successful recovery write.
Recovery history is device/profile/origin-local. Clearing browser/app data removes
it, and switching origin or development port can make another history visible.

On startup, existing snapshots are announced without replacing the current scene.
Use **File → Local Recovery Snapshots** to review, restore or delete a snapshot.
Restoring uses the validated project loader and resource-readiness checks. Current
unsaved work must first be checkpointed successfully; otherwise restoration/file
replacement is blocked until the user protects it with a project download or fixes
storage. A restored project remains dirty until explicitly downloaded.

The File-menu open path uses the same checkpoint protection before replacement.
Low-level import APIs used by tests/integrations do not automatically protect an
existing document: callers must use the persistence guard before intentional
replacement. Concurrent snapshot completion cannot mark a newer opened project
as recovered or clean. Snapshot writes are serialized, and edits made while a
write is pending remain eligible for the next checkpoint.

Active play sessions and in-flight scene restoration are excluded from recovery.
Full play/stop isolation is still pending; edits or mutations left in the canonical
scene after stopping are not automatically distinguished from authoring changes.
Before leaving, the browser requests its normal unsaved-changes warning. Electron
provides an explicit keep-editing/close-without-saving choice instead of trapping
a dirty window. Unload is not used as a promise of a completed asynchronous save.

**Verification:** `editor/tests/project-recovery.test.js` exercises dirty/download
state, direct edits, undo, restart/restore, protected replacement, corruption,
storage failures, play/loading exclusions, pending writes and close policy. Run
`cd editor && npm run test:recovery-browser` for real Chromium IndexedDB checks of
persistence across connections, bounded retention, deletion and atomic rollback
on an uncloneable write. The browser check uses synthetic data, a disposable
profile and a loopback-only test server; set `CHROME_BIN` if needed. Actual quota
exhaustion, packaged Electron crash recovery and a complete interactive restart
remain separate verification work.

Still pending: atomic native project-file writes, complete resource coverage,
pre-AI transaction checkpoints, explicit revision management, exportable backups,
and full performance/retention testing with large real projects. Local recovery
is not cloud backup and does not complete the P1 release gate.

## Terrain and declared audio persistence update

Terrain entities now serialize a versioned `terrain` record with dimensions,
subdivision count, generator parameters and the **final height grid**. Restoration
uses those saved samples rather than regenerating random terrain. The same mesh
builder is embedded into exported games. Generated terrain has a mesh collision
source bound to that geometry and a static rigidbody. Its creation is one undoable
operation. Duplicated terrain owns rebuilt mesh/collider resources. These bindings
are tested with real engine systems, but Ammo contact behavior, traversal, large
terrain performance and visual quality still need full runtime certification.

Seed zero and zero-height terrain are valid, and the noise brush is repeatable
for a given seed. Heightmap uploads now decode into normalized grayscale/alpha
samples at the selected subdivision resolution; they no longer merely report a
filename as loaded. Changing resolution requires reimporting the map. Generation
stores the final grid, so the original image is not required to reopen the terrain.
Bounds reject invalid dimensions, oversized subdivision counts and malformed
height grids before project replacement. Old files that never stored terrain
samples cannot recover that missing geometry automatically; regenerate it once
with the updated editor before saving.

Sound documents now include explicit source/slot definitions: name, URL, volume,
pitch, loop, desired autoplay, overlap, start time and duration. Component-level
volume/pitch, positional attenuation and enabled state also persist. Existing
registered slots derive their source from the asset registry; a slot with an
asset ID but no recoverable source fails saving rather than losing the reference.
Legacy `assetUrl` configurations migrate to a main slot. Unsupported slot names,
duplicates and invalid parameter types are rejected by project validation.

Opening a project queues declared audio sources alongside models and textures.
Missing audio therefore produces a resource failure with the entity/slot identity,
retains its URL for correction, and participates in Retry assets. Imported editor
slots stay silent until Play even when desired autoplay is saved as true; Stop
stops scene sounds. The AI `add_sound` action and inspector source field now load
and configure actual slots. Configuring one source does not clear unrelated
resource failures. Exported scene builders bind the same slot definitions, and
the game camera has an audio listener. Actual audible playback and browser/device
unlock behavior remain part of interactive runtime testing, not proven by the
headless slot tests.

Both editable-project and HTML export paths resolve completed local-import URL
aliases to existing embedded bytes for model, texture and audio references. An
unresolved blob reference fails visibly. This does not fetch remote dependencies
or vendor the engine; full portable packaging is still pending.

Native entity tags are now kept through the engine's tag API while project JSON
continues to store tag arrays. This corrects an existing duplication failure;
duplication no longer substitutes an empty entity if engine cloning fails. Audio
playback metadata and generated model markers also survive duplication.

Checks: `editor/tests/terrain-and-sound-persistence.test.js` exercises terrain
geometry/collision sources, exported reconstruction, undo/redo, independent terrain
copies, invalid inactive scenes, audio slot restoration/readiness, AI configuration,
duplication, missing audio, preserved unrelated failures and local-import aliases.
`npm run test:recovery-browser` now includes three real PNG decoding/error checks
in addition to the seven IndexedDB checks.

Still outside this increment: complete prefab trees and terrain/audio prefab
instantiation, arbitrary custom meshes, timeline persistence, every material/UV
property, complete inactive-scene preload, dependency archives, full audio/physics
playtests and play-session isolation. Recovery includes the newly serialized
terrain/audio data, but inherits all other version 1 limits.
