import { t } from '../i18n.js';

// Basic modal shell — matches the design used across the app.
// Returns { wrap, close }. Caller wires the body's buttons.
export function modalShell(bodyHtml, titleText) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-overlay open';
  wrap.innerHTML = `<div class="modal"><div class="modal-head"><h2>${titleText}</h2><button class="icon-btn" data-close>✕</button></div><div class="modal-body">${bodyHtml}</div></div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.querySelector('[data-close]').onclick = close;
  wrap.onclick = (e) => { if (e.target === wrap) close(); };
  return { wrap, close };
}

// Promise-based confirm dialog using the same shell (replaces window.confirm).
// Resolves true on confirm, false on cancel / backdrop / X.
export function confirmDialog({ title, message, confirmLabel, danger = true }) {
  return new Promise((resolve) => {
    const { wrap, close } = modalShell(
      `<p style="margin-bottom:20px; line-height:1.7">${message}</p>
       <div class="btn-row" style="justify-content:flex-end">
         <button class="btn secondary" data-cancel>${t('common.cancel')}</button>
         <button class="btn ${danger ? 'danger' : ''}" data-ok>${confirmLabel || t('common.confirm')}</button>
       </div>`,
      title || t('common.confirm')
    );
    const done = (val) => { close(); resolve(val); };
    wrap.querySelector('[data-ok]').onclick = () => done(true);
    wrap.querySelector('[data-cancel]').onclick = () => done(false);
    wrap.querySelector('[data-close]').onclick = () => done(false);
    wrap.onclick = (e) => { if (e.target === wrap) done(false); };
  });
}
