# Production asset library — P7A

Status: **planned, not imported**. Added 31 October 2026 at the user's request.
This is a core product requirement before the final autonomous-game benchmark,
not a cosmetic task to leave until after release. Existing models remain a small
starter/demo collection; this plan does not claim their quality has been upgraded.

## Destination

Users and the AI should be able to assemble an attractive, coherent game without
having to accept block-style placeholder characters, hunt for external files, or
invent model paths. Ship a compact, genuinely useful core library and optional
installed packs. An asset counts only when it passes visual, technical, licensing,
search and export checks; recolors of one mesh do not substitute for variety.

## Planned content targets

These are acquisition/authoring targets to refine after visual review, not claims
about existing files or a requirement to accept poor assets to hit a number.

| Collection | Initial full-library target | Quality requirement |
| --- | --- | --- |
| Characters | 24 rigged humanoids across several roles | Recognizable silhouettes, expressive faces where appropriate; idle/walk/run/jump plus role-specific actions |
| Enemies/creatures | 30 distinct enemies and animals | Suitable attack/hit/death or locomotion clips; documented rig/clip coverage |
| Environment/architecture | 100 modular pieces | Consistent dimensions, sensible pivots, doors/interiors and reusable building sets |
| Vegetation/natural scenery | 60 trees, plants, rocks and terrain props | Several biomes; ground-contact placement and appropriate LODs |
| Props/interactables | 120 props | Furniture, crates, industrial objects, signs, collectibles and readable interactive silhouettes |
| Vehicles/equipment | 30 vehicles and larger equipment items | Consistent scale, wheel/pivot metadata and optional animation as appropriate |
| Weapons/items | 50 usable inventory/combat items | Attachment/grip transforms and consistent visual families |
| PBR materials | 100 distinct material sets | Tileable where intended; albedo/normal/roughness and metalness/AO where applicable |
| Animation library | 40 reusable, clearly named clips or action sets | Compatible rigs, tested retargeting where used, root-motion policy and blend examples |
| Presentation | Icons, particles, audio and environment lighting sets | One coherent HUD/effect family per starter style; actual runtime support required |

Proposed installed core: roughly 100–150 selected models and 25–40 material sets
covering the three reference games. Full content can be optional packs. Set final
installation/texture budgets from measured load times and reference hardware;
do not preload every optional model or embed the whole catalog into every game.

## Work packages and acceptance

### A01 · Audit and replace the current collection

Render a contact sheet and representative close-ups of every existing model.
Record provenance, actual mesh/texture quality, polygon counts, animations,
materials, missing references and the current game-scale appearance. Flag any
unclear source/license. Keep useful content, replace underwhelming defaults, and
remove the blanket CC0 claim where individual items have different provenance.
Acceptance: every existing asset is reviewed and classified, with no invented
license or visual-quality rating.

### A02 · Approve two coherent visual directions

Start with a polished stylized adventure set and a more detailed contemporary /
industrial set. Include readable characters beyond simple block figures. Build
lighting/camera reference scenes before bulk acquisition. Compare samples in the
actual game preview, not only promotional renders. Acceptance: a small reviewed
sample kit for each direction looks consistent at gameplay distance and close-up.

### A03 · Acquire rights suitable for an editor library

Verify the exact downloaded version's terms for redistribution of raw models,
textures, animations and source files inside this studio, as well as inclusion
in games users export. Preserve the original license text, source page, author,
pack version, retrieval date and file checksums. Prefer clearly redistributable
content; pay for content only with an explicitly approved budget. Do not assume
that permission to use an asset in a finished game permits redistributing an
editable pack. Gate inclusion in the official library on recorded evidence.

Candidate sources checked on 31 October 2026:

