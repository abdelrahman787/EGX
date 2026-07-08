import { api, fmt, toast, esc } from '../api.js';
import { t, getLang } from '../i18n.js';

export async function renderPortfolio(el) {
  el.innerHTML = `<div class="empty">…</div>`;
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);

  const [{ stocks, total_value }, goals, settings] = await Promise.all([
    api.getStocks(), api.getGoals(), api.getSettings(),
  ]);
  const maxSingle = Number(settings.max_single_stock_pct || 20);
  const concentrated = stocks.some((s) => s.weight_pct > maxSingle);

  el.innerHTML = `
    <div class="stat" style="margin-bottom:18px">
      <div class="label">${t('pf.totalValue')}</div>
      <div class="value">${fmt.money(total_value)} ${t('common.egp')}</div>
    </div>

    ${concentrated ? `<div class="alert warn" style="margin-bottom:16px">⚠️ ${t('pf.concentrationAlert')} (${L('الحد', 'cap')} ${maxSingle}%)</div>` : ''}

    <div class="card">
      <div class="card-title">📊 ${t('pf.holdings')} <button class="btn accent small" id="addStock" style="margin-inline-start:auto">${t('pf.addStock')}</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('pf.symbol')}</th><th>${t('pf.qty')}</th><th>${t('pf.avgPrice')}</th>
            <th>${t('pf.currentPrice')}</th><th>${t('pf.pl')}</th><th>${t('pf.weight')}</th>
            <th>${t('pf.target')}</th><th>${t('pf.stop')}</th><th>${t('pf.actions')}</th>
          </tr></thead>
          <tbody id="stockRows">
            ${stocks.length ? stocks.map(stockRow).join('') : `<tr><td colspan="9" class="empty">${t('pf.noStocks')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🎯 ${t('pf.goals')} <button class="btn accent small" id="addGoal" style="margin-inline-start:auto">${t('pf.addGoal')}</button></div>
      <div id="goalList">
        ${goals.length ? goals.map((g) => goalRow(g, lang)).join('') : `<p class="muted">${t('pf.noGoals')}</p>`}
      </div>
    </div>

    <p class="disclaimer">${t('disclaimer')}</p>
  `;

  // wire stock rows
  el.querySelectorAll('[data-save]').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.save;
      const tr = btn.closest('tr');
      const payload = {
        symbol: tr.querySelector('[data-f=symbol]').value,
        quantity: tr.querySelector('[data-f=quantity]').value,
        avg_price: tr.querySelector('[data-f=avg_price]').value,
        current_price: tr.querySelector('[data-f=current_price]').value,
        target_price: tr.querySelector('[data-f=target_price]').value,
        stop_loss: tr.querySelector('[data-f=stop_loss]').value,
      };
      await api.updateStock(id, payload);
      toast(L('تم الحفظ', 'Saved'), 'ok');
      renderPortfolio(el);
    };
  });
  el.querySelectorAll('[data-del]').forEach((btn) => {
    btn.onclick = async () => { await api.deleteStock(btn.dataset.del); renderPortfolio(el); };
  });
  el.querySelector('#addStock').onclick = () => openStockModal(el);
  el.querySelector('#addGoal').onclick = () => openGoalModal(el);

  el.querySelectorAll('[data-delgoal]').forEach((btn) => {
    btn.onclick = async () => { await api.deleteGoal(btn.dataset.delgoal); renderPortfolio(el); };
  });

  function stockRow(s) {
    const cls = s.pl >= 0 ? 'pos' : 'neg';
    const over = s.weight_pct > maxSingle;
    return `<tr>
      <td><input data-f="symbol" value="${esc(s.symbol)}" style="width:80px"></td>
      <td><input data-f="quantity" type="number" value="${s.quantity}" style="width:70px"></td>
      <td><input data-f="avg_price" type="number" step="0.01" value="${s.avg_price}" style="width:80px"></td>
      <td><input data-f="current_price" type="number" step="0.01" value="${s.current_price}" style="width:80px"></td>
      <td class="${cls}">${s.pl >= 0 ? '+' : ''}${fmt.money(s.pl)}<br><span style="font-size:11px">${fmt.pct(s.pl_pct)}</span></td>
      <td class="${over ? 'neg' : ''}">${fmt.pct(s.weight_pct)}</td>
      <td><input data-f="target_price" type="number" step="0.01" value="${s.target_price ?? ''}" style="width:70px"></td>
      <td><input data-f="stop_loss" type="number" step="0.01" value="${s.stop_loss ?? ''}" style="width:70px"></td>
      <td>
        <button class="btn small" data-save="${s.id}">${t('pf.save')}</button>
        <button class="btn small danger" data-del="${s.id}">✕</button>
      </td>
    </tr>`;
  }
}

function goalRow(g, lang) {
  const target = Number(g.target_value) || 0;
  const cur = Number(g.current_value) || 0;
  const pct = target > 0 ? Math.min(100, (cur / target) * 100) : 0;
  return `<div style="margin-bottom:16px">
    <div style="display:flex; gap:10px; align-items:center; margin-bottom:6px">
      <strong>${esc(g.title)}</strong>
      <span class="muted" style="margin-inline-start:auto">${cur} / ${target}${g.type === 'max_single_stock' || g.type === 'diversification' ? '%' : ''}</span>
      <button class="btn ghost small" data-delgoal="${g.id}">✕</button>
    </div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    ${g.note ? `<p class="muted" style="margin-top:6px">${esc(g.note)}</p>` : ''}
  </div>`;
}

function modalShell(bodyHtml, titleText) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-overlay open';
  wrap.innerHTML = `<div class="modal"><div class="modal-head"><h2>${titleText}</h2><button class="icon-btn" data-close>✕</button></div><div class="modal-body">${bodyHtml}</div></div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.querySelector('[data-close]').onclick = close;
  wrap.onclick = (e) => { if (e.target === wrap) close(); };
  return { wrap, close };
}

