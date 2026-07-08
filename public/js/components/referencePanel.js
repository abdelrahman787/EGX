import { t, getLang } from '../i18n.js';
import { KNOWLEDGE, supportResistanceSVG } from '../data/knowledge.js';
import { esc } from '../api.js';

let activeTab = 'ratios';
let searchTerm = '';

export function initReferencePanel() {
  const host = document.getElementById('referencePanel');
  host.innerHTML = `
    <div class="drawer" id="drawer">
      <div class="drawer-head">
        <h2>${t('ref.title')}</h2>
        <button class="icon-btn" id="drawerClose" aria-label="close">✕</button>
      </div>
      <div class="drawer-search">
        <input type="text" id="refSearch" placeholder="${t('ref.search')}" />
      </div>
      <div class="drawer-tabs" id="drawerTabs"></div>
      <div class="drawer-body" id="drawerBody"></div>
    </div>`;

  document.getElementById('drawerClose').onclick = closeReference;
  document.getElementById('drawerOverlay').onclick = closeReference;
  document.getElementById('refSearch').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderBody();
  });

  renderTabs();
  renderBody();
}

const TABS = [
  { id: 'ratios', key: 'ref.tab.ratios' },
  { id: 'technical', key: 'ref.tab.technical' },
  { id: 'calc', key: 'ref.tab.calc' },
  { id: 'egypt', key: 'ref.tab.egypt' },
  { id: 'identity', key: 'ref.tab.identity' },
];

function renderTabs() {
  const el = document.getElementById('drawerTabs');
  el.innerHTML = TABS.map(
    (tab) => `<button class="drawer-tab ${tab.id === activeTab ? 'active' : ''}" data-tab="${tab.id}">${t(tab.key)}</button>`
  ).join('');
  el.querySelectorAll('.drawer-tab').forEach((b) => {
    b.onclick = () => { activeTab = b.dataset.tab; renderTabs(); renderBody(); };
  });
}

function matches(text) {
  if (!searchTerm) return true;
  return text.toLowerCase().includes(searchTerm);
}

function renderBody() {
  const body = document.getElementById('drawerBody');
  const lang = getLang();

  if (activeTab === 'calc') { body.innerHTML = renderCalculators(); wireCalculators(); return; }

  if (activeTab === 'ratios' || activeTab === 'technical') {
    const items = KNOWLEDGE[activeTab][lang].filter(
      (i) => matches(i.title) || matches(i.def || '') || matches(i.read || '')
    );
    body.innerHTML = items.length
      ? items.map(renderConcept).join('')
      : `<p class="empty">—</p>`;
    return;
  }

  // egypt / identity: title + body
  const items = KNOWLEDGE[activeTab][lang].filter((i) => matches(i.title) || matches(i.body));
  const verify =
    activeTab === 'egypt'
      ? `<div class="alert warn" style="margin-bottom:14px">⚠️ ${t('common.verifySource')}</div>`
      : '';
  body.innerHTML =
    verify +
    (items.length
      ? items.map((i) => `<div class="kb-item"><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></div>`).join('')
      : `<p class="empty">—</p>`);
}

function renderConcept(i) {
  return `
    <div class="kb-item">
      <h3>${esc(i.title)}</h3>
      ${i.def ? `<p>${esc(i.def)}</p>` : ''}
      ${i.formula ? `<div class="kb-formula">${esc(i.formula)}</div>` : ''}
      ${i.svg ? supportResistanceSVG() : ''}
      ${i.example ? `<div class="kb-example">${esc(i.example)}</div>` : ''}
      ${i.read ? `<p>${esc(i.read)}</p>` : ''}
    </div>`;
}

