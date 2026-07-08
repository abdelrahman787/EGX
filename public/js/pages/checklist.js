import { api, toast, esc } from '../api.js';
import { t, getLang } from '../i18n.js';
import { navigate } from '../app.js';
import { openReference } from '../components/referencePanel.js';

const IDENTITIES = [
  { id: 'long_term', titleKey: 'cl.longTerm', descKey: 'cl.longTermDesc' },
  { id: 'swing', titleKey: 'cl.swing', descKey: 'cl.swingDesc' },
  { id: 'scalper', titleKey: 'cl.scalper', descKey: 'cl.scalperDesc' },
];

const CHECKS = [
  { id: 'financials', labelKey: 'cl.chkFinancials', tip: { ar: 'راجع آخر قائمة دخل وميزانية قبل القرار.', en: 'Review the latest income statement and balance sheet.' } },
  { id: 'pe', labelKey: 'cl.chkPE', field: 'pe_value', fieldKey: 'cl.peValue', tip: { ar: 'قارن P/E بمتوسط القطاع لا بالرقم المطلق.', en: 'Compare P/E to the sector average, not the absolute number.' } },
  { id: 'volatility', labelKey: 'cl.chkVolatility', tip: { ar: 'هل التقلب بسبب خبر/نتائج أم ضجيج سوق؟', en: 'Is the move driven by news/earnings or market noise?' } },
  { id: 'support', labelKey: 'cl.chkSupport', field: 'support_level', fieldKey: 'cl.supportLevel', tip: { ar: 'حدد أقرب مستوى دعم ومقاومة حاليًا.', en: 'Identify the nearest current support & resistance.' } },
];

let state = {};

function resetState() {
  state = {
    identity: '', decision_type: 'buy',
    name: '', symbol: '', sector: '', current_price: '',
    thesis: '',
    checks: {}, pe_value: '', support_level: '',
    stop_loss_price: '', target_price: '',
    portfolio_risk_pct: '3', stop_loss_pct: '', position_size: null,
    bad_scenario: '',
    add_to_portfolio: true, quantity: '', avg_price: '',
  };
}

