# Pinned Ammo physics source

`ammo.js` is the asm.js source distribution from PlayCanvas engine commit
`ff178eb98cfefc41ccc38c9e7965fbf081f6acb2`, path
`examples/assets/wasm/ammo/ammo.js`. It initializes without a separate Wasm or
memory download. This is runtime JavaScript source, not an application release.

Source: https://github.com/playcanvas/engine/blob/ff178eb98cfefc41ccc38c9e7965fbf081f6acb2/examples/assets/wasm/ammo/ammo.js
License: https://github.com/kripken/ammo.js/blob/main/LICENSE
The adjacent LICENSE contains the upstream zlib notice. The source is unchanged.

`editor/runtime-manifest.json` pins the original byte hashes for this source and
license, and for the installed PlayCanvas 2.23.3 UMD engine and MIT license.
The build fails on any mismatch. Update the manifest, license review and runtime
checks together when upgrading. Exported HTML escapes closing script delimiters
for safe inline embedding; manifest hashes describe original distribution bytes,
not that HTML encoding. License notices are embedded in the exported artifact.
