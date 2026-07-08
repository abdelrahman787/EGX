import { Router } from 'express';
import { buildMessages } from '../lib/knowledgeBase.js';
import { positionSize, identityConflict } from '../lib/deterministicChecks.js';

const router = Router();

// POST /api/assistant
// Body: { checklist, question?, originalIdentity? }
// Returns: { deterministic: {...}, ai: { content } | null, note }
router.post('/', async (req, res) => {
  const { checklist = {}, question, originalIdentity } = req.body;

  // ---- Layer 1: deterministic, free checks (always run) --------------------
  const deterministic = {};

  const risk = checklist.risk?.portfolio_risk_pct ?? checklist.portfolio_risk_pct;
  const stop = checklist.risk?.stop_loss_pct ?? checklist.stop_loss_pct;
  if (risk != null && stop != null) {
    deterministic.positionSize = positionSize(risk, stop);
  }

  if (checklist.decision_type === 'sell' && originalIdentity) {
    const conflict = identityConflict({
      decisionType: 'sell',
      currentIdentity: checklist.identity,
      originalIdentity,
    });
    if (conflict.conflict) deterministic.identityConflict = conflict.message;
  }

  // ---- Layer 2: NaraRouter LLM (only on demand) ----------------------------
  const apiKey = process.env.NARAROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_nararouter_api_key_here') {
    return res.json({
      deterministic,
      ai: null,
      note: {
        ar: 'المساعد الذكي غير مفعّل: أضف NARAROUTER_API_KEY في ملف .env لتفعيل التحليل النصي. الفحوصات الحتمية أعلاه تعمل بدون مفتاح.',
        en: 'AI assistant is disabled: add NARAROUTER_API_KEY to .env to enable text analysis. The deterministic checks above work without a key.',
      },
    });
  }

  const baseUrl = (process.env.NARAROUTER_BASE_URL || 'https://api.nararouter.com/v1').replace(/\/$/, '');
  const model = process.env.NARAROUTER_MODEL || 'tencent-hy3';
  const messages = buildMessages(checklist, question);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(502).json({
        deterministic,
        ai: null,
        error: {
          ar: `تعذّر الاتصال بـ NaraRouter (حالة ${resp.status}). تحقق من المفتاح واسم النموذج.`,
          en: `NaraRouter request failed (status ${resp.status}). Check the API key and model name.`,
        },
        detail: text.slice(0, 500),
      });
    }

    const data = await resp.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    return res.json({
      deterministic,
      ai: { content, model },
      note: {
        ar: 'هذه ملاحظات مساعدة على التفكير فقط، وليست توصية شراء/بيع. القرار النهائي لك.',
        en: 'These are reflection notes only, not a buy/sell recommendation. The final decision is yours.',
      },
    });
  } catch (err) {
    return res.status(502).json({
      deterministic,
      ai: null,
      error: {
        ar: 'خطأ في الاتصال بالمساعد الذكي (مهلة الاتصال أو الشبكة). الفحوصات الحتمية أعلاه ما زالت صالحة.',
        en: 'Error contacting the AI assistant (timeout or network). The deterministic checks above are still valid.',
      },
      detail: String(err?.message || err).slice(0, 300),
    });
  }
});

export default router;