export function renderChecklist(el) {
  resetState();
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);

  el.innerHTML = `
    <!-- Identity -->
    <div class="card">
      <div class="card-title">1️⃣ ${t('cl.identity')} <button class="btn ghost small" id="refIdentity" type="button">📚</button></div>
      <p class="muted" style="margin-bottom:14px">${t('cl.identityHint')}</p>
      <div class="identity-grid" id="identityGrid">
        ${IDENTITIES.map((i) => `
          <div class="identity-opt" data-id="${i.id}">
            <div class="io-title">${t(i.titleKey)}</div>
            <div class="io-desc">${t(i.descKey)}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Decision type + stock data -->
    <div class="card">
      <div class="card-title">2️⃣ ${t('cl.stockData')}</div>
      <div class="field">
        <label>${t('cl.decisionType')}</label>
        <div class="btn-row">
          <button type="button" class="btn secondary" data-dt="buy" id="dtBuy">${t('cl.buy')}</button>
          <button type="button" class="btn secondary" data-dt="sell" id="dtSell">${t('cl.sell')}</button>
        </div>
      </div>
      <div id="sellWarn"></div>
      <div class="field-row">
        <div class="field"><label>${t('cl.stockName')}</label><input id="fName" placeholder="${L('مثال: البنك التجاري الدولي','e.g. CIB')}"></div>
        <div class="field"><label>${t('cl.symbol')}</label><input id="fSymbol" placeholder="COMI"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>${t('cl.currentPrice')} (${t('common.egp')})</label><input id="fPrice" type="number" step="0.01"></div>
        <div class="field"><label>${t('cl.sector')} <span class="muted">(${t('common.optional')})</span></label><input id="fSector"></div>
      </div>
    </div>

    <!-- Thesis -->
    <div class="card">
      <div class="card-title">3️⃣ ${t('cl.thesis')}</div>
      <textarea id="fThesis" placeholder="${t('cl.thesisPh')}"></textarea>
    </div>

    <!-- Core checks -->
    <div class="card">
      <div class="card-title">4️⃣ ${t('cl.checks')}</div>
      ${CHECKS.map((c) => `
        <div class="check-item">
          <input type="checkbox" id="chk_${c.id}" data-check="${c.id}">
          <div class="ci-body">
            <label class="ci-label" for="chk_${c.id}" style="margin:0; color:var(--text)">
              ${t(c.labelKey)}
              <span class="tip"><span class="tip-mark">i</span><span class="tip-text">${c.tip[lang]}</span></span>
            </label>
            ${c.field ? `<div class="ci-sub"><input type="number" step="0.01" id="f_${c.field}" placeholder="${t(c.fieldKey)}"></div>` : ''}
          </div>
        </div>`).join('')}
    </div>

    <!-- Risk management -->
    <div class="card">
      <div class="card-title">5️⃣ ${t('cl.risk')} <button class="btn ghost small" id="refCalc" type="button">📚</button></div>
      <div class="field-row">
        <div class="field"><label>${t('cl.stopLossPrice')} (${t('common.egp')})</label><input id="fStopPrice" type="number" step="0.01"></div>
        <div class="field"><label>${t('cl.targetPrice')} (${t('common.egp')})</label><input id="fTarget" type="number" step="0.01"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>${t('cl.portfolioRisk')}</label><input id="fPortRisk" type="number" step="0.5" value="3"></div>
        <div class="field"><label>${t('cl.stopLossPct')}</label><input id="fStopPct" type="number" step="0.5"></div>
      </div>
      <button type="button" class="btn accent small" id="calcBtn">${t('cl.calcPosition')}</button>
      <div id="posResult" style="margin-top:12px"></div>
    </div>

    <!-- Bad scenario -->
    <div class="card">
      <div class="card-title">6️⃣ ${t('cl.badScenario')}</div>
      <textarea id="fBad" placeholder="${t('cl.badScenarioPh')}"></textarea>
    </div>

    <!-- Add to portfolio -->
    <div class="card">
      <div class="check-item" style="margin:0">
        <input type="checkbox" id="fAddPortfolio" checked>
        <div class="ci-body">
          <label class="ci-label" for="fAddPortfolio" style="margin:0; color:var(--text)">${t('cl.addToPortfolio')}</label>
          <div class="ci-sub field-row" id="portfolioFields">
            <input id="fQty" type="number" placeholder="${t('pf.qty')}">
            <input id="fAvg" type="number" step="0.01" placeholder="${t('pf.avgPrice')}">
          </div>
        </div>
      </div>
    </div>

    <!-- AI assistant -->
    <div class="card">
      <div class="card-title">🤖 ${t('cl.aiReview').replace('🤖 ','')}</div>
      <p class="muted" style="margin-bottom:12px">${t('cl.aiReviewHint')}</p>
      <button type="button" class="btn" id="aiBtn">${t('cl.aiReview')}</button>
      <div id="aiResult" style="margin-top:14px"></div>
    </div>

    <div class="btn-row" style="margin-top:6px; margin-bottom:30px">
      <button type="button" class="btn" id="submitBtn" style="flex:1">${t('cl.submit')}</button>
      <button type="button" class="btn secondary" id="cancelBtn">${t('common.cancel')}</button>
    </div>
    <p class="disclaimer">${t('disclaimer')}</p>
  `;

  wire(el, lang);
}

function wire(el, lang) {
  const $ = (s) => el.querySelector(s);

  // reference shortcuts
  $('#refIdentity').onclick = () => openReference('identity');
  $('#refCalc').onclick = () => openReference('calc');

  // identity selection
  el.querySelectorAll('.identity-opt').forEach((opt) => {
    opt.onclick = () => {
      el.querySelectorAll('.identity-opt').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.identity = opt.dataset.id;
      maybeSellWarn(el);
    };
  });

  // decision type
  const setDT = (dt) => {
    state.decision_type = dt;
    $('#dtBuy').classList.toggle('accent', dt === 'buy');
    $('#dtBuy').classList.toggle('secondary', dt !== 'buy');
    $('#dtSell').classList.toggle('danger', dt === 'sell');
    $('#dtSell').classList.toggle('secondary', dt !== 'sell');
    maybeSellWarn(el);
    $('#fAddPortfolio').closest('.card').style.display = dt === 'buy' ? '' : 'none';
  };
  $('#dtBuy').onclick = () => setDT('buy');
  $('#dtSell').onclick = () => setDT('sell');
  setDT('buy');

  // position size calc (deterministic, local)
  $('#calcBtn').onclick = () => {
    const risk = Number($('#fPortRisk').value);
    const stop = Number($('#fStopPct').value);
    const box = $('#posResult');
    if (!(risk > 0) || !(stop > 0)) {
      box.innerHTML = `<div class="alert info">${lang === 'ar' ? 'أدخل نسبة مخاطرة المحفظة ونسبة وقف الخسارة أولًا.' : 'Enter portfolio risk % and stop-loss % first.'}</div>`;
      return;
    }
    const entry = (risk / stop) * 100;
    state.position_size = Math.round(entry * 100) / 100;
    box.innerHTML = `<div class="alert ok"><div><strong>${t('cl.positionSize')}: ${entry.toFixed(2)}%</strong><br><span class="muted">(${risk}% ÷ ${stop}%) × 100</span></div></div>`;
  };

  // AI review
  $('#aiBtn').onclick = () => runAI(el);

  $('#cancelBtn').onclick = () => navigate('dashboard');
  $('#submitBtn').onclick = () => submit(el);
}

async function maybeSellWarn(el) {
  const box = el.querySelector('#sellWarn');
  const symbol = el.querySelector('#fSymbol').value.trim().toUpperCase();
  if (state.decision_type !== 'sell' || !symbol || !state.identity) { box.innerHTML = ''; return; }
  try {
    const rows = await api.getJournal({ symbol, type: 'buy' });
    const last = rows[0];
    if (last?.identity && last.identity !== state.identity) {
      const lang = getLang();
      box.innerHTML = `<div class="alert warn" style="margin-bottom:14px">⚠️ ${
        lang === 'ar'
          ? `دخلت هذا السهم كـ "${labelOf(last.identity)}" — هل تبيع الآن كـ "${labelOf(state.identity)}" بسبب حركة السعر؟`
          : `You entered this stock as "${labelOf(last.identity)}" — are you now selling as "${labelOf(state.identity)}" due to price movement?`
      }</div>`;
    } else box.innerHTML = '';
  } catch { box.innerHTML = ''; }
}

function labelOf(id) {
  return t({ long_term: 'cl.longTerm', swing: 'cl.swing', scalper: 'cl.scalper' }[id] || id);
}

function collect(el) {
  const $ = (s) => el.querySelector(s);
  const checks = {};
  CHECKS.forEach((c) => { checks[c.id] = $(`#chk_${c.id}`).checked; });
  return {
    identity: state.identity,
    decision_type: state.decision_type,
    name: $('#fName').value.trim(),
    symbol: $('#fSymbol').value.trim().toUpperCase(),
    sector: $('#fSector').value.trim(),
    current_price: $('#fPrice').value,
    thesis: $('#fThesis').value.trim(),
    checks,
    pe_value: $('#f_pe_value')?.value || '',
    support_level: $('#f_support_level')?.value || '',
    risk: {
      stop_loss_price: $('#fStopPrice').value,
      target_price: $('#fTarget').value,
      portfolio_risk_pct: $('#fPortRisk').value,
      stop_loss_pct: $('#fStopPct').value,
    },
    position_size: state.position_size,
    bad_scenario: $('#fBad').value.trim(),
  };
}