function openStockModal(pageEl) {
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);
  const { wrap, close } = modalShell(`
    <div class="field-row"><div class="field"><label>${t('pf.symbol')}</label><input id="mSymbol"></div><div class="field"><label>${t('pf.name')}</label><input id="mName"></div></div>
    <div class="field"><label>${t('pf.sector')} <span class="muted">(${t('common.optional')})</span></label><input id="mSector"></div>
    <div class="field-row"><div class="field"><label>${t('pf.qty')}</label><input id="mQty" type="number"></div><div class="field"><label>${t('pf.avgPrice')}</label><input id="mAvg" type="number" step="0.01"></div></div>
    <div class="field-row"><div class="field"><label>${t('pf.currentPrice')}</label><input id="mCur" type="number" step="0.01"></div><div class="field"><label>${t('pf.target')}</label><input id="mTarget" type="number" step="0.01"></div></div>
    <div class="field"><label>${t('pf.stop')}</label><input id="mStop" type="number" step="0.01"></div>
    <button class="btn" id="mSave" style="width:100%">${t('pf.save')}</button>
  `, t('pf.addStock'));

  wrap.querySelector('#mSave').onclick = async () => {
    const symbol = wrap.querySelector('#mSymbol').value.trim();
    if (!symbol) { toast(L('أدخل الرمز', 'Enter a symbol'), 'err'); return; }
    await api.createStock({
      symbol, name: wrap.querySelector('#mName').value.trim(), sector: wrap.querySelector('#mSector').value.trim(),
      quantity: wrap.querySelector('#mQty').value, avg_price: wrap.querySelector('#mAvg').value,
      current_price: wrap.querySelector('#mCur').value, target_price: wrap.querySelector('#mTarget').value,
      stop_loss: wrap.querySelector('#mStop').value,
    });
    close(); toast(L('تمت الإضافة', 'Added'), 'ok'); renderPortfolio(pageEl);
  };
}

function openGoalModal(pageEl) {
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);
  const { wrap, close } = modalShell(`
    <div class="field"><label>${t('pf.goalTitle')}</label><input id="gTitle" placeholder="${L('مثال: ألا يتجاوز أي سهم 20% من المحفظة','e.g. No stock above 20% of portfolio')}"></div>
    <div class="field"><label>${L('النوع','Type')}</label>
      <select id="gType">
        <option value="max_single_stock">${L('سقف أقصى لسهم واحد %','Max single stock %')}</option>
        <option value="diversification">${L('نسبة تنويع مستهدفة %','Target diversification %')}</option>
        <option value="custom">${L('هدف مخصص','Custom')}</option>
      </select>
    </div>
    <div class="field-row"><div class="field"><label>${t('pf.goalTarget')}</label><input id="gTarget" type="number" step="0.1"></div><div class="field"><label>${t('pf.goalCurrent')}</label><input id="gCur" type="number" step="0.1" value="0"></div></div>
    <div class="field"><label>${L('ملاحظة','Note')} <span class="muted">(${t('common.optional')})</span></label><input id="gNote"></div>
    <button class="btn" id="gSave" style="width:100%">${t('pf.save')}</button>
  `, t('pf.addGoal'));

  wrap.querySelector('#gSave').onclick = async () => {
    const title = wrap.querySelector('#gTitle').value.trim();
    if (!title) { toast(L('أدخل عنوان الهدف', 'Enter a goal title'), 'err'); return; }
    await api.createGoal({
      title, type: wrap.querySelector('#gType').value,
      target_value: wrap.querySelector('#gTarget').value, current_value: wrap.querySelector('#gCur').value,
      note: wrap.querySelector('#gNote').value.trim(),
    });
    close(); toast(L('تمت الإضافة', 'Added'), 'ok'); renderPortfolio(pageEl);
  };
}
