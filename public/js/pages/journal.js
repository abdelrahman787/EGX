import { api, fmt, toast, esc } from '../api.js';
import { t, getLang } from '../i18n.js';
import { confirmDialog } from '../components/modal.js';

let filters = { type: '', symbol: '', from: '', to: '' };

export async function renderJournal(el) {
  el.innerHTML = `<div class="empty">…</div>`;
  const lang = getLang();
  const entries = await api.getJournal(filters);

  el.innerHTML = `
    <div class="card">
      <div class="card-title">🔎 ${t('jr.title')}</div>
      <div class="grid grid-4" style="align-items:end">
        <div class="field" style="margin:0">
          <label>${t('jr.filterType')}</label>
          <select id="fType">
            <option value="">${t('jr.filterAll')}</option>
            <option value="buy" ${filters.type === 'buy' ? 'selected' : ''}>${t('cl.buy')}</option>
            <option value="sell" ${filters.type === 'sell' ? 'selected' : ''}>${t('cl.sell')}</option>
          </select>
        </div>
        <div class="field" style="margin:0"><label>${t('jr.filterSymbol')}</label><input id="fSym" value="${esc(filters.symbol)}"></div>
        <div class="field" style="margin:0"><label>${t('jr.from')}</label><input id="fFrom" type="date" value="${filters.from}"></div>
        <div class="field" style="margin:0"><label>${t('jr.to')}</label><input id="fTo" type="date" value="${filters.to}"></div>
      </div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn small" id="applyFilter">${t('jr.apply')}</button>
        <button class="btn ghost small" id="clearFilter">${t('jr.clear')}</button>
      </div>
    </div>

    ${entries.length
      ? `<div class="timeline">${entries.map((e) => tlItem(e, lang)).join('')}</div>`
      : `<div class="empty">${t('jr.noEntries')}</div>`}

    <p class="disclaimer">${t('disclaimer')}</p>
  `;

  el.querySelector('#applyFilter').onclick = () => {
    filters = {
      type: el.querySelector('#fType').value,
      symbol: el.querySelector('#fSym').value.trim(),
      from: el.querySelector('#fFrom').value,
      to: el.querySelector('#fTo').value,
    };
    renderJournal(el);
  };
  el.querySelector('#clearFilter').onclick = () => { filters = { type: '', symbol: '', from: '', to: '' }; renderJournal(el); };

  el.querySelectorAll('.tl-card').forEach((c) => {
    c.onclick = () => openDetails(c.dataset.id, el);
  });
}

function tlItem(e, lang) {
  const type = e.decision_type === 'sell' ? 'sell' : 'buy';
  const label = type === 'sell' ? t('cl.sell') : t('cl.buy');
  const idPill = e.identity ? `<span class="pill ${e.identity}">${idLabel(e.identity)}</span>` : '';
  const reviewed = e.review ? `<span class="pill" style="background:rgba(20,184,166,.15);color:#2dd4bf">✓ ${t('jr.review')}</span>` : '';
  return `<div class="tl-item">
    <div class="tl-card" data-id="${e.id}">
      <div class="tl-head">
        <span class="pill ${type}">${label}</span>
        <strong>${esc(e.symbol || e.name || '—')}</strong>
        ${idPill}${reviewed}
        <span class="tl-date">${fmt.date(e.created_at)}</span>
      </div>
      ${e.checklist?.thesis ? `<p class="muted">${esc(String(e.checklist.thesis).slice(0, 120))}${e.checklist.thesis.length > 120 ? '…' : ''}</p>` : ''}
    </div>
  </div>`;
}

function idLabel(id) {
  return t({ long_term: 'cl.longTerm', swing: 'cl.swing', scalper: 'cl.scalper' }[id] || id);
}

async function openDetails(id, pageEl) {
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);
  const e = await api.getJournalEntry(id);
  const c = e.checklist || {};

  const checksHtml = c.checks
    ? Object.entries(c.checks).map(([k, v]) => `<li>${v ? '✅' : '⬜'} ${k}</li>`).join('')
    : '';

  const wrap = document.createElement('div');
  wrap.className = 'modal-overlay open';
  wrap.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h2>${t('jr.details')}</h2>
        <button class="icon-btn" data-close>✕</button>
      </div>
      <div class="modal-body">
        <div class="tl-head" style="margin-bottom:14px">
          <span class="pill ${e.decision_type}">${e.decision_type === 'sell' ? t('cl.sell') : t('cl.buy')}</span>
          <strong>${esc(e.symbol || e.name || '—')}</strong>
          ${e.identity ? `<span class="pill ${e.identity}">${idLabel(e.identity)}</span>` : ''}
          <span class="tl-date">${fmt.date(e.created_at)}</span>
        </div>

        ${c.thesis ? `<div class="field"><label>${t('jr.thesis')}</label><p>${esc(c.thesis)}</p></div>` : ''}
        ${c.current_price ? `<p class="muted">${t('cl.currentPrice')}: ${esc(c.current_price)} ${t('common.egp')}</p>` : ''}
        ${checksHtml ? `<div class="field"><label>${t('cl.checks')}</label><ul style="list-style:none; padding:0">${checksHtml}</ul></div>` : ''}
        ${c.pe_value ? `<p class="muted">P/E: ${esc(c.pe_value)}</p>` : ''}
        ${c.support_level ? `<p class="muted">${t('cl.supportLevel')}: ${esc(c.support_level)}</p>` : ''}
        ${c.risk ? `<div class="field"><label>${t('cl.risk')}</label>
          <p class="muted">${t('cl.stopLossPrice')}: ${esc(c.risk.stop_loss_price || '—')} • ${t('cl.targetPrice')}: ${esc(c.risk.target_price || '—')}</p>
          ${c.position_size != null ? `<p class="muted">${t('cl.positionSize')}: ${esc(c.position_size)}%</p>` : ''}
        </div>` : ''}
        ${c.bad_scenario ? `<div class="field"><label>${t('cl.badScenario')}</label><p>${esc(c.bad_scenario)}</p></div>` : ''}

        <div class="section-title">${t('jr.review')}</div>
        <textarea id="reviewText" placeholder="${t('jr.reviewPh')}">${esc(e.review || '')}</textarea>
        ${e.reviewed_at ? `<p class="muted" style="margin-top:4px">${L('آخر مراجعة','Last reviewed')}: ${fmt.date(e.reviewed_at)}</p>` : ''}
        <div class="btn-row" style="margin-top:12px">
          <button class="btn" id="saveReview">${t('jr.saveReview')}</button>
          <button class="btn danger" id="delEntry">${t('jr.delete')}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.querySelector('[data-close]').onclick = close;
  wrap.onclick = (ev) => { if (ev.target === wrap) close(); };

  wrap.querySelector('#saveReview').onclick = async () => {
    await api.addReview(id, wrap.querySelector('#reviewText').value.trim());
    toast(t('jr.reviewSaved'), 'ok');
    close();
    renderJournal(pageEl);
  };
  wrap.querySelector('#delEntry').onclick = async () => {
    if (!(await confirmDialog({ message: t('common.deleteConfirm'), confirmLabel: t('common.delete') }))) return;
    await api.deleteJournal(id);
    close();
    renderJournal(pageEl);
  };
}
