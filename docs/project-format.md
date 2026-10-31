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
subsequent scene. Full asynchronous load readiness and transaction rollback remain
pending; a successful open means project data was adopted, not that every referenced
remote model is available or every gameplay feature has been certified.

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
Terrain mesh data, timeline tracks, comprehensive sound slots and material fields,
complete prefab trees, runtime shader state, graph semantics, and all script
execution/bindings are not certified by this format. Generated game export remains
a separate path and still has its documented portability limitations.

## Verification and next work

`editor/tests/project-document.test.js` checks fresh-editor multi-scene reopening,
script preservation, nested transforms, scene identity, behavior configuration,
script attributes, assets, prefab records, settings, legacy migration, rejected
imports, staging failure, temporary asset remapping, play guards and safe asset
labels. It also exercises collision extents and zero-valued physics using real
PlayCanvas systems with a NullGraphicsDevice, and runs the exported scene builder.

Next: await and report asynchronous asset loading; finish missing component/resource
persistence and stable references; implement complete dependency packaging; add
atomic desktop saves, browser durable storage, saved/dirty state and rolling
recovery snapshots. Test real imported animated content and the full interactive
file workflow before declaring the P1 phase complete.
