"use client";

/* Arabic and English, for the three surfaces the brief asks for: the
   landing page, the Brand Read and the thread.

   The current app has two dead `العربية` toggles and a third that flips
   its own label. Here the toggle sets `dir` and `lang` on the document,
   swaps the font stack, and every layout uses logical properties, so the
   whole page mirrors rather than only the words.

   Content that comes from the mock — a store's own product names, a
   creator's handle — is NOT translated, because it would be wrong to
   invent an Arabic name for a real product. Those stay as they are, and
   the sentence around them mirrors. */

import { useLocale } from "./store";

export type Locale = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

export const STR: Dict = {
  /* Landing.

     The Arabic below is a first pass in the same register as the English,
     pending the Arabic copywriter. */
  /* ── Landing ──────────────────────────────────────────────────
     Every string here is from heymoon-copy-changes-before-after, IDs
     L1 to L17, which is the source of truth for this page. Where the
     spec's three promises (L9 to L14) are made concrete by a section,
     the promise IS that section's heading and body rather than being
     repeated as a separate card.

     The Arabic remains a first pass for the Arabic copywriter. */

  /* L2, L3. Line 2 carries the accent colour. */
  "landing.h1a": { en: "A campaign in fifteen seconds.", ar: "حملة في 15 ثانية." },
  "landing.h1b": { en: "Sales, guaranteed.", ar: "ومبيعات مضمونة." },
  /* L4, first half. It used to sit under the headline; the hero is
     tighter without it, so it now introduces the three cards, which is
     what the sentence actually describes. Its last three sentences are
     the chips under the field. */
  "landing.sub": {
    en: "Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.",
    ar: "ألصق رابط متجرك، وتبني لك هاي مون حملة مؤثرين كاملة حول ما تبيعه، وتضمن لك المبيعات.",
  },
  "landing.cardsT": { en: "One link. The whole campaign.", ar: "رابط واحد. والحملة كاملة." },
  "landing.no1": { en: "No forms to fill in", ar: "لا نماذج تملؤها" },
  "landing.no2": { en: "No brief to write", ar: "لا بريف تكتبه" },
  "landing.no3": { en: "No agency to manage", ar: "لا وكالة تتابعها" },
  /* L5, L6, L7. */
  "landing.placeholder": { en: "yourstore.com", ar: "yourstore.com" },
  /* L6 said "See the plan". Changed to a single verb: the button is
     the one control on the page and it reads as an action, not as a
     destination. Still a verb with no arrow, which is what G8 asks. */
  "landing.cta": { en: "Start", ar: "ابدأ" },
  "landing.reading": { en: "Reading", ar: "جارٍ القراءة" },
  "landing.invalid": { en: "Paste a store link, like yourstore.com.", ar: "ألصق رابط متجر، مثل yourstore.com." },
  /* L15, L16. */
  "landing.nothing": {
    en: "Nothing is charged. Nothing is published. Not until you say so.",
    ar: "لا يُخصم أي مبلغ. ولا يُنشر أي محتوى. ولا شيء قبل موافقتك.",
  },
  "landing.credit": {
    en: "Built by AI. Backed by HeyMoon.AI, a Saudi company.",
    ar: "مبني بالذكاء الاصطناعي. ومدعوم من HeyMoon.AI، شركة سعودية.",
  },

  /* The three cards. Each is a picture of the product with two lines
     under it, so the page shows before it tells. Their titles are the
     spec's three promises, L9, L13 and L11, which head the thing that
     proves them rather than being printed as a separate row. */
  "landing.c1t": { en: "HeyMoon reads your store", ar: "تقرأ هاي مون متجرك" },
  "landing.c1d": {
    en: "Catalogue, prices, voice and markets. In about fifteen seconds.",
    ar: "الكتالوج والأسعار والنبرة والأسواق. في نحو 15 ثانية.",
  },


  "landing.v1t": { en: "See everything. Before you pay anything.", ar: "شاهد كل شيء. قبل أن تدفع أي شيء." },
  "landing.v1d": {
    en: "The whole campaign, built and priced before you approve it: the markets, the creators, the budget and the brief.",
    ar: "الحملة كاملة، مبنية ومُسعّرة قبل أن توافق عليها: الأسواق وصنّاع المحتوى والميزانية والموجز.",
  },

  "landing.v3t": { en: "Start small. Scale on results.", ar: "ابدأ صغيرًا. وتوسّع على النتائج." },
  "landing.v3d": {
    en: "Your first campaign is $1,000, the same for every brand. The next is offered only when this one reaches 80% of its target.",
    ar: "حملتك الأولى بـ 1,000 دولار، وهي نفسها لكل علامة تجارية. ولا تُعرض التالية إلا عندما تبلغ هذه 80% من هدفها.",
  },

  "landing.v2t": { en: "Miss the number? You get your money back, in proportion.", ar: "لم يتحقق الرقم؟ نعيد لك مالك بالنسبة نفسها." },
  "landing.v2d": {
    en: "Every campaign comes with a sales figure, in writing, before you pay. If your sales come in under it, you get back the same share of what you paid: reach 80% of it and 20% comes back.",
    ar: "كل حملة تأتي برقم مبيعات مكتوب قبل أن تدفع. وإذا جاءت مبيعاتك أقل منه، نعيد لك الحصة نفسها مما دفعت: إذا بلغت 80% منه يعود إليك 20%.",
  },
  "landing.threePhasesAt": { en: "across three phases, at", ar: "عبر ثلاث مراحل، بمعدل" },
  "landing.signature": { en: "HeyMoon.AI, a Saudi company", ar: "HeyMoon.AI، شركة سعودية" },

  /* The run, as four steps that advance on their own. Each one names
     the agent doing the work, because a brand that is about to spend
     money is owed the name of what is spending it. */
  "landing.runT": { en: "From a link to a live campaign.", ar: "من رابط إلى حملة تعمل." },
  "landing.runD": {
    en: "Four steps. You decide at one of them, and it ends on the number HeyMoon guaranteed.",
    ar: "أربع خطوات. تقرر أنت في واحدة منها، وتنتهي عند الرقم الذي ضمنته هاي مون.",
  },
  "landing.r1t": { en: "Paste your store link", ar: "ألصق رابط متجرك" },
  "landing.r1d": {
    en: "HeyMoon reads the catalogue, the prices, the voice and the markets it already ships to.",
    ar: "تقرأ هاي مون الكتالوج والأسعار والنبرة والأسواق التي تشحن إليها بالفعل.",
  },
  "landing.r2t": { en: "The plan arrives, priced", ar: "تصل الخطة مُسعّرة" },
  "landing.r2d": {
    en: "Markets, creators, products and the brief, with the sales figure it guarantees. Change anything.",
    ar: "الأسواق وصنّاع المحتوى والمنتجات والموجز، مع رقم المبيعات المضمون. غيّر ما تشاء.",
  },
  "landing.r3t": { en: "You start Phase 1", ar: "تبدأ المرحلة الأولى" },
  "landing.r3d": {
    en: "One payment, the same for every brand. Nothing after it is charged or committed.",
    ar: "دفعة واحدة، نفسها لكل علامة تجارية. ولا شيء بعدها يُخصم أو يُلتزم به.",
  },
  "landing.r4t": { en: "The sales land on the number", ar: "تصل المبيعات إلى الرقم" },
  "landing.r4d": {
    en: "Three phases run to the sales HeyMoon guaranteed on your budget: 1x, then 2x, then 3x.",
    ar: "ثلاث مراحل تسير نحو المبيعات التي ضمنتها هاي مون على ميزانيتك: 1x ثم 2x ثم 3x.",
  },
  "landing.mock.salesLabel": { en: "Sales, guaranteed", ar: "المبيعات المضمونة" },

  /* The seven, by name and by the stage each one runs. */
  "landing.agentsT": { en: "Seven agents run the campaign.", ar: "سبعة وكلاء يديرون الحملة." },
  "landing.agentsD": {
    en: "Each one owns a stage, and each one signs the work it did.",
    ar: "لكل واحد منهم مرحلة، ويوقّع كل منهم العمل الذي أنجزه.",
  },
  "landing.stage.intake": { en: "Intake", ar: "الاستقبال" },
  "landing.stage.matching": { en: "Matching", ar: "المطابقة" },
  "landing.stage.safety": { en: "Safety", ar: "السلامة" },
  "landing.stage.creative": { en: "Creative", ar: "الإبداع" },
  "landing.stage.activation": { en: "Activation", ar: "التفعيل" },
  "landing.stage.optimization": { en: "Optimization", ar: "التحسين" },
  "landing.stage.learning": { en: "Learning", ar: "التعلّم" },

  /* The multiple. The spec's G2 retires the word "ROAS" in favour of
     "sales", and it is retired everywhere else in the product; it is
     kept here because this is the number the market asks for by name
     and the section exists to answer that question. */
  /* Set per phase since 18 Oct (Mostafa: "phase 1 x1 phase 2 x2 phase 3 x3"), no longer picked by the brand. */
  "landing.roasT": { en: "1x, 2x, 3x. HeyMoon signs every phase.", ar: "1x و2x و3x. وهاي مون توقّع على كل مرحلة." },
  "landing.roasD": {
    en: "Every phase carries its own guarantee, the same for every brand: $1,000 at 1x, $2,000 at 2x and $3,000 at 3x. Nothing to size, and nothing to negotiate.",
    ar: "لكل مرحلة ضمانها، وهو نفسه لكل علامة تجارية: 1,000$ بمضاعف 1x، و2,000$ بمضاعف 2x، و3,000$ بمضاعف 3x. لا شيء يُحدَّد حجمه، ولا شيء يُفاوَض عليه.",
  },
  "landing.roasLabel": { en: "Guaranteed ROAS", ar: "العائد المضمون" },
  "landing.roasNote": { en: "1x, 2x and 3x, blended", ar: "1x و2x و3x مجتمعة" },
  "landing.roasClimb": { en: "It climbs phase by phase", ar: "ويرتفع مرحلة بعد مرحلة" },

  /* The stores it connects to, after payment: one grant, read and write, because Orbit creates the codes. */
  "landing.storesT": { en: "Connects to the store you already have.", ar: "يرتبط بالمتجر الذي لديك بالفعل." },
  "landing.storesD": {
    en: "One tap, after you pay. It reads the orders that use a creator's code, and nothing else.",
    ar: "نقرة واحدة بعد الدفع. يقرأ الطلبات التي تستخدم كود صانع المحتوى، ولا شيء غير ذلك.",
  },

  /* The close, and the colophon. */
  "landing.closeH2": { en: "Paste your store link.", ar: "ألصق رابط متجرك." },
  "landing.nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "landing.foot.agents": { en: "Agents", ar: "الوكلاء" },

  /* The hero switch to the creators landing. That page is English only,
     so only this side's labels are translated. */
  "landing.for.label": { en: "Who HeyMoon is for", ar: "لمن HeyMoon" },
  "landing.for.brands": { en: "Brands", ar: "العلامات التجارية" },
  "landing.for.creators": { en: "Creators", ar: "صنّاع المحتوى" },


  /* Read */
  "read.title": { en: "What I found", ar: "ما وجدناه" },
  "read.working": { en: "Still reading", ar: "ما زلنا نقرأ" },
  "read.stopped": { en: "Stopped. Everything below is what I had.", ar: "توقفنا. كل ما يظهر أدناه هو ما جمعناه." },
  "read.resume": { en: "Keep reading", ar: "تابع القراءة" },
  "read.evidence": { en: "Evidence", ar: "الدليل" },
  "read.yes": { en: "Yes", ar: "صحيح" },
  "read.fix": { en: "Fix this", ar: "صحّح هذا" },
  "read.add": { en: "Add something", ar: "أضف شيئًا" },
  "read.confirmed": { en: "Confirmed by you", ar: "أكّدته أنت" },
  "read.corrected": { en: "Corrected by you", ar: "صحّحته أنت" },
  "read.save": { en: "Save", ar: "حفظ" },
  "read.cancelEdit": { en: "Cancel", ar: "إلغاء" },
  "read.continue": { en: "Build my campaign", ar: "ابنِ حملتي" },

  /* Layers */
  "layer.identity": { en: "The store", ar: "المتجر" },
  "layer.category": { en: "Category", ar: "الفئة" },
  "layer.priceBand": { en: "Price band", ar: "نطاق السعر" },
  "layer.bestsellers": { en: "Bestsellers", ar: "الأكثر مبيعًا" },
  "layer.voice": { en: "Brand voice", ar: "نبرة العلامة" },
  "layer.socials": { en: "Social", ar: "حسابات التواصل" },
  "layer.markets": { en: "Markets", ar: "الأسواق" },
  "layer.seasonality": { en: "Seasonality", ar: "الموسمية" },
  "layer.eligibility": { en: "Eligibility", ar: "الأهلية" },

  /* Thread */
  "thread.title": { en: "Your campaign", ar: "حملتك" },
  /* The pane heading. Until Phase 1 is paid for the plan is a proposal,
     and the heading says so; after payment it is simply the campaign.
     The caller picks the key with usePaid(). */
  "thread.plan": { en: "Your proposed campaign", ar: "حملتك المقترحة" },
  "thread.planPaid": { en: "Your campaign", ar: "حملتك" },
  /* No creator name here: the placeholder is on screen before Phase 1
     is paid for, and identities are withheld until then. */
  "thread.placeholder": { en: "Change anything about the plan", ar: "غيّر أي شيء في الخطة" },
  "thread.send": { en: "Send", ar: "إرسال" },
  "thread.thinking": { en: "Working", ar: "يعمل الآن" },
  "thread.stop": { en: "Stop", ar: "إيقاف" },
  "thread.because": { en: "because", ar: "لأنك قلت" },
  "thread.openPlan": { en: "Open the plan", ar: "افتح الخطة" },
  "thread.closePlan": { en: "Close", ar: "إغلاق" },

  /* The plan card — it appears inside the thread, which is one of the
     three Arabic surfaces, so its labels mirror too. */
  "plan.phase1": { en: "Phase 1 · Warm-up", ar: "المرحلة ١ · الإحماء" },
  "plan.phase1Proposed": { en: "Proposed · Phase 1 · Warm-up", ar: "مقترح · المرحلة ١ · الإحماء" },
  "plan.guaranteed": { en: "guaranteed", ar: "مضمون" },
  "plan.budget": { en: "Budget", ar: "الميزانية" },
  "plan.target": { en: "Guaranteed sales", ar: "المبيعات المضمونة" },
  /* The three warm-up figures, as one sentence read left to right:
     what you pay, the floor under it, what we actually think happens.
     The first two are the same number on purpose, which is why each
     one carries the line underneath that says why. */
  "plan.youPay": { en: "You pay today", ar: "تدفع اليوم" },
  "plan.youPayNote": { en: "your spend on Phase 1", ar: "إنفاقك على المرحلة ١" },
  "plan.backGuaranteed": { en: "Guaranteed back in sales", ar: "مبيعات مضمونة" },
  "plan.backGuaranteedNote": { en: "written into the phase", ar: "مكتوب في المرحلة" },
  /* Upside reads as a note under the guarantee, never as a second
     figure beside it. Two big numbers are two promises. */
  "plan.markets": { en: "Markets", ar: "الأسواق" },
  "plan.audience": { en: "Audience", ar: "الجمهور" },
  "plan.creators": { en: "Creators", ar: "صنّاع المحتوى" },
  "plan.brief": { en: "Brief", ar: "الموجز" },
  "plan.matched": { en: "matched", ar: "مطابقين" },
  "plan.unlock": { en: "Phase 2 unlocks at", ar: "تُفتح المرحلة ٢ عند" },
  "plan.unlockTail": { en: ", 80% of this phase's target.", ar: "، ٨٠٪ من هدف هذه المرحلة." },
  "aud.all": { en: "All genders", ar: "كل الأجناس" },
  "aud.female": { en: "Women", ar: "نساء" },
  "aud.male": { en: "Men", ar: "رجال" },

  /* Shared */
  "why": { en: "Why this number", ar: "لماذا هذا الرقم" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "lang": { en: "العربية", ar: "English" },

  /* ── After payment (PRD v0.2: steps 6a to 9, H6 "Arabic and English on every screen in this flow") ──
     The conversation's lines, MoonConnect's four cards and the launch tracker. A first pass in the same register as
     the English, for the Arabic copywriter. Store, product and creator names stay as they are. */
  "post.paid": { en: "Paid. Phase 1 is yours.", ar: "تم الدفع. المرحلة الأولى أصبحت لك." },
  "post.welcome": { en: "Welcome back. Phase 1 for {brand} is paid.", ar: "أهلًا بعودتك. المرحلة الأولى لـ {brand} مدفوعة." },
  "post.storeNext": { en: "Next, your store. {host} runs on {platform}.", ar: "الخطوة التالية: متجرك. {host} يعمل على {platform}." },
  "post.storeNextPlain": { en: "Next, your store.", ar: "الخطوة التالية: متجرك." },
  "post.teamToo": { en: "They'll set the code and the test order with you too.", ar: "وسيضبط معك الفريق كود الخصم والطلب التجريبي أيضًا." },
  "post.discount": { en: "Now the code your creators share.", ar: "الآن، الكود الذي سيشاركه صنّاع المحتوى." },
  "post.check": { en: "Last store step: a test order, so every code counts.", ar: "آخر خطوة في المتجر: طلب تجريبي، لنتأكد أن كل كود يُحتسب." },
  "post.briefLead": { en: "Now the brief. ", ar: "الآن، الموجز. " },
  "post.briefPassed": { en: "Passed. Now the brief. ", ar: "نجح الاختبار. الآن، الموجز. " },
  "post.briefMeanwhile": { en: "Meanwhile, the brief. ", ar: "وفي الأثناء، الموجز. " },
  "post.briefTeamCheck": { en: "The Moontech team takes the check from here, and passes it once they've confirmed your orders reach us another way. Meanwhile, the brief. ", ar: "يتولى فريق مون تك الاختبار من هنا، ويعتمده بعد التأكد بطريقة أخرى من وصول طلباتك إلينا. وفي الأثناء، الموجز. " },
  "post.briefDrafted": { en: "MoonWriter drafted it from your store, the plan and this chat.", ar: "كتب MoonWriter مسودته من متجرك والخطة وهذه المحادثة." },
  "post.approved": { en: "Approved. That's everything from you. Moontech matches your creators and launches by {date}.", ar: "تمت الموافقة. هذا كل ما نحتاجه منك. يختار فريق مون تك صنّاع المحتوى ويطلق الحملة قبل {date}." },
  "post.approvedTeam": { en: "Approved. The Moontech team sets up your store with you, then matches your creators and launches. The tracker shows each step.", ar: "تمت الموافقة. يجهّز فريق مون تك متجرك معك، ثم يختار صنّاع المحتوى ويطلق الحملة. يعرض المتتبّع كل خطوة." },
  "post.allDone": { en: "That's everything from you. Moontech takes it from here.", ar: "هذا كل ما نحتاجه منك. فريق مون تك يتولى الباقي." },
  "post.notNowStore": { en: "Fine. Connect it within 14 days, or Phase 1 is refunded.", ar: "لا بأس. اربط متجرك خلال 14 يومًا، وإلا نعيد لك مبلغ المرحلة الأولى." },
  "post.notNow": { en: "Fine. Pick it up here any time.", ar: "لا بأس. أكمل من هنا متى شئت." },
  "post.briefAdded": { en: "Added to the brief.", ar: "أضفته إلى الموجز." },
  "post.above": { en: "It's just above.", ar: "الخطوة أعلاه مباشرة." },
  "post.when": { en: "Launch by {date}: wave 1 goes to your creators, and Phase 1 starts six days later.", ar: "الإطلاق قبل {date}: تصل الدفعة الأولى إلى صنّاع المحتوى، وتبدأ المرحلة الأولى بعد ستة أيام." },
  "post.whenTeam": { en: "The Moontech team sets up your store first. The tracker shows each step as it happens.", ar: "يجهّز فريق مون تك متجرك أولًا. يعرض المتتبّع كل خطوة عند حدوثها." },
  "post.fallbackSetup": { en: "I didn't catch that. Right now it's your setup: the store, the discount, a store check and the brief. Ask about any of them, or say Continue.", ar: "لم أفهم ذلك. الآن نُكمل الإعداد: المتجر والخصم واختبار المتجر والموجز. اسألني عن أيٍّ منها، أو اختر «متابعة»." },
  "post.fallbackWaiting": { en: "I didn't catch that. Your part is done, and Moontech is preparing the launch. The tracker shows each step and its date.", ar: "لم أفهم ذلك. انتهى دورك، وفريق مون تك يجهّز الإطلاق. يعرض المتتبّع كل خطوة وموعدها." },
  "post.briefReplaced": { en: "Updated the brief, and took out “{old}”.", ar: "حدّثت الموجز، وحذفت «{old}»." },
  "post.nextYours": { en: "Your steps, here: connect your store, set the discount, a quick store check, and the brief. Then Moontech matches the creators and launches.", ar: "خطواتك هنا: اربط متجرك، واضبط الخصم، واختبار سريع للمتجر، ثم الموجز. بعدها يختار فريق مون تك صنّاع المحتوى ويطلق الحملة." },
  "post.nextMoontech": { en: "Moontech is matching your creators, then launches: wave 1 goes out, and Phase 1 starts six days later. The tracker on the dashboard shows each stage and its date.", ar: "يختار فريق مون تك صنّاع المحتوى الآن، ثم يطلق الحملة: تُرسل الدفعة الأولى، وتبدأ المرحلة الأولى بعد ستة أيام. متتبّع الإطلاق في لوحة التحكم يعرض كل مرحلة وموعدها." },
  "post.nextLaunched": { en: "Launched: wave 1 is with your creators. Phase 1 starts on {date}, and the first sale switches the dashboard to results.", ar: "تم الإطلاق: الدفعة الأولى لدى صنّاع المحتوى. تبدأ المرحلة الأولى في {date}، وأول عملية بيع تحوّل لوحة التحكم إلى النتائج." },
  "post.nextPhase": { en: "Phase 1 is running. The first sale switches the dashboard to results.", ar: "المرحلة الأولى جارية. أول عملية بيع تحوّل لوحة التحكم إلى النتائج." },
  "post.offline": { en: "You're offline. Reconnecting. Nothing here is lost.", ar: "انقطع الاتصال. نعيد الاتصال الآن، ولن يضيع شيء هنا." },
  "post.online": { en: "Back online.", ar: "عاد الاتصال." },
  "post.placeholder": { en: "Ask me anything about this phase", ar: "اسألني أي شيء عن هذه المرحلة" },
  "chip.Continue": { en: "Continue", ar: "متابعة" },
  "chip.What happens next?": { en: "What happens next?", ar: "ماذا بعد؟" },
  "chip.Go to the dashboard": { en: "Go to the dashboard", ar: "اذهب إلى لوحة التحكم" },

  "receipt.title": { en: "Phase {n} · Paid", ar: "المرحلة {n} · مدفوعة" },
  "receipt.charged": { en: "Charged:", ar: "المبلغ:" },
  "receipt.receipt": { en: "Receipt:", ar: "الإيصال:" },
  "receipt.emailed": { en: "Emailed to you, and kept on this campaign.", ar: "أُرسل إلى بريدك، ومحفوظ في هذه الحملة." },
  "receipt.paid": { en: "Paid", ar: "مدفوعة" },

  "mc.where": { en: "Where does your store run?", ar: "على أي منصة يعمل متجرك؟" },
  "mc.connecting": { en: "Connecting {name}", ar: "جارٍ ربط {name}" },
  "mc.step.open": { en: "Opening connect.moontech.co", ar: "فتح connect.moontech.co" },
  "mc.step.signin": { en: "Signing in on {name}", ar: "تسجيل الدخول في {name}" },
  "mc.step.approve": { en: "Approving access: orders and codes", ar: "الموافقة على الصلاحية: الطلبات والأكواد" },
  "mc.step.back": { en: "Back in this chat", ar: "العودة إلى هذه المحادثة" },
  "mc.connectTitle": { en: "Connect {name}", ar: "اربط {name}" },
  "mc.lock": { en: "You sign in on {name}, never here. One grant: HeyMoon reads orders and creates your creators' codes.", ar: "تسجّل الدخول في {name}، لا هنا. صلاحية واحدة: يقرأ HeyMoon الطلبات وينشئ أكواد صنّاع المحتوى." },
  "mc.lockTeam": { en: "Nothing to enter here.", ar: "لا شيء لتُدخله هنا." },
  "mc.notNow": { en: "Not now", ar: "ليس الآن" },
  "mc.connected": { en: "{name} connected. HeyMoon reads orders and creates the codes.", ar: "تم ربط {name}. يقرأ HeyMoon الطلبات وينشئ الأكواد." },
  "mc.teamDone": { en: "The Moontech team sets it up with you. You'll see each step here.", ar: "يجهّزه فريق مون تك معك. سترى كل خطوة هنا." },
  "mc.codeTitle": { en: "The creators' code", ar: "كود صنّاع المحتوى" },
  "mc.other": { en: "Other", ar: "أخرى" },
  "mc.otherDiscount": { en: "Other discount", ar: "خصم آخر" },
  "mc.siteOffer": { en: "Your site already shows up to {n}% off. Shoppers won't use a smaller code.", ar: "متجرك يعرض حاليًا خصمًا يصل إلى {n}%. لن يستخدم المتسوقون كودًا أقل منه." },
  "mc.enforces": { en: "{name} enforces it", ar: "{name} تطبّقه" },
  "mc.cant": { en: "{name} can't. Creators are told instead.", ar: "{name} لا تطبّقه، لذا نُبلغ صنّاع المحتوى." },
  "mc.cantShort": { en: "{name} can't, so creators are told", ar: "{name} لا تطبّقه، لذا نُبلغ صنّاع المحتوى" },
  "mc.bestOffer": { en: "{n}% is the best offer on my site, counting product codes and Tabby or Tamara offers.", ar: "خصم {n}% هو أفضل عرض في متجري، بما في ذلك أكواد المنتجات وعروض تابي وتمارا." },
  "mc.bestOfferAny": { en: "This code is the best offer on my site, counting product codes and Tabby or Tamara offers.", ar: "هذا الكود هو أفضل عرض في متجري، بما في ذلك أكواد المنتجات وعروض تابي وتمارا." },
  "mc.preview": { en: "Preview", ar: "معاينة" },
  "mc.oneCode": { en: "One code per creator, made when they accept. You confirmed it's the best offer on your site.", ar: "كود لكل صانع محتوى، يُنشأ عند قبوله. وقد أكّدت أنه أفضل عرض في متجرك." },
  "mc.confirm": { en: "Confirm", ar: "تأكيد" },
  "mc.cancel": { en: "Cancel", ar: "إلغاء" },
  "mc.codeDone": { en: "Code: {line}.", ar: "الكود: {line}." },
  "mc.limit.minOrder": { en: "Minimum order", ar: "حد أدنى للطلب" },
  "mc.limit.onePerCustomer": { en: "One use per customer", ar: "استخدام واحد لكل عميل" },
  "mc.limit.excludeSale": { en: "Not on sale items", ar: "لا يشمل المنتجات المخفّضة" },
  "mc.limit.endsWithPhase": { en: "Ends with Phase 1", ar: "ينتهي بانتهاء المرحلة الأولى" },
  "mc.line.off": { en: "{n}% off", ar: "خصم {n}%" },
  "mc.line.min": { en: "min order {n} {cur}", ar: "حد أدنى {n} {cur}" },
  "mc.line.one": { en: "one per customer", ar: "مرة لكل عميل" },
  "mc.line.sale": { en: "not on sale items", ar: "لا يشمل المخفّضات" },
  "mc.line.ends": { en: "ends with Phase 1", ar: "ينتهي مع المرحلة الأولى" },
  "mc.checkTitle": { en: "Store check", ar: "اختبار المتجر" },
  "mc.checkDesc": { en: "A free test order on {name}, so every code counts.", ar: "طلب تجريبي مجاني على {name}، لنتأكد أن كل كود يُحتسب." },
  "mc.checkFailed": { en: "The test order didn't reach us. One more try, then the team takes it.", ar: "لم يصلنا الطلب التجريبي. محاولة أخرى، ثم يتولاه الفريق." },
  "mc.check.code": { en: "Test code {code} made", ar: "تم إنشاء كود الاختبار {code}" },
  "mc.check.order": { en: "Free test order placed", ar: "تم تقديم طلب تجريبي مجاني" },
  "mc.check.wait": { en: "Order arriving, about two minutes", ar: "الطلب في الطريق، نحو دقيقتين" },
  "mc.check.zid": { en: "Cancel the test order on Zid. We'll see it here", ar: "ألغِ الطلب التجريبي في زد، وسنرى ذلك هنا" },
  "mc.check.cancelled": { en: "Order cancelled", ar: "تم إلغاء الطلب" },
  "mc.check.deleted": { en: "Test code deleted", ar: "تم حذف كود الاختبار" },
  "mc.run": { en: "Run the test", ar: "ابدأ الاختبار" },
  "mc.retry": { en: "Try again", ar: "حاول مجددًا" },
  "mc.checkDone": { en: "Store check passed. Every code counts on {name}.", ar: "نجح اختبار المتجر. كل كود يُحتسب على {name}." },
  "mc.checkTeam": { en: "The Moontech team takes the check from here.", ar: "يتولى فريق مون تك الاختبار من هنا." },
  "mc.briefEyebrow": { en: "The brief · drafted by MoonWriter", ar: "الموجز · بقلم MoonWriter" },
  "mc.row.say": { en: "Say", ar: "المطلوب" },
  "mc.row.dont": { en: "Don't", ar: "الممنوع" },
  "mc.row.products": { en: "Products", ar: "المنتجات" },
  "mc.row.markets": { en: "Markets", ar: "الأسواق" },
  "mc.row.languages": { en: "Languages", ar: "اللغات" },
  "mc.row.platforms": { en: "Platforms", ar: "المنصات" },
  "mc.row.files": { en: "Files", ar: "الملفات" },
  "mc.launch": { en: "The new launch: {x}", ar: "الإطلاق الجديد: {x}" },
  "mc.bestsellers": { en: "Your bestsellers", ar: "الأكثر مبيعًا لديك" },
  "mc.languages": { en: "English and Arabic", ar: "العربية والإنجليزية" },
  "mc.briefNote": { en: "Approving sets the direction. Content isn't approved before it goes live, and you can share examples and guidelines. Want a change? Tell me below.", ar: "موافقتك تحدد الاتجاه. لا يُعتمد المحتوى قبل نشره، ويمكنك مشاركة أمثلة وإرشادات. تريد تغييرًا؟ اكتبه لي في الأسفل." },
  "mc.approve": { en: "Approve the brief", ar: "وافق على الموجز" },
  "mc.addFiles": { en: "Add guidelines or UGC", ar: "أضف إرشادات أو محتوى سابقًا" },
  "mc.briefDone": { en: "Brief approved", ar: "تمت الموافقة على الموجز" },
  "mc.briefBy": { en: " by {name}", ar: " من {name}" },
  "mc.briefFiles": { en: ", with {n} file(s)", ar: "، مع {n} ملف" },

  "lt.title": { en: "Launch tracker", ar: "متتبّع الإطلاق" },
  "lt.next.store": { en: "Next: connect your store", ar: "التالي: اربط متجرك" },
  "lt.next.discount": { en: "Next: set the discount", ar: "التالي: اضبط الخصم" },
  "lt.next.check": { en: "Next: the store check", ar: "التالي: اختبار المتجر" },
  "lt.next.brief": { en: "Next: approve the brief", ar: "التالي: وافق على الموجز" },
  "lt.preparing": { en: "Moontech is preparing your launch", ar: "فريق مون تك يجهّز إطلاق حملتك" },
  "lt.launched": { en: "Launched. Wave 1 is with your creators", ar: "تم الإطلاق. الدفعة الأولى لدى صنّاع المحتوى" },
  "lt.phaseOn": { en: "Phase 1 started. Waiting for the first sale", ar: "بدأت المرحلة الأولى. بانتظار أول عملية بيع" },
  "lt.launchBy": { en: "Launch by {date}.", ar: "الإطلاق قبل {date}." },
  "lt.launchedOn": { en: "Launched {date}. Phase 1 starts {phase}.", ar: "تم الإطلاق في {date}. تبدأ المرحلة الأولى في {phase}." },
  "lt.phaseSince": { en: "Phase 1 started {date}.", ar: "بدأت المرحلة الأولى في {date}." },
  "lt.refund": { en: " Connect your store within 14 days, or Phase 1 is refunded.", ar: " اربط متجرك خلال 14 يومًا، وإلا نعيد لك مبلغ المرحلة الأولى." },
  "lt.continue": { en: "Continue in the conversation", ar: "أكمل في المحادثة" },
  "lt.compact": { en: "Launch tracker · launch by {date}", ar: "متتبّع الإطلاق · الإطلاق قبل {date}" },
  "lt.compactLaunched": { en: "Launch tracker · launched {date}", ar: "متتبّع الإطلاق · تم الإطلاق في {date}" },
  "lt.stage.store": { en: "Store connected", ar: "تم ربط المتجر" },
  "lt.stage.discount": { en: "Discount set", ar: "تم ضبط الخصم" },
  "lt.stage.check": { en: "Store checked", ar: "تم اختبار المتجر" },
  "lt.stage.brief": { en: "Brief approved", ar: "تمت الموافقة على الموجز" },
  "lt.stage.matching": { en: "Creators being matched", ar: "اختيار صنّاع المحتوى" },
  "lt.stage.launched": { en: "Launched (wave 1 sent)", ar: "تم الإطلاق (أُرسلت الدفعة الأولى)" },
  "lt.stage.phase": { en: "Phase started (day 6)", ar: "بدأت المرحلة (اليوم السادس)" },
  "lt.stage.sale": { en: "First sale", ar: "أول عملية بيع" },
  "lt.owner.You": { en: "You", ar: "أنت" },
  "lt.owner.Moontech": { en: "Moontech", ar: "مون تك" },
  "lt.owner.Creators": { en: "Creators", ar: "صنّاع المحتوى" },
  "lt.note.matching": { en: "Progress, not names.", ar: "نعرض التقدّم، لا الأسماء." },
  "lt.note.launched": { en: "Each creator gets the kit within a minute of their code existing on your store.", ar: "يصل كل صانع محتوى حزمته خلال دقيقة من إنشاء كوده في متجرك." },
  "lt.note.phase": { en: "Day 6 after the launch.", ar: "اليوم السادس بعد الإطلاق." },
  "lt.note.sale": { en: "Results replace this tracker.", ar: "تحلّ النتائج محل هذا المتتبّع." },
  "lt.done": { en: "Done {date}", ar: "تم {date}" },
  "lt.waiting": { en: "Waiting on you", ar: "بانتظارك" },
  "lt.inProgress": { en: "In progress", ar: "جارٍ" },
  "lt.by": { en: "By {date}", ar: "قبل {date}" },
  "lt.demoNext": { en: "Demo: Moontech's next step", ar: "تجربة: خطوة مون تك التالية" },
  "mc.demoFail": { en: "Demo: the check fails", ar: "تجربة: فشل الاختبار" },
  "lt.demoSale": { en: "Demo: the first sale", ar: "تجربة: أول عملية بيع" },

  "dash.title": { en: "Dashboard", ar: "لوحة التحكم" },
  "dash.campaigns": { en: "Campaigns", ar: "الحملات" },
  "dash.settings": { en: "Settings", ar: "الإعدادات" },
  "dash.menu": { en: "Menu", ar: "القائمة" },
  "dash.signOut": { en: "Sign out", ar: "تسجيل الخروج" },
  "dash.build": { en: "Build a campaign", ar: "أنشئ حملة" },
  "dash.ask": { en: "Ask HeyMoon, or tell it what to do", ar: "اسأل HeyMoon، أو اطلب منه ما تريد" },

};

export function useT() {
  const locale = useLocale();
  const t = (k: string) => STR[k]?.[locale] ?? k;
  /** A string with {placeholders} filled in: names, dates and amounts stay as they are. */
  const tf = (k: string, vars: Record<string, string | number>) => fill(t(k), vars);
  return { t, tf, locale, dir: (locale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr", isAr: locale === "ar" };
}

export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

/** "3 Nov", or "3 نوفمبر" with Western digits (see `num`). */
export const dayIn = (t: number, locale: Locale) =>
  new Date(t).toLocaleDateString(locale === "ar" ? "ar-u-nu-latn" : "en-GB", { day: "numeric", month: "short" });

/** The six Gulf markets, in Arabic. Anything else keeps its English name. */
export const MARKET_AR: Record<string, string> = {
  AE: "الإمارات", SA: "السعودية", KW: "الكويت", QA: "قطر", BH: "البحرين", OM: "عُمان",
};

/** Platform names as a brand in the Gulf says them. */
export const PLATFORM_AR: Record<string, string> = {
  salla: "سلة", zid: "زد", shopify: "Shopify", magento: "Adobe Commerce", custom: "منصة أخرى",
};

/** Arabic-Indic digits look wrong beside Latin currency codes and
    handles, so numbers stay Western throughout. Only the direction and
    the words change. */
export const num = (n: number) => n.toLocaleString("en-US");
