// Single source of truth for NaraRouter defaults, shared by the assistant and
// research routes. Matches .env.example exactly.

export const NARAROUTER_DEFAULT_BASE_URL = 'https://router.bynara.id/v1';
export const NARAROUTER_DEFAULT_MODEL = 'mistral-medium-3-5';

/** Resolves the effective NaraRouter config from environment variables. */
export function getNararouterConfig() {
  const apiKey = process.env.NARAROUTER_API_KEY;
  return {
    apiKey,
    configured: !!apiKey && apiKey !== 'your_nararouter_api_key_here',
    baseUrl: (process.env.NARAROUTER_BASE_URL || NARAROUTER_DEFAULT_BASE_URL).replace(/\/$/, ''),
    model: process.env.NARAROUTER_MODEL || NARAROUTER_DEFAULT_MODEL,
  };
}
