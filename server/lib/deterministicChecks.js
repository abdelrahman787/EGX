// Deterministic, free, instant checks that run BEFORE (and independent of) any
// NaraRouter LLM call. These are the "fast first layer": identity-conflict
// detection and position sizing. No API key or network needed.

const IDENTITY_LABELS = {
  long_term: { ar: 'مستثمر طويل الأجل', en: 'Long-term investor' },
  swing: { ar: 'متداول (Swing)', en: 'Swing trader' },
  scalper: { ar: 'مضارب قصير المدى', en: 'Scalper / Day trader' },
};

/**
 * Position sizing formula (from Thndr risk-management content):
 *   entry% = (portfolio risk you accept % / stop-loss % on the stock) * 100
 *
 * @param {number} portfolioRiskPct  % of the WHOLE portfolio you are willing to lose.
 * @param {number} stopLossPct       % distance of the stop loss on this stock.
 * @returns {{ ok: boolean, entryPct: number|null, message: object }}
 */
export function positionSize(portfolioRiskPct, stopLossPct) {
  const risk = Number(portfolioRiskPct);
  const stop = Number(stopLossPct);

  if (!isFinite(risk) || !isFinite(stop) || stop <= 0 || risk <= 0) {
    return {
      ok: false,
      entryPct: null,
      message: {
        ar: 'أدخل نسبة مخاطرة المحفظة ونسبة وقف الخسارة (أرقام موجبة) لحساب حجم المركز.',
        en: 'Enter portfolio risk % and stop-loss % (positive numbers) to size the position.',
      },
    };
  }

  const entryPct = (risk / stop) * 100;
  return {
    ok: true,
    entryPct: Math.round(entryPct * 100) / 100,
    message: {
      ar: `بناءً على استعدادك لخسارة ${risk}% من المحفظة ووقف خسارة ${stop}% على السهم، حجم المركز المقترح ≈ ${entryPct.toFixed(2)}% من المحفظة.`,
      en: `Based on risking ${risk}% of the portfolio with a ${stop}% stop loss, the suggested position size ≈ ${entryPct.toFixed(2)}% of the portfolio.`,
    },
  };
}

/**
 * Identity-conflict check: warns when a SELL decision contradicts the investing
 * identity that was declared when the position was opened (the "most famous
 * disaster" — switching identity mid-trade).
 *
 * @param {object} params
 * @param {string} params.decisionType   'buy' | 'sell'
 * @param {string} params.currentIdentity identity chosen for THIS decision
 * @param {string} params.originalIdentity identity recorded at buy time (from journal)
 * @param {string} [params.sellReason]   free-text reason (used only for a softer hint)
 */
export function identityConflict({ decisionType, currentIdentity, originalIdentity, sellReason }) {
  if (decisionType !== 'sell' || !originalIdentity) {
    return { conflict: false };
  }

  // Selling a position that was opened as a long-term investment, now acting
  // like a short-term trader/scalper is the classic panic-sell trap.
  const drifted =
    currentIdentity &&
    currentIdentity !== originalIdentity;

  if (!drifted) return { conflict: false };

  const orig = IDENTITY_LABELS[originalIdentity] || { ar: originalIdentity, en: originalIdentity };
  const now = IDENTITY_LABELS[currentIdentity] || { ar: currentIdentity, en: currentIdentity };

  return {
    conflict: true,
    original: originalIdentity,
    current: currentIdentity,
    message: {
      ar: `تنبيه تناقض هوية: فتحت هذه الصفقة كـ "${orig.ar}" لكنك تبيع الآن كـ "${now.ar}". هل قرار البيع بسبب تغيّر الأساس المنطقي فعلًا، أم مجرد رد فعل عاطفي على حركة السعر؟`,
      en: `Identity-conflict warning: you opened this position as "${orig.en}" but are now selling as "${now.en}". Is the sell driven by a real change in your thesis, or an emotional reaction to price?`,
    },
  };
}

export { IDENTITY_LABELS };
