import { api, toast } from '../api.js';
import { t, getLang } from '../i18n.js';
import { confirmDialog } from '../components/modal.js';

export async function renderSettings(el) {
  el.innerHTML = `<div class="empty">…</div>`;
  const lang = getLang();
  const s = await api.getSettings();

  el.innerHTML = `
    <div class="card">
      <div class="card-title">⚙️ ${t('set.prefs')}</div>
      <div class="field">
        <label>${t('set.language')}</label>
        <select id="sLang">
          <option value="ar" ${s.language !== 'en' ? 'selected' : ''}>العربية</option>
          <option value="en" ${s.language === 'en' ? 'selected' : ''}>English</option>
        </select>
      </div>
      <div class="field-row">
        <div class="field"><label>${t('set.maxSingle')}</label><input id="sMaxSingle" type="number" step="1" value="${s.max_single_stock_pct ?? 20}"></div>
        <div class="field"><label>${t('set.maxRisk')}</label><input id="sMaxRisk" type="number" step="0.5" value="${s.max_portfolio_risk_pct ?? 3}"></div>
      </div>
      <button class="btn" id="savePrefs">${t('set.save')}</button>
    </div>

    <div class="card">
      <div class="card-title">💾 ${t('set.backup')}</div>
      <p class="muted" style="margin-bottom:14px">${t('set.backupHint')}</p>
      <div class="btn-row">
        <button class="btn secondary" id="exportBtn">${t('set.export')}</button>
        <button class="btn secondary" id="importBtn">${t('set.import')}</button>
        <input type="file" id="importFile" accept="application/json,.json" style="display:none">
      </div>
    </div>

    <p class="disclaimer">${t('disclaimer')}</p>
  `;

  el.querySelector('#savePrefs').onclick = async () => {
    await api.saveSettings({
      language: el.querySelector('#sLang').value,
      max_single_stock_pct: el.querySelector('#sMaxSingle').value,
      max_portfolio_risk_pct: el.querySelector('#sMaxRisk').value,
    });
    toast(t('set.saved'), 'ok');
  };

  el.querySelector('#exportBtn').onclick = async () => {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thndr-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t('set.exported'), 'ok');
  };

  const fileInput = el.querySelector('#importFile');
  el.querySelector('#importBtn').onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      toast(t('set.importErr'), 'err');
      fileInput.value = '';
      return;
    }
    const ok = await confirmDialog({
      title: t('set.importConfirmTitle'),
      message: t('set.importConfirmMsg'),
      confirmLabel: t('set.importDo'),
    });
    if (!ok) { fileInput.value = ''; return; }
    try {
      await api.importData(payload);
      toast(t('set.imported'), 'ok');
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      toast(err.data?.error?.[getLang()] || t('set.importErr'), 'err');
    }
    fileInput.value = '';
  };
}
