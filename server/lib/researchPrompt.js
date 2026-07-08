// Builds the prompt for the "Research a company" mode. The assistant returns a
// STRICT JSON object that pre-fills the checklist fields. Guardrails here encode
// the lessons learned from real testing:
//   - fill the STRUCTURED fields (not just prose) to avoid mapping gaps
//   - treat any real numbers the user provided as ground truth
//   - flag every figure it invents as "needs verification" (no live market data)
//   - never assert current tax/fee amounts as fact
//   - avoid absolute rules; use hedged language
//   - distinguish missing input from missing analysis

export const RESEARCH_SCHEMA = `{
  "name": string,                      // full company name
  "symbol": string,                    // ticker (e.g. COMI)
  "sector": string,
  "thesis": string,                    // why this stock now, for the chosen identity
  "checks": {
    "pe_reasonable": boolean,          // is P/E reasonable vs sector? (qualitative)
    "pe_value": string,                // echo user's value if given, else an ESTIMATE
    "volatility_reason": string,       // likely reason for recent price movement
    "support_resistance": string       // e.g. "support 129-130, resistance 137-138, target 145"
  },
  "risk": {
    "stop_loss_price": string,         // suggested, ESTIMATE
    "target_price": string,            // suggested, ESTIMATE
    "stop_loss_pct": string,           // computed from entry & stop if possible
    "suggested_portfolio_risk_pct": string  // conservative default (e.g. 1)
  },
  "bad_scenario": string,              // what if it drops 20% / thesis fails, and the plan
  "assumptions": string[],             // explicit assumptions you made
  "uncertainties": string[],           // what you are unsure about
  "needs_verification": string[],      // EVERY figure/fact the user must confirm from a live source
  "summary": string                    // hedged read (conditional / cautious), NOT a hard buy/sell
}`;

export function buildResearchMessages({ name, symbol, identity, currentPrice, peValue, sector, lang }) {
  const language = lang === 'en' ? 'English' : 'Arabic';

  const system = [
    `You are a research assistant inside a personal stock-decision tool for an EGX / Thndr trader.`,
    `Given a company, you produce a DRAFT decision checklist that helps the user think — you are NOT giving investment advice.`,
    ``,
    `CRITICAL RULES:`,
    `1. Output ONLY a single valid JSON object matching this schema (no markdown fences, no text before/after):`,
    RESEARCH_SCHEMA,
    `2. You do NOT have live market data. Any price, P/E, support/resistance or financial figure you produce is an ESTIMATE from training data and may be outdated. List EVERY such figure in "needs_verification".`,
    `3. If the user provided real numbers (current price and/or P/E below), treat them as GROUND TRUTH: build your analysis around them and never contradict them.`,
    `4. Do NOT state current tax or fee amounts as fact. Egypt's EGX capital-gains/stamp-duty rules and Thndr's fee plans change and vary by plan — if relevant, add a "verify official source" item to needs_verification instead of asserting a number.`,
    `5. Avoid absolute rules. Use hedged language (e.g. "a 5% stop may be relatively wide for a swing trade and should be justified by the stock's volatility/ATR"), NOT "not suitable".`,
    `6. Distinguish a missing INPUT from a missing ANALYSIS — do not claim data is absent if it is implied in the thesis.`,
    `7. Keep risk management central: suggest a conservative position-sizing risk (around 1% of portfolio) and a realistic Risk/Reward.`,
    `8. Write all human-readable field text in ${language}.`,
    `9. "summary" must be a hedged read (e.g. "conditional / cautious"), never "strong buy", and must remind the user the final decision is theirs.`,
  ].join('\n');

  const known = [];
  known.push(`Company: ${name || symbol || '(unspecified — infer from symbol)'}`);
  if (symbol) known.push(`Symbol: ${symbol}`);
  if (sector) known.push(`Sector: ${sector}`);
  known.push(`Investing identity: ${identity || '(not chosen)'}`);
  if (currentPrice) known.push(`REAL current price provided by user (ground truth): ${currentPrice} EGP`);
  else known.push(`Current price: NOT provided — you may estimate but mark it in needs_verification.`);
  if (peValue) known.push(`REAL P/E provided by user (ground truth): ${peValue}`);
  else known.push(`P/E: NOT provided — you may estimate but mark it in needs_verification.`);

  const user =
    `Research this company and return the JSON draft for the checklist.\n\n` +
    known.join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

// Defensive JSON extraction: models sometimes wrap JSON in ```json fences or add
// a stray sentence. Pull out the first {...} block and parse it.
export function extractJson(text) {
  if (!text) return null;
  let t = String(text).trim();
  // strip code fences
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = t.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}
