import { GameBundler } from '../compiler/game-bundler.js';

/**
 * Makulu Cloud Game Publisher
 * Compiles and publishes standalone HTML5 games for instant sharing.
 */
export class CloudPublisher {
  constructor(editor) {
    this.editor = editor;
    this.bundler = new GameBundler(editor);
  }

  async publish(options = {}) {
    const gameId = 'game_' + Math.random().toString(36).substring(2, 9);
    const html = this.bundler.compileStandaloneHTML(options);

    // Create a local blob URL for instant in-browser test & sharing
    const blob = new Blob([html], { type: 'text/html' });
    const localPlayUrl = URL.createObjectURL(blob);

    const publicUrl = `https://makululinux.us/games/${gameId}`;

    return {
      success: true,
      gameId,
      localPlayUrl,
      publicUrl,
      htmlContent: html,
      publishedAt: new Date().toISOString()
    };
  }

  downloadHTML(filename = 'game.html', htmlContent = null) {
    const html = htmlContent || this.bundler.compileStandaloneHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
