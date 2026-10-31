import { AssetPackager } from '../project/asset-packager.js';
import { resolvePortableReferences } from '../project/project-document.js';
import { loadExportRuntimes } from '../compiler/runtime-bundle.js';
import { GameBundler } from '../compiler/game-bundler.js';

/** Capture once: preview and export package the same active-scene artifact. */
export async function prepareGame(editor, { packager = new AssetPackager(), loadRuntimes = loadExportRuntimes } = {}) {
  if (editor.isPlaying) throw new Error('Stop scene simulation before preparing a game.');
  if (editor.sceneResourceStatus && editor.sceneResourceStatus.status !== 'ready') throw new Error('Wait for scene resources or retry missing assets.');
  const source = JSON.parse(editor.exportSceneJSON());
  resolvePortableReferences(source, editor.assetsPanel?.assets || editor.projectAssets || []);
  const result = await packager.packageScene(source);
  const runtimeBundle = await loadRuntimes();
  return new GameBundler(editor).compileStandaloneHTML({ title: source.project, sceneData: result.scene, embeddedAssets: [], runtimeBundle, assetManifest: result.manifest });
}
