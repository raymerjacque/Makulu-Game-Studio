/**
 * Editor Notification Toast Helper
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 2000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#10b981' : (type === 'warn' ? '#eab308' : '#ff6600');
  toast.style.cssText = `
    background: rgba(16, 20, 26, 0.95);
    border-left: 4px solid ${bgColor};
    border-top: 1px solid var(--border-subtle);
    border-right: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    color: #fff;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    animation: fadeIn 0.2s ease;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
