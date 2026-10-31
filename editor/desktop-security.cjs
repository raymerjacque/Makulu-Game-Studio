const { pathToFileURL } = require('url');

/** Exact document identity; query strings and fragments do not grant another path access. */
function isTrustedDocument(url, entryUrl) {
  try {
    const candidate = new URL(url);
    const entry = new URL(entryUrl);
    return !candidate.username && !candidate.password &&
      candidate.protocol === entry.protocol && candidate.host === entry.host &&
      candidate.pathname === entry.pathname;
  } catch {
    return false;
  }
}

/** Only the owning window's current main document may retrieve OS credentials. */
function isTrustedAuthSender(event, window, entryUrl) {
  if (!window || window.isDestroyed() || !entryUrl) return false;
  const contents = window.webContents;
  return event.sender === contents && event.senderFrame === contents.mainFrame &&
    isTrustedDocument(event.senderFrame?.url, entryUrl);
}

function isSafeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function packagedEntryUrl(filename) {
  return pathToFileURL(filename).href;
}

/** Electron otherwise keeps a dirty window open without offering an explicit close choice. */
function confirmUnsavedClose(event, window, dialog) {
  const choice = dialog.showMessageBoxSync(window, {
    type: 'question', buttons: ['Keep editing', 'Close without saving a project file'],
    defaultId: 0, cancelId: 0, title: 'Unsaved project changes',
    message: 'This project has changes since its last open or download.',
    detail: 'Download a project file to save it explicitly. A local recovery copy may exist, but it is not a saved project file.'
  });
  if (choice === 1) event.preventDefault();
}

module.exports = { confirmUnsavedClose, isTrustedDocument, isTrustedAuthSender, isSafeExternalUrl, packagedEntryUrl };