async function runAI(el) {
  const box = el.querySelector('#aiResult');
  const btn = el.querySelector('#aiBtn');
  const checklist = collect(el);
  const lang = getLang();

  let originalIdentity = null;
  if (checklist.decision_type === 'sell' && checklist.symbol) {
    try {
      const rows = await api.getJournal({ symbol: checklist.symbol, type: 'buy' });
      originalIdentity = rows[0]?.identity || null;
    } catch { /* ignore */ }
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${lang === 'ar' ? 'جارٍ التحليل…' : 'Analyzing…'}`;
  box.innerHTML = '';

  try {
    const res = await api.assistant({ checklist, originalIdentity });
    let html = '';

    const d = res.deterministic || {};
    if (d.positionSize?.ok) html += `<div class="alert ok" style="margin-bottom:10px">🧮 ${esc(d.positionSize.message[lang])}</div>`;
    if (d.identityConflict) html += `<div class="alert warn" style="margin-bottom:10px">⚠️ ${esc(d.identityConflict[lang])}</div>`;

    if (res.ai?.content) {
      html += `<div class="card" style="background:var(--bg-elev)"><div class="ai-output">${esc(res.ai.content)}</div></div>`;
      if (res.note) html += `<p class="muted" style="margin-top:8px">${esc(res.note[lang])}</p>`;
    } else if (res.note) {
      html += `<div class="alert info">${esc(res.note[lang])}</div>`;
    } else if (res.error) {
      html += `<div class="alert danger">${esc(res.error[lang])}</div>`;
    }
    box.innerHTML = html || `<div class="alert info">—</div>`;
  } catch (err) {
    const e = err.data?.error?.[lang] || err.message;
    box.innerHTML = `<div class="alert danger">${esc(e)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = t('cl.aiReview');
  }
}

async function submit(el) {
  const $ = (s) => el.querySelector(s);
  const lang = getLang();

  if (!state.identity) { toast(t('cl.selectIdentityFirst'), 'err'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

  const checklist = collect(el);
  try {
    const res = await api.createJournal({
      symbol: checklist.symbol,
      name: checklist.name,
      decision_type: checklist.decision_type,
      identity: checklist.identity,
      checklist,
    });

    // Optionally add/update the portfolio on a BUY.
    if (checklist.decision_type === 'buy' && $('#fAddPortfolio').checked && checklist.symbol) {
      const qty = Number($('#fQty').value) || 0;
      const avg = Number($('#fAvg').value) || Number(checklist.current_price) || 0;
      const { stocks } = await api.getStocks();
      const existing = stocks.find((s) => s.symbol === checklist.symbol);
      const payload = {
        symbol: checklist.symbol, name: checklist.name, sector: checklist.sector,
        quantity: qty, avg_price: avg, current_price: Number(checklist.current_price) || avg,
        target_price: checklist.risk.target_price, stop_loss: checklist.risk.stop_loss_price,
      };
      if (existing) await api.updateStock(existing.id, payload);
      else await api.createStock(payload);
    }

    if (res.warning) {
      toast(res.warning[lang], 'err');
    } else {
      toast(t('cl.savedOk'), 'ok');
    }
    setTimeout(() => navigate('journal'), 900);
  } catch (err) {
    toast(err.message, 'err');
  }
}
