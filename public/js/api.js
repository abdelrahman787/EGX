// Thin REST client for the local backend.

async function req(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { data, status: res.status });
  return data;
}

export const api = {
  // stocks
  getStocks: () => req('GET', '/api/stocks'),
  createStock: (s) => req('POST', '/api/stocks', s),
  updateStock: (id, s) => req('PUT', `/api/stocks/${id}`, s),
  deleteStock: (id) => req('DELETE', `/api/stocks/${id}`),

  // journal
  getJournal: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return req('GET', `/api/journal${q ? `?${q}` : ''}`);
  },
  getJournalEntry: (id) => req('GET', `/api/journal/${id}`),
  createJournal: (entry) => req('POST', '/api/journal', entry),
  addReview: (id, review) => req('PATCH', `/api/journal/${id}/review`, { review }),
  deleteJournal: (id) => req('DELETE', `/api/journal/${id}`),

  // goals
  getGoals: () => req('GET', '/api/goals'),
  createGoal: (g) => req('POST', '/api/goals', g),
  updateGoal: (id, g) => req('PUT', `/api/goals/${id}`, g),
  deleteGoal: (id) => req('DELETE', `/api/goals/${id}`),

  // settings
  getSettings: () => req('GET', '/api/settings'),
  saveSettings: (s) => req('PUT', '/api/settings', s),

  // assistant
  assistant: (payload) => req('POST', '/api/assistant', payload),
  health: () => req('GET', '/api/health'),
};

// Toast helper
let toastTimer;
export function toast(message, type = '') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

// Small helpers
export const fmt = {
  money: (n) => `${Number(n || 0).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  pct: (n) => `${Number(n || 0).toFixed(2)}%`,
  date: (s) => {
    if (!s) return '';
    const d = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z'));
    return d.toLocaleString();
  },
};

export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
