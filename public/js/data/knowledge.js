// Reference-panel content. Each concept carries: title, definition, formula,
// a fully-worked numeric example, and how to read it. Bilingual (ar/en).

export const KNOWLEDGE = {
  ratios: {
    ar: [
      {
        title: 'P/E — مكرر الربحية',
        def: 'يقيس كم يدفع المستثمر مقابل كل جنيه من أرباح الشركة.',
        formula: 'P/E = سعر السهم ÷ ربحية السهم (EPS)',
        example: 'مثال: سعر السهم 50 ج.م ÷ ربحية 5 ج.م = P/E يساوي 10.',
        read: 'الرقم المطلق أقل أهمية من مقارنته بمتوسط القطاع؛ P/E مرتفع قد يعني توقعات نمو أو مبالغة في السعر.',
      },
      {
        title: 'P/B — السعر إلى القيمة الدفترية',
        def: 'يقارن سعر السوق بالقيمة الدفترية لحقوق المساهمين.',
        formula: 'P/B = سعر السهم ÷ (حقوق الملكية ÷ عدد الأسهم)',
        example: 'مثال: سعر السهم 30 ج.م، والقيمة الدفترية للسهم 20 ج.م → P/B = 1.5.',
        read: 'أقل من 1 قد يعني السهم تحت قيمته الدفترية (أو مشكلة حقيقية)؛ يُقرأ حسب القطاع.',
      },
      {
        title: 'EPS — ربحية السهم',
        def: 'نصيب السهم الواحد من صافي أرباح الشركة.',
        formula: 'EPS = صافي الربح ÷ عدد الأسهم القائمة',
        example: 'مثال: صافي ربح 100 مليون ÷ 20 مليون سهم = EPS يساوي 5 ج.م.',
        read: 'نمو EPS عبر الزمن مؤشر جوهري على تحسن ربحية الشركة.',
      },
      {
        title: 'ROE — العائد على حقوق الملكية',
        def: 'كفاءة الشركة في تحقيق أرباح من أموال المساهمين.',
        formula: 'ROE = (صافي الربح ÷ حقوق الملكية) × 100',
        example: 'مثال: صافي ربح 40 مليون ÷ حقوق ملكية 200 مليون = 20%.',
        read: 'ROE مرتفع ومستقر جيد، لكن انتبه لو كان ناتجًا عن ديون مرتفعة.',
      },
      {
        title: 'Dividend Yield — عائد التوزيعات',
        def: 'نسبة التوزيع النقدي السنوي إلى سعر السهم.',
        formula: 'العائد = (التوزيع السنوي ÷ سعر السهم) × 100',
        example: 'مثال: توزيع 2 ج.م على سهم سعره 40 ج.م = عائد 5%.',
        read: 'عائد مرتفع جدًا قد يكون إشارة خطر (سعر منخفض بسبب مشاكل)، لا مجرد كرم.',
      },
      {
        title: 'Debt/Equity — الرافعة المالية',
        def: 'نسبة ديون الشركة إلى حقوق الملكية.',
        formula: 'D/E = إجمالي الديون ÷ حقوق الملكية',
        example: 'مثال: ديون 150 مليون ÷ حقوق 100 مليون = 1.5.',
        read: 'ما يُعتبر مرتفعًا يختلف حسب القطاع (البنوك والعقارات تتحمل ديونًا أعلى بطبيعتها).',
      },
    ],
    en: [
      { title: 'P/E — Price to Earnings', def: 'How much you pay per pound of company earnings.', formula: 'P/E = Share price ÷ EPS', example: 'e.g. 50 EGP ÷ 5 EGP EPS = P/E of 10.', read: 'The absolute number matters less than comparison to the sector average.' },
      { title: 'P/B — Price to Book', def: 'Market price vs book value of equity.', formula: 'P/B = Share price ÷ (Equity ÷ Shares)', example: 'e.g. 30 EGP price, 20 EGP book value → P/B = 1.5.', read: 'Below 1 may mean undervalued (or a real problem); read by sector.' },
      { title: 'EPS — Earnings Per Share', def: "One share's slice of net profit.", formula: 'EPS = Net profit ÷ Shares outstanding', example: 'e.g. 100M ÷ 20M shares = EPS of 5 EGP.', read: 'EPS growth over time is a core sign of improving profitability.' },
      { title: 'ROE — Return on Equity', def: 'Efficiency of generating profit from shareholder money.', formula: 'ROE = (Net profit ÷ Equity) × 100', example: 'e.g. 40M ÷ 200M equity = 20%.', read: 'High, stable ROE is good — but watch if driven by heavy debt.' },
      { title: 'Dividend Yield', def: 'Annual cash dividend relative to price.', formula: 'Yield = (Annual dividend ÷ Price) × 100', example: 'e.g. 2 EGP on a 40 EGP share = 5% yield.', read: 'A very high yield can be a risk flag (depressed price), not generosity.' },
      { title: 'Debt/Equity — Leverage', def: 'Company debt relative to equity.', formula: 'D/E = Total debt ÷ Equity', example: 'e.g. 150M ÷ 100M = 1.5.', read: 'What counts as high varies by sector (banks/real-estate carry more).' },
    ],
  },

  technical: {
    ar: [
      {
        title: 'المتوسطات المتحركة (Moving Averages)',
        def: 'متوسط السعر عبر عدد أيام محدد، يُنعّم التذبذب ويُبرز الاتجاه.',
        formula: 'MA(5) = مجموع إغلاق آخر 5 أيام ÷ 5',
        example: 'مثال: إغلاقات 10, 11, 12, 11, 13 → المتوسط = 57 ÷ 5 = 11.4.',
        read: 'تقاطع المتوسط القصير فوق الطويل يُقرأ كإشارة صعود (والعكس هبوط).',
      },
      {
        title: 'الدعم والمقاومة',
        def: 'الدعم مستوى يميل السعر للارتداد منه صعودًا، والمقاومة مستوى يصعب اختراقه صعودًا.',
        svg: true,
        read: 'كسر مستوى بحجم تداول قوي قد يحوّل الدعم لمقاومة والعكس.',
      },
      {
        title: 'RSI — مؤشر القوة النسبية',
        def: 'مؤشر زخم من 0 إلى 100 يقيس سرعة وتغير حركة السعر.',
        formula: 'RSI فوق 70 = تشبع شرائي، تحت 30 = تشبع بيعي',
        example: 'مثال: RSI = 75 يعني السهم في منطقة تشبع شرائي وقد يصحّح.',
        read: 'ليس إشارة بيع/شراء مباشرة — يُستخدم مع سياق الاتجاه العام.',
      },
    ],
    en: [
      { title: 'Moving Averages', def: 'Average price over N days; smooths noise and shows trend.', formula: 'MA(5) = sum of last 5 closes ÷ 5', example: 'e.g. 10,11,12,11,13 → 57 ÷ 5 = 11.4.', read: 'Short MA crossing above long MA reads as bullish (and vice versa).' },
      { title: 'Support & Resistance', def: 'Support tends to bounce price up; resistance caps it.', svg: true, read: 'A break on strong volume can flip support into resistance.' },
      { title: 'RSI — Relative Strength Index', def: 'A 0–100 momentum indicator of price speed/change.', formula: 'RSI > 70 = overbought, < 30 = oversold', example: 'e.g. RSI = 75 → overbought, may correct.', read: 'Not a direct buy/sell — use with the broader trend.' },
    ],
  },

  egypt: {
    ar: [
      { title: 'ضريبة الأرباح الرأسمالية', body: '10% على أرباح بيع الأسهم المصرية المقيدة في البورصة للمقيمين؛ غير المقيمين معفيون من هذه الضريبة على الأسهم المقيدة.' },
      { title: 'ضريبة التوزيعات (WHT)', body: '5% على توزيعات الشركات المقيدة في البورصة المصرية، مقابل 10% للشركات غير المقيدة.' },
      { title: 'إعفاء IPO الجديد', body: 'بموجب القانون رقم 30 لسنة 2023، أسهم الطرح الأول (IPO) خلال سنتين من صدور القانون (قبل 15 يونيو 2025) تتمتع بإعفاء 50% من الأرباح الرأسمالية — تحقق من سريان الإعفاء وتاريخ انتهائه وقت الاستخدام.' },
      { title: 'رسوم وساطة Thndr', body: 'فعّالة من 15 فبراير 2024: 2 ج.م لكل أمر + 0.1% من قيمة الأمر، تُحسب لكل أمر شراء/بيع على حدة (حتى لو عدة أوامر لنفس السهم في نفس اليوم).' },
      { title: 'رسوم إضافية محتملة', body: 'رسوم حفظ سنوية من مصر المقاصة (MCDR)، وهيكل رسوم مختلف قليلًا لحفظ Ahli United Bank (AUB) مقابل حفظ Thndr القياسي.' },
      { title: 'طرق الإيداع', body: 'InstaPay، المحافظ الإلكترونية (فودافون كاش، أورنج ماني، إتصالات كاش)، تحويل بنكي، بطاقات خصم مباشر (Debit فقط — لا يُقبل الائتمان).' },
      { title: 'صناديق الاستثمار مقابل ETF', body: 'صندوق الاستثمار يُدار بقرار مدير الصندوق وقد لا يطابق أوزان المؤشر؛ صندوق الـ ETF (مثل EGX30 ETF) يتتبع المؤشر بنفس أوزانه. رسوم الاسترداد عادة تتناقص لتصل صفرًا بعد 3 سنوات.' },
      { title: 'مواعيد إغلاق التنفيذ (Cut-off)', body: 'لكل صندوق وقت قطع مختلف؛ الطلب بعد الموعد يُحتسب في اليوم التالي.' },
      { title: 'أدوات ThndrX', body: 'فلاتر السوق (52 أسبوع، الزخم والاختراق)، عمق السوق (أوامر العرض/الطلب)، أنواع أوامر متقدمة (فوري أو إلغاء، صالح حتى الإلغاء، حد أدنى للتنفيذ).' },
    ],
    en: [
      { title: 'Capital Gains Tax', body: '10% on realized gains from EGX-listed Egyptian shares for residents; non-residents are exempt on listed shares.' },
      { title: 'Dividend WHT', body: '5% on dividends of EGX-listed companies vs 10% for non-listed.' },
      { title: 'New IPO Exemption', body: 'Under amended Law 30/2023, first-offered (IPO) shares within two years of the law (before 15 Jun 2025) get a 50% capital-gains exemption — verify validity and expiry at time of use.' },
      { title: 'Thndr Brokerage Fees', body: 'Effective 15 Feb 2024: EGP 2 per order + 0.1% of order value, charged per buy/sell order separately (even multiple orders for the same stock same day).' },
      { title: 'Possible Extra Fees', body: 'Annual MCDR custody fee; slightly different structure for AUB custody vs standard Thndr custody.' },
      { title: 'Deposit Methods', body: 'InstaPay, e-wallets (Vodafone Cash, Orange Money, Etisalat Cash), bank transfer, debit cards (Debit only — no Credit).' },
      { title: 'Mutual Funds vs ETF', body: 'A mutual fund is manager-driven and may not match index weights; an ETF (e.g. EGX30 ETF) tracks the index by its weights. Redemption fees usually decline to zero after 3 years.' },
      { title: 'Cut-off Times', body: 'Each fund has a different cut-off; orders after it count as the next day.' },
      { title: 'ThndrX Tools', body: 'Market filters (52-week, momentum/breakout), market depth (bid/ask), advanced order types (IOC, GTC, minimum fill).' },
    ],
  },

  identity: {
    ar: [
      { title: 'مستثمر طويل الأجل', body: 'يشتري "شركة" لا "سعرًا". وقف الخسارة بعيد جدًا أو غير مستخدم، لا يتأثر بالتذبذبات القصيرة.' },
      { title: 'متداول (Swing)', body: 'يحتفظ بالسهم أيامًا لأسابيع، وله خطة دخول وخروج واضحة.' },
      { title: 'مضارب (Scalper / Day trader)', body: 'مراكز قصيرة جدًا (دقائق لساعات)، غير متاح فعليًا في تعاملات Thndr العادية.' },
      { title: '⚠️ الكارثة الأشهر', body: 'تغيير الهوية في نص الصفقة: الدخول كمضارب ثم البقاء "مستثمر طويل الأجل" عند الخسارة، أو العكس عند الربح السريع. حدد هويتك قبل الشراء والتزم بها.' },
      { title: 'مبدأ حجم المركز', body: 'إدارة المخاطر أهم من دقة التحليل — لا تحليل صحيح 100%، لكن حجم المركز الصحيح يحميك من الخطأ.' },
    ],
    en: [
      { title: 'Long-term Investor', body: 'Buys a "company" not a "price". Stop-loss far away or unused; unaffected by short swings.' },
      { title: 'Swing Trader', body: 'Holds days to weeks with a clear entry/exit plan.' },
      { title: 'Scalper / Day Trader', body: 'Very short positions (minutes to hours); not really practical on standard Thndr.' },
      { title: '⚠️ The Most Famous Disaster', body: 'Switching identity mid-trade: entering as a scalper then "becoming" a long-term investor on a loss, or vice-versa on a quick gain. Fix your identity before buying and stick to it.' },
      { title: 'Position-Sizing Principle', body: 'Risk management beats analysis accuracy — no analysis is 100% right, but correct sizing protects you from being wrong.' },
    ],
  },
};

// Simple SVG support/resistance illustration (used in the technical tab).
export function supportResistanceSVG() {
  return `
  <svg class="svg-chart" viewBox="0 0 300 140" preserveAspectRatio="none" role="img" aria-label="support resistance">
    <line x1="0" y1="30" x2="300" y2="30" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="6" y="24" fill="#ef4444" font-size="10">Resistance</text>
    <line x1="0" y1="110" x2="300" y2="110" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="6" y="124" fill="#22c55e" font-size="10">Support</text>
    <polyline fill="none" stroke="#3b82f6" stroke-width="2"
      points="0,80 30,60 55,95 85,45 110,105 140,55 170,100 200,40 230,95 260,60 300,85"/>
  </svg>`;
}
