import { api } from './api.js';
import { t, setLang, getLang, applyStaticI18n } from './i18n.js';
import { initReferencePanel, openReference, refreshReferenceLang } from './components/referencePanel.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderChecklist } from './pages/checklist.js';
import { renderPortfolio } from './pages/portfolio.js';
import { renderJournal } from './pages/journal.js';

const ROUTES = {
  dashboard: { titleKey: 'nav.dashboard', icon: '🏠', render: renderDashboard },
  checklist: { titleKey: 'nav.checklist', icon: '✅', render: renderChecklist },
  portfolio: { titleKey: 'nav.portfolio', icon: '📊', render: renderPortfolio },
  journal: { titleKey: 'nav.journal', icon: '📓', render: renderJournal },
};

let current = 'dashboard';

export function navigate(route) {
  if (!ROUTES[route]) route = 'dashboard';
  current = route;
  if (location.hash !== `#/${route}`) location.hash = `#/${route}`;
  else renderCurrent();
  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = Object.entries(ROUTES)
    .map(([key, r]) => `<a data-route="${key}" class="${key === current ? 'active' : ''}">
        <span class="nav-icon">${r.icon}</span><span>${t(r.titleKey)}</span></a>`)
    .join('');
  nav.querySelectorAll('a').forEach((a) => {
    a.onclick = () => navigate(a.dataset.route);
  });
}

async function renderCurrent() {
  const route = ROUTES[current];
  document.getElementById('pageTitle').textContent = t(route.titleKey);
  renderNav();
  const page = document.getElementById('page');
  try {
    await route.render(page);
  } catch (err) {
    page.innerHTML = `<div class="alert danger">${err.message}</div>`;
    console.error(err);
  }
  window.scrollTo({ top: 0 });
}

function routeFromHash() {
  const h = location.hash.replace(/^#\//, '');
  return ROUTES[h] ? h : 'dashboard';
}

async function toggleLang() {
  const next = getLang() === 'ar' ? 'en' : 'ar';
  setLang(next);
  document.getElementById('langLabel').textContent = next === 'ar' ? 'EN' : 'ع';
  applyStaticI18n();
  refreshReferenceLang();
  await renderCurrent();
  api.saveSettings({ language: next }).catch(() => {});
}

async function boot() {
  // Load persisted language.
  let lang = 'ar';
  try { const s = await api.getSettings(); lang = s.language === 'en' ? 'en' : 'ar'; } catch { /* default */ }
  setLang(lang);
  document.getElementById('langLabel').textContent = lang === 'ar' ? 'EN' : 'ع';

  initReferencePanel();
  applyStaticI18n();

  // top controls
  document.getElementById('langToggle').onclick = toggleLang;
  document.getElementById('refBtn').onclick = () => openReference();
  document.getElementById('menuBtn').onclick = () =>
    document.getElementById('sidebar').classList.toggle('open');

  window.addEventListener('hashchange', () => { current = routeFromHash(); renderCurrent(); });

  current = routeFromHash();
  await renderCurrent();
}

boot();
