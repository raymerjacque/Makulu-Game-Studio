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

## Declared-asset packaging update

The File menu now provides **Save Portable Project (assets included)** in addition
to the lightweight JSON save. It captures the current project revision and embeds
declared models, material maps, audio, asset-library records and supported prefab
references across every scene. Standard glTF buffer/image URIs are resolved from
the model's original URL and embedded recursively. GLB JSON chunks are rewritten
while existing binary chunks are retained. Completed local imports are reused.
Provided author/license/attribution/pack metadata survives the project package;
packaging does not independently verify those rights.

The output includes a versioned asset manifest with SHA-256 hashes, MIME types,
byte counts and source identifiers. Query strings, URL user credentials and full
local file paths are not copied into manifest source identifiers. Provider settings,
script URLs and provenance links are not fetched as media dependencies. Requests
omit credentials, do not follow redirects and have a 20-second default timeout.
Limits currently include 32 MiB per downloaded/repacked asset, 64 MiB total input,
2,048 dependency entries and a bounded single-file JSON output. Missing files,
blocked/CORS downloads, unresolved blob dependencies, cycles, unsupported model
compression and size-budget failures stop the operation without downloading a
partial artifact. Existing project content is not rewritten while packaging.

Desktop file access uses a narrow trusted-renderer IPC route that can read only
approved media files within the built application's `dist` directory. It rejects
outside paths, symlink escapes, unsupported extensions and oversized files. It is
not an arbitrary local-file reader. Actual packaged-desktop packaging still needs
an installation smoke test; boundary tests cover the helper and unauthorized IPC.

The HTML-game File action now packages the **active scene's declared assets**
before compiling. It excludes unrelated editor library data and escapes embedded
scene JSON so source text cannot terminate the surrounding script tag. **Engine
and physics scripts still load over the internet.** The UI says this explicitly;
this increment does not deliver a universally offline single HTML game or a
folder/ZIP export. The synchronous compiler API remains available for tests and
existing callers; the new File-menu path performs the asynchronous asset collection.

Only schema-defined references are collected. Hard-coded URLs inside custom
scripts, arbitrary behavior parameters, unsupported prefab/resource structures,
external decoder packages and runtime-generated downloads are outside this scope.
Embedded glTF files with missing external origins and Draco/meshopt/Basis models
are rejected until their dependency/decoder workflows are supported. This is
asset embedding, not model artistic-quality certification or a complete game
playtest. Large projects still need a deduplicated archive format.

Async download completion uses the original source revision for dirty tracking,
so edits made while assets are collected remain unsaved. If the user opens a
different project during collection, its file baseline is not changed by the old
operation. Local recovery snapshots continue to use the editable format and do
not automatically fetch/embed remote dependencies.

Checks: `editor/tests/asset-packaging.test.js` covers multi-scene/dependency
collection, metadata preservation, unchanged source state, a real bundled GLB's
binary chunk, failure/timeout/budget cases, network-free reprocessing of embedded
content, script-tag safety, filesystem boundaries and untrusted IPC. The isolated
browser suite now adds three transport/embedding/hash checks to the existing ten
storage/heightmap checks. This verifies that collected asset payloads can be
reprocessed without network access; it does not establish an offline game runtime.


## Pinned offline HTML runtime (31 October 2026)

File → Export Offline HTML Game now embeds the verified PlayCanvas 2.23.3 engine,
asm.js Ammo physics, both license notices and the supported declared asset payloads.
The Vite build emits only the fixed runtime files in `runtime-manifest.json`;
SHA-256 or engine-version mismatches fail the build/export. Desktop access uses a
trusted-frame-only IPC with no caller-supplied path. Development reads the fixed
installed sources; packaged builds read their emitted runtime directory.

Editor startup awaits the same physics build before application creation and
reports failure visibly. Physics is paused during authoring, advances in Play and
freezes on Stop. Exact pre-play restoration and a privileged-code-isolated shared
runtime are still pending. Scene serialization now preserves each entity's local
enabled flag, including children underneath disabled parents.

`npm run test:offline-export` launches a copied HTML file in a temporary browser
profile, outside the repository, with CSP blocking external connections. It waits
for a real embedded GLB, asserts the pinned engine and initialized physics world,
and simulates a dynamic sphere landing on a static floor. This is a focused
portability/physics fixture; it does not certify objectives, restart, transitions,
audible output or every behavior. Custom scripts can still introduce network
requests; unsupported compressed models are rejected by asset packaging. The
File-menu export is currently active-scene only. Low-level synchronous bundler
callers must supply the verified runtime bundle to avoid the legacy CDN path.


