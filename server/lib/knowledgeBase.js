// Verified knowledge base (context) that the backend injects into every
// NaraRouter request. This keeps the "verified knowledge" principle: the model
// reasons within this grounded context rather than from open-ended memory.
//
// NOTE: fees/taxes change frequently — these figures mirror the reference panel
// shown in the UI and the app always reminds the user to verify against the
// official source before acting.

export const KNOWLEDGE_CONTEXT = `
CONTEXT — Egyptian market (EGX) & Thndr specifics (verify against official sources; may change):
- Capital gains tax: 10% on realized gains from EGX-listed Egyptian shares for residents; non-residents are exempt on listed shares.
- Dividend withholding tax (WHT): 5% for EGX-listed companies (10% for non-listed).
- Thndr brokerage fee (effective 15 Feb 2024): EGP 2 per order + 0.1% of order value, charged PER buy/sell order separately.
- Possible extra fees: annual MCDR custody fee; slightly different fee structure for AUB custody vs standard Thndr custody.
- Position sizing principle: risk management matters more than analysis accuracy.
  Formula: entry% = (portfolio risk you accept % / stop-loss % on the stock) * 100.
- Investing identity (must be fixed BEFORE a trade): long-term investor / swing trader / scalper.
  The classic mistake is switching identity mid-trade (entering as a scalper, then "becoming"
  a long-term investor to justify holding a loss, or vice-versa on a quick gain).

YOUR ROLE (strict):
- You are a reflection assistant, NOT an advisor. You analyze the user's OWN checklist for
  logical contradictions, gaps, and identity drift, and you summarize their thesis back to them.
- You must NEVER give a direct buy/sell/hold recommendation, price target, or return promise.
- End by reminding the user the final decision is theirs.
- Answer in the same language as the user's checklist (Arabic or English).
`.trim();

/**
 * Build the final prompt payload sent to NaraRouter.
 * @param {object} checklist  the checklist data captured in the form.
 * @param {string} [userQuestion] optional specific ask (e.g. "review my thesis").
 */
export function buildMessages(checklist, userQuestion) {
  const system =
    `You are the reflection assistant inside a personal stock-decision tool for an EGX/Thndr trader.\n` +
    KNOWLEDGE_CONTEXT;

  const checklistText = JSON.stringify(checklist ?? {}, null, 2);

  const user =
    (userQuestion?.trim()
      ? `The user asks: "${userQuestion.trim()}"\n\n`
      : `Review the following decision checklist for logical contradictions, missing risk controls, and investing-identity drift. Summarize the thesis and point out anything inconsistent.\n\n`) +
    `Checklist data (JSON):\n${checklistText}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