- [Poly Haven asset license](https://polyhaven.com/license): the asset license
  identifies its models, materials and HDRIs as CC0 and permits redistribution.
  Website/API access has separate terms; follow those instead of bulk scraping.
- [ambientCG license](https://docs.ambientcg.com/license/): downloadable asset
  files and specified preview renders are CC0. Useful candidate for material sets.
- [Quaternius current license](https://quaternius.com/license.html): QAL v1.0
  restricts redistribution as assets/packs. Do not preload current QAL material
  without separate permission. Earlier releases require proof of the license that
  actually applied to that exact version; do not infer CC0 from old recommendations.

These are sourcing candidates, not an approved shopping/import list. Audit
per-asset files and terms at acquisition. Preserve attribution even when optional
where practical. Model attribution does not automatically license unrelated
website copy, logos, thumbnails or promotional art.

### A04 · Normalize the assets for PlayCanvas and browser delivery

Convert to supported glTF 2.0/GLB, consistent meters/orientation and correct pivots.
Remove unused geometry/materials, resolve textures, standardize naming, generate
LODs/collision proxies where needed, and verify skeleton/animation imports. Start
with self-contained uncompressed GLB until decoder packaging is implemented.
Produce appropriately sized textures for browser targets, not automatic 8K maps.
Acceptance: every asset loads without repair and survives save/open/pack/export.

### A05 · Build a real PBR material library

Define channel packing, normal-map convention, color spaces, tile scale and UV
expectations. Include stone/brick/concrete/wood/metals/fabric/soil/grass/water-related
surfaces with variation that changes the actual material, not just a color swatch.
Verify the current material pipeline applies each advertised map correctly before
shipping it. Acceptance: material spheres and game-scene examples match the
intended look, with no missing maps or broken channel assignments.

### A06 · Index the library for AI selection

Use stable asset/pack IDs and structured fields: semantic tags, synonyms, style,
biome, role, bounds, scale, pivot, floor offset, triangle/material/texture budgets,
LOD/collider availability, rig type, animation clips, attachment points, license
and dependencies. Search must distinguish e.g. a usable animated guard from a
static statue or a medieval lantern from a modern work light. The AI must request
installed IDs, receive compatible alternatives, and never invent a filename.
Acceptance: a fixed set of semantic searches selects appropriate real assets.

### A07 · Improve browsing and preview

Create local thumbnails, turntable/animation previews, material previews and
filters for style, category, installed pack and compatibility. Offer drag/drop in
Pro and automatic selection in Simple. Show download size and available/offline
state for optional packs. Optional pack installation must be versioned, checked,
restart-safe and removable without breaking projects that already own a copy.

### A08 · Connect content selection to the autonomous workflow

The Game Brief selects a visual family and asset budgets. Planning checks that
required character actions and props exist. Building chooses assets with correct
scale and collision/rig metadata. QA detects missing clips, mismatched style,
invisible meshes and oversized textures. Substitution must preserve mechanics,
be disclosed, and be reversible. Acceptance: the three reference games use the
new library without manual asset-path repair.

### A09 · Add authored/generated content where it helps

Use procedural mesh authoring for original scenery/props and AI-generated raster
work for appropriate textures, decals, icons or concepts. Record the generator,
version and provenance. Validate tiling, seams, alpha, texture channels and real
engine appearance. A rendered picture is not a rigged model or a complete PBR
material; 3D topology, UVs, skeletons and animations need an actual 3D workflow.
Generated content goes through the same quality and packaging checks as downloads.

### A10 · Measure the result and ship curated packs

Publish a versioned manifest, original license notices, screenshots and benchmark
results. Keep a compact default installation and separate optional themes. Test
cold load, memory, mobile texture budgets, offline availability and exported size.
Distribute large pack archives through a content/release channel; do not commit
release archives, dependencies or application binaries to git. Follow repository
policy for any compact source assets that are committed.

## Release gate

A reviewer can build three visually coherent reference scenes/games with attractive
characters, environments and textured surfaces from the installed library. Every
shipped asset has rights/provenance evidence, technical metadata, thumbnails,
working imports, required animation coverage and a passing pack/export check.
A benchmark of at least 30 representative AI asset requests resolves real,
compatible installed assets without invented paths. Missing categories remain
visible backlog items. Counts alone do not pass the gate.

## Dependency order

Begin A01–A03 now as a content workstream. A04–A07 depend on reliable project
persistence and asset packaging. A08 depends on typed asset discovery/tools and
reference-game validation. Complete the core pack before final prompt-to-game
benchmarks and novice usability sessions. Full optional-pack breadth can grow
after the core quality gate passes.
