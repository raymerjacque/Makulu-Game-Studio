export const PREVIEW_CHANNEL = 'makulu-game-preview-v1';
export const PREVIEW_SANDBOX = 'allow-scripts allow-pointer-lock';
export const PREVIEW_CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src data: blob:; worker-src blob:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

/** The only frame-to-editor protocol is bounded status data; no editor commands or credentials. */
export function previewStatus(event, frameWindow, token) {
  const data = event.data;
  if (event.source !== frameWindow || event.origin !== 'null' || !data || data.channel !== PREVIEW_CHANNEL || data.token !== token) return null;
  if (!['initializing', 'loading-assets', 'running', 'error'].includes(data.state)) return null;
  return { state: data.state, cameraName: typeof data.cameraName === 'string' ? data.cameraName.slice(0, 120) : '', resourceCount: Number.isSafeInteger(data.resourceCount) && data.resourceCount >= 0 ? data.resourceCount : 0 };
}

export function createPreviewDocument(html, token) {
  const config = JSON.stringify({ channel: PREVIEW_CHANNEL, token }).replace(/</g, '\\u003c');
  const bridge = `<script>(() => {
    const config = ${config}; let last = '';
    const publish = status => {
      if (!status || status.state === last) return;
      last = status.state;
      parent.postMessage({ ...config, state: status.state, cameraName: status.cameraName || '', resourceCount: status.resourceCount || 0 }, '*');
    };
    addEventListener('error', () => publish({ state: 'error' }));
    addEventListener('unhandledrejection', () => publish({ state: 'error' }));
    setInterval(() => publish(window.__makuluRuntimeStatus), 100);
  })();</script>`;
  if (!/<head>/i.test(html)) throw new Error('Game document has no head.');
  return html.replace(/<head>/i, `<head><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">${bridge}`);
}