## Disposable Play/Stop scene copies (31 October 2026)

The Play button now calls the editor-owned play-session controller. It retains
original scene objects in an inactive detached hierarchy and clones the scene
as one graph into the current application. Native entity references within that
graph can remap together. Mutable preview materials and authored behavior
parameters are copied; HUD, triggers, settings and script/prefab records use
session copies. Original selection and undo closures keep their entity identities.

Stop freezes physics/audio/behaviors, destroys tracked preview objects (including
objects removed from the hierarchy), clears session-owned delays and restores
original objects, local enabled flags, root ordering, selection, camera orbit,
gravity and scene settings. Preview commands do not enter authoring history;
authoring Undo/Redo and scene replacement are blocked while playing. Editable
project saves and the legacy scene-save shortcut require Stop first. Recovery
ignores runtime changes and retains the prior file baseline.

Editor-owned camera/grid/outline/visual-helper/gizmo roots are explicitly marked
and omitted from project serialization and preview copies. Scene replacement
preserves those live helpers. This also fixes helper geometry polluting saves.

This is a same-application authoring-protection foundation, **not a security
boundary**. Meshes/textures and engine asset resources remain shared; arbitrary
native/generated code can retain privileged references or mutate shared GPU
resources. A separate preview application/context, game-camera/input ownership,
complete asynchronous import/resource lifecycle and script isolation remain open.
There is no automatic apply-back of gameplay changes.

Eight regression scenarios cover destructive edits, exact saved-content equality,
undo/selection identity, repeated real Ammo runs, readiness/start/stop failures,
clean recovery state, terrain resources, helper exclusion and delayed cleanup.
`npm run test:play-browser` checks the actual editor runtime and Play/Stop buttons
in a fresh Chromium profile, including loaded GLB resource survival and real
physics across two sessions (fourteen assertions).


## Isolated Game Preview and shared delivery preparation (31 October 2026)

The new **Game Preview** toolbar button opens a modal running a captured active
scene. `prepareGame` is shared by preview and File-menu HTML export: serialize
once, package declared assets, verify pinned runtime bytes, compile the artifact.
Restart creates a fresh frame from that artifact; it does not repack later edits.
Close destroys the frame and ignores late preparation results. The existing
in-editor Play simulation remains a separate authoring tool.

The frame uses `sandbox="allow-scripts allow-pointer-lock"` without same-origin,
forms, popups, downloads or top-navigation permissions. Fullscreen and audio
playback are allowed; denied optional fullscreen/pointer-lock requests are handled
without failing the game. A CSP restricts resource
requests to embedded data/blob content and prevents nested frames/objects/base
URLs. The frame cannot access the editor DOM, its local storage or desktop bridge.
Only bounded status data is accepted, matching the current frame, opaque origin,
channel and session token; it cannot request editor actions. Status is useful UI
feedback, not adversarial-code attestation or proof of game completion. This is
not a guarantee against all browser networking channels or browser-engine flaws.

The same generated runtime now waits for declared model, texture and audio
loads, including application of resources, before enabling physics/gameplay.
Missing, failed, late or timed-out requests cannot count as ready. Arbitrary
script-created dependencies are outside this loader. Scripts still require a
complete lifecycle/error policy; they can execute during initial setup.

Runtime camera selection uses the first enabled camera on an enabled entity;
other cameras are disabled in the game copy, with a visible fallback when absent.
Camera component enabled flags now persist. Camera-oriented behaviors use the
chosen game camera. Keyboard events belong to the frame, and blur clears held
keys and mouse deltas. Movement requires an attached behavior: the previous
unconditional first-object/player movement path was removed, and entity lookup
now uses PlayCanvas `findOne`, avoiding array-valued targets. Explicit primary
camera selection, configurable input maps, scene transitions and broader behavior
parity remain pending.

`editor/tests/game-preview.test.js` adds seven checks for resource readiness,
timeouts/late callbacks, safe frame/status configuration, immutable preparation
and camera persistence. The real-browser suite now makes 37 combined assertions
across scene-copy restoration and isolated game preview, including actual game
input/blur, GLB readiness, camera selection, restart/close, blocked parent/storage/
bridge/external fetch access, late preparation, errors and timeout cleanup. The
existing offline artifact test remains a separate portability check.
