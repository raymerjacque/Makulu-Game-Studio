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

module.exports = { isTrustedDocument, isTrustedAuthSender, isSafeExternalUrl, packagedEntryUrl };