// ---------- Interactive calculators ----------
function renderCalculators() {
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);
  return `
    <div class="calc-box">
      <h4>${L('حاسبة حجم المركز', 'Position Size Calculator')}</h4>
      <div class="field-row">
        <div><label>${L('خسارة مقبولة من المحفظة %', 'Portfolio risk %')}</label><input type="number" id="cPortRisk" value="3" step="0.5"></div>
        <div><label>${L('وقف الخسارة للسهم %', 'Stop-loss %')}</label><input type="number" id="cStop" value="15" step="0.5"></div>
      </div>
      <div class="calc-result" id="rPos">—</div>
      <p class="muted" style="margin-top:6px">${L('المعادلة: (خسارة المحفظة ÷ وقف الخسارة) × 100', 'Formula: (risk ÷ stop-loss) × 100')}</p>
    </div>

    <div class="calc-box">
      <h4>${L('حاسبة العائد الفعلي بين سعرين', 'Return Between Two Prices')}</h4>
      <div class="field-row">
        <div><label>${L('سعر الشراء', 'Buy price')}</label><input type="number" id="cBuy" value="40" step="0.1"></div>
        <div><label>${L('سعر البيع', 'Sell price')}</label><input type="number" id="cSell" value="46" step="0.1"></div>
      </div>
      <div class="field"><label>${L('عدد الأسهم', 'Shares')}</label><input type="number" id="cShares" value="100"></div>
      <div class="calc-result" id="rRet">—</div>
    </div>

    <div class="calc-box">
      <h4>${L('نسبة السهم من المحفظة', 'Stock Weight in Portfolio')}</h4>
      <div class="field-row">
        <div><label>${L('قيمة المركز', 'Position value')}</label><input type="number" id="cPos" value="10000"></div>
        <div><label>${L('إجمالي المحفظة', 'Total portfolio')}</label><input type="number" id="cTotal" value="50000"></div>
      </div>
      <div class="calc-result" id="rWeight">—</div>
    </div>

    <div class="calc-box">
      <h4>${L('نقطة التعادل بعد رسوم Thndr', 'Break-even After Thndr Fees')}</h4>
      <div class="field-row">
        <div><label>${L('سعر السهم', 'Share price')}</label><input type="number" id="cbPrice" value="40" step="0.1"></div>
        <div><label>${L('عدد الأسهم', 'Shares')}</label><input type="number" id="cbShares" value="100"></div>
      </div>
      <div class="calc-result" id="rBreak">—</div>
      <p class="muted" style="margin-top:6px">${L('يشمل رسوم شراء + بيع: 2 ج.م/أمر + 0.1% لكل أمر.', 'Includes buy + sell: EGP 2/order + 0.1% each.')}</p>
    </div>
  `;
}

function wireCalculators() {
  const lang = getLang();
  const L = (ar, en) => (lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const num = (id) => Number($(id)?.value) || 0;

  const calc = () => {
    // position size
    const risk = num('cPortRisk'), stop = num('cStop');
    $('rPos').textContent = stop > 0
      ? `${((risk / stop) * 100).toFixed(2)}% ${L('من المحفظة', 'of portfolio')}`
      : '—';

    // return
    const buy = num('cBuy'), sell = num('cSell'), sh = num('cShares');
    if (buy > 0) {
      const pct = ((sell - buy) / buy) * 100;
      const egp = (sell - buy) * sh;
      $('rRet').textContent = `${pct.toFixed(2)}%  •  ${egp.toFixed(2)} ${t('common.egp')}`;
    } else $('rRet').textContent = '—';

    // weight
    const pos = num('cPos'), total = num('cTotal');
    $('rWeight').textContent = total > 0 ? `${((pos / total) * 100).toFixed(2)}%` : '—';

    // break-even after fees
    const price = num('cbPrice'), shares = num('cbShares');
    if (price > 0 && shares > 0) {
      const orderValue = price * shares;
      const buyFee = 2 + orderValue * 0.001;
      // sell fee depends on sell value; approximate at same price then solve.
      // Break-even sell price P: (P*shares) - (P*shares*0.001) - 2 = orderValue + buyFee
      // P*shares*0.999 = orderValue + buyFee + 2  →  P = (orderValue + buyFee + 2) / (shares*0.999)
      const beP = (orderValue + buyFee + 2) / (shares * 0.999);
      const risePct = ((beP - price) / price) * 100;
      $('rBreak').textContent = `${L('سعر التعادل', 'break-even')} ≈ ${beP.toFixed(3)} ${t('common.egp')}  (+${risePct.toFixed(2)}%)`;
    } else $('rBreak').textContent = '—';
  };

  ['cPortRisk','cStop','cBuy','cSell','cShares','cPos','cTotal','cbPrice','cbShares']
    .forEach((id) => $(id)?.addEventListener('input', calc));
  calc();
}

// ---------- open/close ----------
export function openReference(tab) {
  if (tab) { activeTab = tab; renderTabs(); renderBody(); }
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}
export function closeReference() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

export function refreshReferenceLang() {
  const drawer = document.getElementById('referencePanel');
  if (drawer.querySelector('.drawer')) {
    drawer.querySelector('.drawer-head h2').textContent = t('ref.title');
    document.getElementById('refSearch').placeholder = t('ref.search');
    renderTabs();
    renderBody();
  }
}
