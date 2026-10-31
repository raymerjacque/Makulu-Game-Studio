import { showToast } from './toast.js';

/** All snapshot metadata is rendered as text; restoring always uses the validated project loader. */
export async function showRecoverySnapshots(editor) {
  if (!editor.persistence) return;
  document.getElementById('recovery-snapshots-modal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'recovery-snapshots-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:#000b;z-index:2200;display:grid;place-items:center;padding:24px';
  const panel = document.createElement('div');
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'recovery-title');
  panel.style.cssText = 'background:var(--bg-panel);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:12px;padding:24px;width:640px;max-width:100%;max-height:80vh;overflow:auto';
  const title = document.createElement('h2'); title.id = 'recovery-title'; title.textContent = 'Local recovery snapshots';
  const note = document.createElement('p');
  note.textContent = 'Recovery stays on this device and is separate from a downloaded project file. Up to five snapshots per project and twenty overall are retained. Restore protects current unsaved work first.';
  const list = document.createElement('div');
  const close = document.createElement('button'); close.className = 'btn'; close.textContent = 'Keep working';
  const previousFocus = document.activeElement;
  const dismiss = () => { overlay.remove(); previousFocus?.focus?.(); };
  close.addEventListener('click', dismiss);
  panel.append(title, note, list, close); overlay.appendChild(panel); document.body.appendChild(overlay); close.focus();
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') dismiss();
    if (event.key === 'Tab') {
      const buttons = [...panel.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  try {
    const snapshots = await editor.persistence.store.list();
    if (!snapshots.length) { list.textContent = 'No recovery snapshots are available yet.'; return; }
    for (const snapshot of snapshots) {
      const row = document.createElement('div'); row.style.cssText = 'border-top:1px solid var(--border-subtle);padding:12px 0;display:flex;align-items:center;gap:12px';
      const label = document.createElement('span'); label.style.flex = '1';
      label.textContent = `${snapshot.name || 'Untitled'} — ${new Date(snapshot.createdAt).toLocaleString()}`;
      const restore = document.createElement('button'); restore.className = 'btn btn-primary'; restore.textContent = 'Restore';
      const remove = document.createElement('button'); remove.className = 'btn'; remove.textContent = 'Delete';
      restore.addEventListener('click', async () => {
        const buttons = [...panel.querySelectorAll('button')]; buttons.forEach(button => { button.disabled = true; });
        try {
          const report = await editor.persistence.restore(snapshot.id);
          if (report.status === 'invalid') showToast(report.message || 'Snapshot could not be restored.', 'error');
          else if (report.status !== 'cancelled') {
            showToast(report.status === 'ready' ? 'Recovery restored. Download a project file to save it explicitly.' : 'Recovery data restored with missing scene resources. Check the scene status.', report.status === 'ready' ? 'success' : 'warn');
            dismiss();
          }
        } catch { showToast('Recovery storage could not be read. Your current work remains open.', 'error'); }
        finally { buttons.forEach(button => { button.disabled = false; }); }
      });
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try { await editor.persistence.store.delete(snapshot.id); row.remove(); }
        catch { remove.disabled = false; showToast('Could not delete the snapshot.', 'error'); }
      });
      row.append(label, restore, remove); list.appendChild(row);
    }
  } catch { list.textContent = 'Recovery storage is unavailable. Download a project file to protect current work.'; }
}
