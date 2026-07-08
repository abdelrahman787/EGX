import { Router } from 'express';
import { buildResearchMessages, extractJson } from '../lib/researchPrompt.js';
import { getNararouterConfig } from '../lib/nararouterConfig.js';

const router = Router();

// POST /api/research
// Body: { name, symbol, identity, currentPrice, peValue, sector, lang }
// Returns: { data: <parsed checklist draft> | null, raw, note | error }
router.post('/', async (req, res) => {
  const { name, symbol, identity, currentPrice, peValue, sector, lang } = req.body;

  if (!name && !symbol) {
    return res.status(400).json({
      error: {
        ar: 'أدخل اسم الشركة أو الرمز أولًا.',
        en: 'Enter a company name or symbol first.',
      },
    });
  }

  const { apiKey, configured, baseUrl, model } = getNararouterConfig();
  if (!configured) {
    return res.status(400).json({
      error: {
        ar: 'وضع "حلّل الشركة" يحتاج مفتاح NARAROUTER_API_KEY في ملف .env.',
        en: 'The "Research company" mode needs NARAROUTER_API_KEY in .env.',
      },
    });
  }

  const messages = buildResearchMessages({ name, symbol, identity, currentPrice, peValue, sector, lang });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(502).json({
        error: {
          ar: `تعذّر الاتصال بـ NaraRouter (حالة ${resp.status}).`,
          en: `NaraRouter request failed (status ${resp.status}).`,
        },
        detail: text.slice(0, 500),
      });
    }

    const payload = await resp.json();
    const content =
      payload?.choices?.[0]?.message?.content ??
      payload?.choices?.[0]?.text ??
      '';

    const data = extractJson(content);

    if (!data) {
      // Model replied but not as clean JSON — return raw so the user still benefits.
      return res.json({
        data: null,
        raw: content,
        note: {
          ar: 'المساعد رد لكن مش بصيغة منظّمة — النص خام بالأسفل. جرّب مرة تانية أو غيّر النموذج.',
          en: 'The assistant replied but not as structured JSON — raw text below. Try again or switch model.',
        },
      });
    }

    return res.json({
      data,
      raw: content,
      note: {
        ar: '⚠️ الأرقام المقترحة تقديرية من معرفة النموذج (مش بيانات حيّة) — أكّدها من Thndr/مصدر رسمي قبل الحفظ. القرار النهائي لك.',
        en: '⚠️ Suggested numbers are the model\'s estimates (not live data) — verify against Thndr / an official source before saving. The final decision is yours.',
      },
    });
  } catch (err) {
    return res.status(502).json({
      error: {
        ar: 'خطأ في الاتصال بالمساعد (مهلة أو شبكة).',
        en: 'Error contacting the assistant (timeout or network).',
      },
      detail: String(err?.message || err).slice(0, 300),
    });
  }
});

export default router;
