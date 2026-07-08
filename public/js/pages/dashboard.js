import { api, fmt, esc } from '../api.js';
import { t, getLang } from '../i18n.js';
import { navigate } from '../app.js';

export async function renderDashboard(el) {
  el.innerHTML = `<div class="empty">…</div>`;
  const lang = getLang();

  const [{ stocks, total_value }, journal, settings] = await Promise.all([
    api.getStocks(),
    api.getJournal(),
    api.getSettings(),
  ]);

  const totalPL = stocks.reduce((s, x) => s + x.pl, 0);
  const maxSingle = Number(settings.max_single_stock_pct || 20);

  // Build alerts
  const alerts = [];
  for (const s of stocks) {
    if (s.target_price && s.current_price >= s.target_price) {
      alerts.push({ type: 'ok', text: `${s.symbol} — ${t('dash.nearTarget')} (${fmt.money(s.current_price)} ≥ ${fmt.money(s.target_price)})` });
    }
    if (s.stop_loss && s.current_price <= s.stop_loss) {
      alerts.push({ type: 'danger', text: `${s.symbol} — ${t('dash.nearStop')} (${fmt.money(s.current_price)} ≤ ${fmt.money(s.stop_loss)})` });
    }
    if (s.weight_pct > maxSingle) {
      alerts.push({ type: 'warn', text: `${s.symbol} — ${t('dash.concentration')} (${fmt.pct(s.weight_pct)})` });
    }
  }

  const plClass = totalPL >= 0 ? 'pos' : 'neg';

  el.innerHTML = `
    <div class="grid grid-4">
      <div class="stat"><div class="label">${t('dash.stocksCount')}</div><div class="value">${stocks.length}</div></div>
      <div class="stat"><div class="label">${t('dash.portfolioValue')}</div><div class="value small">${fmt.money(total_value)} ${t('common.egp')}</div></div>
      <div class="stat"><div class="label">${t('dash.totalPL')}</div><div class="value small ${plClass}">${totalPL >= 0 ? '+' : ''}${fmt.money(totalPL)} ${t('common.egp')}</div></div>
      <div class="stat"><div class="label">${t('dash.decisions')}</div><div class="value">${journal.length}</div></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-title">🔔 ${t('dash.alerts')}</div>
      ${alerts.length
        ? alerts.map((a) => `<div class="alert ${a.type}" style="margin-bottom:8px">${esc(a.text)}</div>`).join('')
        : `<p class="muted">${t('dash.noAlerts')}</p>`}
    </div>

    <div class="grid grid-2" style="margin-top:18px">
      <div class="card">
        <div class="card-title">🕐 ${t('dash.recent')}</div>
        ${journal.slice(0, 5).map(recentRow).join('') || `<p class="muted">—</p>`}
      </div>
      <div class="card">
        <div class="card-title">⚡ ${t('dash.quickActions')}</div>
        <div class="btn-row" style="flex-direction:column; align-items:stretch">
          <button class="btn" id="qNew">${t('dash.newDecision')}</button>
          <button class="btn secondary" id="qPortfolio">${t('dash.viewPortfolio')}</button>
          <button class="btn secondary" id="qJournal">${t('dash.viewJournal')}</button>
        </div>
      </div>
    </div>

    <p class="disclaimer">${t('disclaimer')}</p>
  `;

  el.querySelector('#qNew').onclick = () => navigate('checklist');
  el.querySelector('#qPortfolio').onclick = () => navigate('portfolio');
  el.querySelector('#qJournal').onclick = () => navigate('journal');

  function recentRow(j) {
    const type = j.decision_type === 'sell' ? 'sell' : 'buy';
    const label = type === 'sell' ? t('cl.sell') : t('cl.buy');
    return `<div class="tl-head" style="padding:8px 0; border-bottom:1px solid var(--border)">
      <span class="pill ${type}">${label}</span>
      <strong>${esc(j.symbol || j.name || '—')}</strong>
      <span class="tl-date">${fmt.date(j.created_at)}</span>
    </div>`;
  }
}
