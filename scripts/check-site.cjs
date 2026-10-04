/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS tooling */
/* npm run check:site (SPEC §7.2 step 4). Curls /brands and /creators from the running dev server,
   keeps the raw HTML, and builds the visible text by stripping <script>/<style> blocks and tags.
   It fails on the explicit patterns below and on nothing else: the §6.5 lists are tested only through
   these patterns, because "live", "reach", "views" and "rate" appear in approved copy.
   SITE_URL overrides the origin (default http://localhost:3004). */
const { people } = require("./jiti-loader.cjs");

const ORIGIN = (process.env.SITE_URL || "http://localhost:3004").replace(/\/$/, "");
const ROUTES = ["/brands", "/creators"];
const BANNED_WORDS = ["seamless", "leverage", "unlock", "journey", "empower", "robust", "simply", "just"];

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", mdash: "—", ndash: "–", times: "×" };
function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
function visibleText(html) {
  return decode(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const around = (text, i, n = 40) => text.slice(Math.max(0, i - n), i + n).replace(/\s+/g, " ");

async function main() {
  const { handles, names } = people();
  const failures = [];
  const fail = (route, rule, text, index) =>
    failures.push(`${route}: ${rule}${index === undefined ? "" : ` near "${around(text, index)}"`}`);
  const test = (route, rule, re, text) => {
    const m = re.exec(text);
    if (m) fail(route, rule, text, m.index);
  };

  for (const route of ROUTES) {
    let res;
    try {
      res = await fetch(`${ORIGIN}${route}`, { redirect: "manual" });
    } catch (e) {
      failures.push(`${route}: cannot reach ${ORIGIN} (${e.message}). Is the dev server running?`);
      continue;
    }
    if (res.status !== 200) { failures.push(`${route}: status ${res.status}`); continue; }
    const html = await res.text();
    const text = visibleText(html);

    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) failures.push(`${route}: ${h1s} <h1> elements (expected exactly one)`);

    test(route, "time badge or timestamp", /\b(real time|just now|\d+\s*(min|mins|minutes?|hours?|days?)\s+ago)\b/i, text);
    test(route, "badge word as an element's whole text", />\s*(live|live now|real time)\s*</i, html);
    test(route, "webinar, recording or ©", /webinar|on-demand recording|©/i, text);
    if (route === "/creators") {
      test(route, "creator-size or rate word", /\b(followers?|CPM|per view|rate card)\b/i, text);
      test(route, "a dollar amount on creators", /\$\s?\d/, text);
    }
    test(route, "real retailer (ounass)", /\bounass\b/i, html);
    test(route, "real retailer (freshgrocer)", /freshgrocer/i, html);
    test(route, "real retailer (luna beauty)", /\bluna beauty\b/i, html);
    for (const h of handles) test(route, `real handle "${h}"`, new RegExp(`(^|[^a-z0-9._])${esc(h)}(?![a-z0-9_])`, "i"), html);
    for (const n of names) test(route, `real name "${n}"`, new RegExp(`\\b${esc(n)}\\b`, "i"), html);
    test(route, "em or en dash", /[—–]/, text);
    test(route, "exclamation mark", /!/, text);
    test(route, "multiplication sign", /×/, text);
    test(route, "banned word", new RegExp(`\\b(${BANNED_WORDS.join("|")})\\b`, "i"), text);

    console.log(`${route}: 200 · ${h1s} h1 · ${(html.length / 1024).toFixed(1)} kB HTML · ${text.split(" ").length} visible words`);
  }

  if (failures.length) {
    console.error(`check:site FAILED (${failures.length})`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(`check:site ok · ${ROUTES.join(", ")} · ${handles.length} handles and ${names.length} names checked`);
}

main().catch((e) => { console.error(`check-site: ${e.message}`); process.exit(1); });
