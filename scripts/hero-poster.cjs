/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS tooling */
/* The hero posters (HERO-V2 §8.3, plan item 6 "no flat star, ever"): frames of the real WebGL glass at its
   resting pose (REST in sky/eclipse-api.ts), captured by the renderer's own capture mode, so the poster the
   page paints first is exactly the frame WebGL draws first and holds while the poster fades.

   Usage
     node scripts/hero-poster.cjs                  render, encode and write all 8 posters, then poster.json
     node scripts/hero-poster.cjs --check          write nothing; compare live frames with the committed files
     node scripts/hero-poster.cjs [--check] [--only brands|creators] [--band phone|desktop]
   A filtered run writes only its own files and never poster.json (the manifest always describes a full run).

   Requirements
     - python3 with Pillow built with AVIF and WebP (checked with PIL.features; the script exits if either is missing)
     - Playwright's Chromium: playwright-core from $PLAYWRIGHT_CORE, else require.resolve("playwright-core"), else
       the npx cache path below. It runs headless with SwiftShader WebGL (--use-angle=swiftshader
       --enable-unsafe-swiftshader --ignore-gpu-blocklist). No dev server: sky/eclipse-api.ts and sky/eclipse.ts are
       transpiled with the repo's typescript and served with a small harness page through request routing on a
       fake origin. SwiftShader is slow: a 2240 px frame can take a minute.

   What it does, per audience and band (POSTER.stage: phone 240, desktop 560 CSS px)
     A canvas of POSTER_BOX x S CSS px on NIGHT1, with the S x S stage centred in it; mountEclipse(canvas, stage,
     { audience, tier: POSTER_TIER[band], capture: { dpr: POSTER.dpr, onFrame } }) draws one REST frame and reads
     it back (on brands after the creator rings' atlas has loaded from public/hero/creators, so onFrame is awaited).
     The page applies the feather (alpha x 1 - smoothstep(POSTER_FEATHER[0] S, POSTER_FEATHER[1] S, r)) and returns
     a lossless PNG. Pillow encodes it at the highest quality whose file fits its cap (eclipse-api.ts POSTER_CAPS),
     found by bisection: AVIF 4:4:4 at speed 0 (quality 35 to 80; 4:2:0 smears the thin dispersion fringes, and at
     the same bytes 4:4:4 halves the error: measured on the brands phone frame, mean dE 0.96 against 1.51), WebP at
     method 6 with alpha quality 30 (quality 55 to 95; the alpha is only the feather ring). Over the cap at the
     floor: exit 1.

   Outputs (public/hero/)
     poster-<audience>-<width>.<avif|webp>  width 960 (phone) and 2240 (desktop): posterSrc() in eclipse-api.ts
     poster.json, written last: { rendererHash, box, feather, dpr, stage, files: [{ path, width, bytes, sha1 }] },
       rendererHash = sha1 of sky/eclipse.ts + sky/eclipse-api.ts. Stable key order, no timestamps.

   --check (HERO-V2 A-F1, A-F2), exit 1 on any failure
     1. poster.json's rendererHash equals the current sources.
     2. Live frames at DPR 1, 1.5 and 2 against the committed AVIF and WebP (decoded by Chromium, drawn on NIGHT1 at
        the live frame's size): inside 0.98 S mean dE76 <= 1.5, p99 <= 6, |mean L* difference| <= 0.5, the bright
        centroid within 0.5 CSS px; outside 0.98 S every live pixel is NIGHT1 +-1. The bright centroid is taken on
        L* low-passed by a 16 CSS px box on both images (the L* > 60 pixels, each weighted by L* - 60): it measures
        where the light is, not how a 1x point-sampled frame and a resampled 2x file render thin lines. Raw, a
        lossless poster already misses by 2.3 px (phone) and 4.6 px (desktop) at DPR 1; low-passed (the box is
        shift-equivariant) it is within 0.13 px, and a deliberate 1 CSS px shift of the poster reads 0.91 to 0.99 px.
     3. The held frame (normal mode, no capture, the band's POSTER_TIER): every draw is read back in its own task
        (readPixels hash and bright centroid). From onReady to +1, +2 and +10 rAF the renderer draws nothing or only
        frame 0's exact pixels, and the hold is still on (well inside RELEASE_FALLBACK_MS); after release() every
        frame in the first 300 ms of the released clock keeps the bright centroid within 1 CSS px of frame 0. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const vm = require("vm");
const { spawnSync } = require("child_process");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const SKY = path.join(ROOT, "app/(site)/_site/sky");
const API_TS = path.join(SKY, "eclipse-api.ts");
const REN_TS = path.join(SKY, "eclipse.ts");
const PUBLIC = path.join(ROOT, "public");
const ORIGIN = "http://poster.test";
const FLAGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const NPX_PW = "/Users/mostafaaelnagar/.npm/_npx/f0a362733743bae2/node_modules/playwright-core";
const KB = 1024;
const ENC = { avif: { q0: 80, floor: 35 }, webp: { q0: 95, floor: 55 } };
const LOWPASS_CSS_PX = 16;
const LIMIT = { meanDE: 1.5, p99: 6, dL: 0.5, centroid: 0.5, outside: 1, heldMove: 1 };
/* p99 is 6 on every row (HERO-V2 A-F1). The integration's 6.5 for the phone file below DPR 2 was the integrator's
   ruling, not the lead's; the wave-2 fixes restored 6 and raised POSTER_CAPS[960] instead. */

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true; };
const CHECK = !!arg("check");
const ONLY = arg("only"), BAND = arg("band");
if (ONLY && !["brands", "creators"].includes(ONLY)) die("--only takes brands or creators");
if (BAND && !["phone", "desktop"].includes(BAND)) die("--band takes phone or desktop");
const FULL = !ONLY && !BAND;

function die(msg) { console.error(`hero-poster: ${msg}`); process.exit(1); }
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");
const rendererHash = () => sha1(Buffer.concat([fs.readFileSync(REN_TS), fs.readFileSync(API_TS)]));

/* ── Sources: transpile, rewrite the one allowed import, refuse any other ── */
function transpile(file, allowed) {
  const out = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, verbatimModuleSyntax: false },
  }).outputText.replace(/(from\s*)(["'])\.\/eclipse-api\2/g, '$1"./eclipse-api.js"');
  const specs = ts.preProcessFile(out, true, true).importedFiles.map((f) => f.fileName);
  const bad = specs.filter((s) => !allowed.includes(s));
  if (bad.length) die(`${path.relative(ROOT, file)} imports ${bad.join(", ")} after transpiling (only ${allowed.join(", ") || "nothing"} is allowed)`);
  return out;
}
const API_JS = transpile(API_TS, []);
const REN_JS = transpile(REN_TS, ["./eclipse-api.js"]);
/* The contract's values, for Node: the same transpiled source as CommonJS. */
const api = (() => {
  const cjs = ts.transpileModule(fs.readFileSync(API_TS, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(cjs, { module: mod, exports: mod.exports, require: () => ({}) });
  return mod.exports;
})();
const { POSTER, POSTER_BOX, POSTER_FEATHER, POSTER_TIER, posterWidth, posterSrc } = api;
/* The byte caps, by file width (eclipse-api.ts POSTER_CAPS, wave 2). */
const CAPS = api.POSTER_CAPS;
const KB_ = (n) => `${(n / KB).toFixed(1)} kB`;
const AUDIENCES = ["brands", "creators"].filter((a) => !ONLY || a === ONLY);
const BANDS = ["phone", "desktop"].filter((b) => !BAND || b === BAND);

/* ── The harness page (served on a fake origin) ── */
const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:rgb(${api.NIGHT1.join(",")})}</style></head>
<body><script type="module" src="/harness.js"></script></body></html>`;
const HARNESS = `import { mountEclipse } from "./eclipse.js";
import { NIGHT1, POSTER_FEATHER } from "./eclipse-api.js";
const LOWPASS = ${LOWPASS_CSS_PX};
let last = null, handle = null;
function box(S) {
  handle?.destroy(); handle = null;
  document.body.replaceChildren();
  const b = document.createElement("div"), canvas = document.createElement("canvas"), stage = document.createElement("div");
  b.id = "box";
  b.style.cssText = "position:absolute;left:0;top:0;width:" + 2 * S + "px;height:" + 2 * S + "px";
  canvas.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block";
  stage.style.cssText = "position:absolute;left:" + S / 2 + "px;top:" + S / 2 + "px;width:" + S + "px;height:" + S + "px";
  b.append(canvas, stage); document.body.append(b);
  return { canvas, stage };
}
/* One REST frame in capture mode (asynchronous on brands: the rings' atlas); kept for the PNG and the comparisons. */
window.__frame = (audience, S, dpr, tier) => new Promise((res, rej) => {
  const { canvas, stage } = box(S);
  const t0 = performance.now();
  const h = mountEclipse(canvas, stage, { audience, tier, onFail: (r) => rej(new Error("the renderer failed: " + r)), capture: { dpr, onFrame: (f) => {
    last = f;
    res({ width: f.width, height: f.height, dpr: f.dpr, stage: f.stage, ms: Math.round(performance.now() - t0) });
  } } });
  if (!h) rej(new Error("no WebGL context"));
  handle = h;
});
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* The feathered PNG of the last frame. */
window.__png = () => {
  const { width: W, height: H, rgba, dpr, stage: S } = last;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const id = new ImageData(new Uint8ClampedArray(rgba), W, H), d = id.data;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const r = Math.hypot(i + 0.5 - W / 2, y + 0.5 - H / 2) / dpr;
    d[(y * W + i) * 4 + 3] = Math.round(255 * (1 - sm(POSTER_FEATHER[0] * S, POSTER_FEATHER[1] * S, r)));
  }
  x.putImageData(id, 0, 0);
  return c.toDataURL("image/png");
};
const LUT = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
const fl = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
function lab(d, i, o) {
  const R = LUT[d[i]], G = LUT[d[i + 1]], B = LUT[d[i + 2]];
  const fx = fl((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047);
  const fy = fl(0.2126729 * R + 0.7151522 * G + 0.072175 * B);
  const fz = fl((0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883);
  o[0] = 116 * fy - 16; o[1] = 500 * (fx - fy); o[2] = 200 * (fy - fz);
}
/* Outside 0.98 S the live frame must be NIGHT1 +-1. */
window.__outside = () => {
  const { width: W, height: H, rgba: d, dpr, stage: S } = last;
  let bad = 0, worst = 0;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    if (Math.hypot(i + 0.5 - W / 2, y + 0.5 - H / 2) / dpr < POSTER_FEATHER[0] * S) continue;
    const k = (y * W + i) * 4;
    const e = Math.max(Math.abs(d[k] - NIGHT1[0]), Math.abs(d[k + 1] - NIGHT1[1]), Math.abs(d[k + 2] - NIGHT1[2]));
    if (e > 1) bad++;
    if (e > worst) worst = e;
  }
  return { bad, worst };
};
/* L* of an RGBA buffer, optionally low-passed by a separable box of radius r px. */
function lstar(d, W, H, r) {
  const o = [0, 0, 0], L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { lab(d, i * 4, o); L[i] = o[0]; }
  if (!r) return L;
  const t = new Float32Array(W * H);
  for (let y = 0; y < H; y++) { let s = 0, n = 0; for (let i = -r; i < W + r; i++) { if (i + r < W) { s += L[y * W + i + r]; n++; } if (i - r - 1 >= 0) { s -= L[y * W + i - r - 1]; n--; } if (i >= 0 && i < W) t[y * W + i] = s / n; } }
  for (let i = 0; i < W; i++) { let s = 0, n = 0; for (let y = -r; y < H + r; y++) { if (y + r < H) { s += t[(y + r) * W + i]; n++; } if (y - r - 1 >= 0) { s -= t[(y - r - 1) * W + i]; n--; } if (y >= 0 && y < H) L[y * W + i] = s / n; } }
  return L;
}
/* The bright centroid inside 0.98 S: the L* > 60 pixels, each weighted by L* - 60 (r: the low-pass, device px). */
function centroid(d, W, H, dpr, S, r = 0) {
  const L = lstar(d, W, H, r);
  let n = 0, sw = 0, sx = 0, sy = 0;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    if (Math.hypot(i + 0.5 - W / 2, y + 0.5 - H / 2) / dpr >= POSTER_FEATHER[0] * S) continue;
    const l = L[y * W + i];
    if (l > 60) { const w = l - 60; n++; sw += w; sx += w * (i + 0.5); sy += w * (y + 0.5); }
  }
  return n ? { x: sx / sw, y: sy / sw, n } : { x: NaN, y: NaN, n: 0 };
}
/* The committed poster at src, decoded and drawn on NIGHT1 at the live frame's size, against the live frame. */
window.__compare = async (src) => {
  const { width: W, height: H, rgba: live, dpr, stage: S } = last;
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.fillStyle = "rgb(" + NIGHT1.join(",") + ")"; x.fillRect(0, 0, W, H);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  x.drawImage(img, 0, 0, W, H);
  const p = x.getImageData(0, 0, W, H).data;
  const a = [0, 0, 0], b = [0, 0, 0], hist = new Uint32Array(2001);
  let n = 0, sum = 0, la = 0, lb = 0;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    if (Math.hypot(i + 0.5 - W / 2, y + 0.5 - H / 2) / dpr >= POSTER_FEATHER[0] * S) continue;
    const k = (y * W + i) * 4;
    lab(live, k, a); lab(p, k, b);
    const e = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    n++; sum += e; la += a[0]; lb += b[0];
    hist[Math.min(2000, Math.round(e * 20))]++;
  }
  let acc = 0, p99 = 0;
  for (let j = 0; j <= 2000; j++) { acc += hist[j]; if (acc >= 0.99 * n) { p99 = j / 20; break; } }
  const r = Math.round(LOWPASS * dpr), cl = centroid(live, W, H, dpr, S, r), cp = centroid(p, W, H, dpr, S, r);
  const cd = cl.n === 0 && cp.n === 0 ? 0 : Math.hypot(cl.x - cp.x, cl.y - cp.y) / dpr;
  return { meanDE: sum / n, p99, dL: Math.abs(la - lb) / n, centroid: cd, bright: [cl.n, cp.n], natural: img.naturalWidth };
};
/* Normal mode (no capture), for the held-frame check. Every draw is read back in its own task (the drawing buffer
   is not preserved): its pixel hash and bright centroid, and the released clock mirrored as the renderer keeps it
   (the sum of min(50 ms, frame delta) since release()). */
let readyAt = 0, rec = null, relAt = 0;
for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
  if (!C) continue;
  const da = C.prototype.drawArrays;
  C.prototype.drawArrays = function () {
    const r = da.apply(this, arguments);
    if (rec) {
      const W = this.drawingBufferWidth, H = this.drawingBufferHeight, px = new Uint8Array(W * H * 4);
      this.readPixels(0, 0, W, H, this.RGBA, this.UNSIGNED_BYTE, px);
      let h = 2166136261;
      for (let i = 0; i < px.length; i += 7) h = Math.imul(h ^ px[i], 16777619);
      const t = performance.now(), prev = rec.draws.length ? rec.draws[rec.draws.length - 1].t : t;
      if (relAt && t >= relAt) rec.rel += Math.min(0.05, Math.max(0, (t - Math.max(prev, relAt)) / 1000));
      const c = centroid(px, W, H, 1, rec.S);
      rec.draws.push({ t, hash: h >>> 0, x: c.x, y: H - c.y, n: c.n, rel: rec.rel, released: !!relAt });
    }
    return r;
  };
}
window.__mount = (audience, S, tier) => new Promise((res, rej) => {
  const { canvas, stage } = box(S);
  rec = { S, draws: [], rel: 0 }; relAt = 0;
  handle = mountEclipse(canvas, stage, { audience, tier, onReady: () => { readyAt = performance.now(); res(true); }, onFail: (r) => rej(new Error("onFail " + r)) });
  if (!handle) rej(new Error("no WebGL context"));
});
window.__sinceReady = () => performance.now() - readyAt;
window.__draws = () => rec.draws.length;
window.__raf = (n) => new Promise((res) => { const f = () => (--n <= 0 ? res(true) : requestAnimationFrame(f)); requestAnimationFrame(f); });
window.__release = () => { relAt = performance.now(); handle.release(); };
/* Runs until the mirrored released clock passes s seconds (or 60 draws), then reports. */
window.__after = (s) => new Promise((res) => {
  const f = () => (rec.rel >= s || rec.draws.length > 60 ? res(rec.draws.map(({ t, hash, x, y, n, rel, released }) => ({ t, hash, x, y, n, rel, released }))) : requestAnimationFrame(f));
  requestAnimationFrame(f);
});
window.__ok = true;`;

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_CORE, "playwright-core", NPX_PW].filter(Boolean);
  for (const t of tries) {
    try { return require(t === "playwright-core" ? require.resolve("playwright-core") : t); } catch { /* next */ }
  }
  die(`playwright-core not found (tried ${tries.join(", ")}); set PLAYWRIGHT_CORE to its directory`);
}

async function openPage(browser, side) {
  const ctx = await browser.newContext({ viewport: { width: side, height: side }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  const TYPES = { ".avif": "image/avif", ".webp": "image/webp", ".png": "image/png", ".json": "application/json" };
  await page.route(`${ORIGIN}/**`, (route) => {
    const p = new URL(route.request().url()).pathname;
    const js = (body) => route.fulfill({ status: 200, contentType: "text/javascript", body });
    if (p === "/" || p === "/index.html") return route.fulfill({ status: 200, contentType: "text/html", body: HTML });
    if (p === "/harness.js") return js(HARNESS);
    if (p === "/eclipse.js") return js(REN_JS);
    if (p === "/eclipse-api.js") return js(API_JS);
    if (p.startsWith("/hero/")) {
      const f = path.join(PUBLIC, p);
      if (f.startsWith(path.join(PUBLIC, "hero")) && fs.existsSync(f)) {
        return route.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
      }
    }
    return route.fulfill({ status: 404, body: "" });
  });
  /* ?sky=gl: the renderer refuses software GL outside debug (wave-2 fixes), and --check's held-frame step mounts it
     in normal mode on SwiftShader. */
  await page.goto(`${ORIGIN}/?sky=gl`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.__ok === true, null, { timeout: 60000 });
  return { ctx, page, errors };
}

function encode(jobs) {
  const py = `
import io, json, sys
from PIL import Image, features
missing = [f for f in ("avif", "webp") if not features.check(f)]
if missing:
    print(json.dumps({"error": "Pillow lacks " + " and ".join(missing) + " support"})); sys.exit(0)
out = []
for job in json.load(sys.stdin):
    im = Image.open(job["png"]); im.load()
    if im.mode != "RGBA": im = im.convert("RGBA")
    def enc(fmt, q):
        b = io.BytesIO()
        if fmt == "avif": im.save(b, "AVIF", quality=q, speed=0, subsampling="4:4:4")
        else: im.save(b, "WEBP", quality=q, method=6, alpha_quality=30)
        return b
    for fmt in ("avif", "webp"):
        e = job["enc"][fmt]; lo, hi, best = e["floor"], e["q0"], None
        while lo <= hi:  # the highest quality whose file fits the cap (bytes grow with quality)
            q = (lo + hi) // 2; b = enc(fmt, q)
            if b.tell() <= e["cap"]: best = (q, b); lo = q + 1
            else: hi = q - 1
        if best is None: best = (e["floor"], enc(fmt, e["floor"]))
        q, b = best; n = b.tell(); ok = n <= e["cap"]
        dest = job["dest"] + "." + fmt
        if ok:
            with open(dest, "wb") as f: f.write(b.getvalue())
        out.append({"dest": dest, "format": fmt, "quality": q, "bytes": n, "cap": e["cap"], "ok": ok})
print(json.dumps(out))
`;
  const r = spawnSync("python3", ["-c", py], { input: JSON.stringify(jobs), encoding: "utf8", maxBuffer: 1 << 24 });
  if (r.error) die(`python3: ${r.error.message}`);
  if (r.status !== 0) die(`python3 failed:\n${r.stderr}`);
  const res = JSON.parse(r.stdout);
  if (res.error) die(`${res.error}: install Pillow with libavif and libwebp (python3 -m pip install -U pillow)`);
  return res;
}

function checkPython() {
  const r = spawnSync("python3", ["-c", "import json; from PIL import features; print(json.dumps([features.check('avif'), features.check('webp')]))"], { encoding: "utf8" });
  if (r.status !== 0) die("python3 with Pillow is required (python3 -m pip install -U pillow)");
  const [avif, webp] = JSON.parse(r.stdout);
  if (!avif || !webp) die(`Pillow lacks ${[!avif && "AVIF", !webp && "WebP"].filter(Boolean).join(" and ")} support`);
}

const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : String(x));
const pad = (s, n) => String(s).padEnd(n);

async function generate(browser) {
  checkPython();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hero-poster-"));
  const jobs = [];
  for (const band of BANDS) {
    const S = POSTER.stage[band], side = POSTER_BOX * S;
    const { ctx, page, errors } = await openPage(browser, side);
    for (const a of AUDIENCES) {
      const info = await page.evaluate(([aud, s, dpr, tier]) => window.__frame(aud, s, dpr, tier), [a, S, POSTER.dpr, POSTER_TIER[band]]);
      const w = posterWidth(band);
      if (info.width !== w || info.height !== w) die(`${a} ${band}: frame ${info.width}x${info.height}, expected ${w}x${w}`);
      if (info.stage !== S) die(`${a} ${band}: stage ${info.stage} CSS px, expected ${S}`);
      const outside = await page.evaluate(() => window.__outside());
      if (outside.bad) die(`${a} ${band}: ${outside.bad} pixels beyond ${POSTER_FEATHER[0]} S are not NIGHT1 +-1 (worst ${outside.worst})`);
      const url = await page.evaluate(() => window.__png());
      const png = path.join(tmp, `poster-${a}-${w}.png`);
      fs.writeFileSync(png, Buffer.from(url.slice(url.indexOf(",") + 1), "base64"));
      console.log(`rendered ${a} ${band} (tier ${POSTER_TIER[band]}): ${w}x${w} in ${(info.ms / 1000).toFixed(1)} s`);
      const dest = path.join(PUBLIC, posterSrc(a, band, "avif")).replace(/\.avif$/, "");
      jobs.push({ png, dest, enc: { avif: { ...ENC.avif, cap: CAPS[w].avif }, webp: { ...ENC.webp, cap: CAPS[w].webp } } });
    }
    if (errors.length) die(`page errors:\n${errors.join("\n")}`);
    await ctx.close();
  }
  fs.mkdirSync(path.join(PUBLIC, "hero"), { recursive: true });
  const res = encode(jobs);
  console.log(`\n${pad("file", 34)}${pad("quality", 9)}${pad("bytes", 18)}cap`);
  for (const r of res) console.log(`${pad(path.relative(PUBLIC, r.dest), 34)}${pad(r.quality, 9)}${pad(`${r.bytes} (${KB_(r.bytes)})`, 18)}${KB_(r.cap)}${r.ok ? "" : "  OVER"}`);
  if (res.some((r) => !r.ok)) die(`a poster is over its byte cap at the quality floor (the PNGs are kept in ${tmp})`);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (!FULL) { console.log("\nfiltered run: poster.json not written (run without --only/--band to write it)"); return; }
  const files = [];
  for (const a of ["brands", "creators"]) for (const band of ["phone", "desktop"]) for (const f of POSTER.formats) {
    const p = posterSrc(a, band, f), buf = fs.readFileSync(path.join(PUBLIC, p));
    files.push({ path: p, width: posterWidth(band), bytes: buf.length, sha1: sha1(buf) });
  }
  const manifest = { rendererHash: rendererHash(), box: POSTER_BOX, feather: [...POSTER_FEATHER], dpr: POSTER.dpr, stage: { ...POSTER.stage }, files };
  fs.writeFileSync(path.join(PUBLIC, POSTER.manifest), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nwrote ${POSTER.manifest} (rendererHash ${manifest.rendererHash})`);
}

async function check(browser) {
  let failed = false;
  const fail = (m) => { failed = true; console.log(`FAIL ${m}`); };
  /* 1. the manifest describes the current renderer */
  const mf = path.join(PUBLIC, POSTER.manifest);
  if (!fs.existsSync(mf)) fail(`${POSTER.manifest} is missing`);
  else {
    const m = JSON.parse(fs.readFileSync(mf, "utf8")), h = rendererHash();
    if (m.rendererHash !== h) fail(`rendererHash ${m.rendererHash} != current sources ${h}: re-run node scripts/hero-poster.cjs`);
    else console.log(`rendererHash ok (${h})`);
    for (const f of m.files || []) {
      const p = path.join(PUBLIC, f.path);
      if (!fs.existsSync(p)) fail(`${f.path} is missing`);
      else if (sha1(fs.readFileSync(p)) !== f.sha1) fail(`${f.path} differs from poster.json`);
    }
  }
  /* 2. parity at DPR 1, 1.5 and 2 */
  console.log(`\n${pad("audience", 10)}${pad("band", 9)}${pad("dpr", 5)}${pad("format", 7)}${pad("meanDE", 8)}${pad("p99", 7)}${pad("dL*", 7)}${pad("centroid", 10)}${pad("outside", 9)}result`);
  for (const band of BANDS) {
    const S = POSTER.stage[band], side = POSTER_BOX * S;
    const { ctx, page, errors } = await openPage(browser, side);
    for (const a of AUDIENCES) for (const dpr of [1, 1.5, 2]) {
      await page.evaluate(([aud, s, d, tier]) => window.__frame(aud, s, d, tier), [a, S, dpr, POSTER_TIER[band]]);
      const out = await page.evaluate(() => window.__outside());
      for (const f of POSTER.formats) {
        const src = posterSrc(a, band, f);
        if (!fs.existsSync(path.join(PUBLIC, src))) { fail(`${src} is missing`); continue; }
        const r = await page.evaluate((u) => window.__compare(u), src);
        const ok = r.meanDE <= LIMIT.meanDE && r.p99 <= LIMIT.p99 && r.dL <= LIMIT.dL && r.centroid <= LIMIT.centroid && out.bad === 0;
        console.log(`${pad(a, 10)}${pad(band, 9)}${pad(dpr, 5)}${pad(f, 7)}${pad(fmt(r.meanDE), 8)}${pad(fmt(r.p99), 7)}${pad(fmt(r.dL), 7)}${pad(fmt(r.centroid, 3), 10)}${pad(out.bad ? `${out.bad} bad` : `max ${out.worst}`, 9)}${ok ? "ok" : "FAIL"}`);
        if (!ok) fail(`${a} ${band} dpr ${dpr} ${f}`);
      }
    }
    if (errors.length) fail(`page errors:\n${errors.join("\n")}`);
    await ctx.close();
  }
  /* 3. the held frame, then the release */
  console.log(`\n${pad("audience", 10)}${pad("band", 9)}${pad("tier", 6)}${pad("held draws", 12)}${pad("+1/+2/+10 rAF", 15)}${pad("held ms", 9)}${pad("released", 10)}${pad("frames", 8)}${pad("max move", 10)}result`);
  for (const band of BANDS) {
    const S = POSTER.stage[band], side = POSTER_BOX * S;
    const { ctx, page, errors } = await openPage(browser, side);
    for (const a of AUDIENCES) {
      await page.evaluate(([aud, s, tier]) => window.__mount(aud, s, tier), [a, S, POSTER_TIER[band]]);
      const counts = [];
      for (const n of [1, 1, 8]) { await page.evaluate((k) => window.__raf(k), n); counts.push(await page.evaluate(() => window.__draws())); }
      const heldMs = await page.evaluate(() => window.__sinceReady());
      await page.evaluate(() => window.__release());
      const draws = await page.evaluate(() => window.__after(0.3));
      const f0 = draws[0], held = draws.filter((d) => !d.released), after = draws.filter((d) => d.released && d.rel <= 0.3);
      const same = held.every((d) => d.hash === f0.hash);
      const move = Math.max(0, ...after.map((d) => (d.n && f0.n ? Math.hypot(d.x - f0.x, d.y - f0.y) : 0)));
      const rel = after.length ? after[after.length - 1].rel : 0;
      const inconclusive = heldMs >= api.RELEASE_FALLBACK_MS;
      const ok = same && !inconclusive && move <= LIMIT.heldMove && after.length > 0;
      console.log(`${pad(a, 10)}${pad(band, 9)}${pad(POSTER_TIER[band], 6)}${pad(`${held.length - 1} ${same ? "same" : "DIFF"}`, 12)}${pad(counts.map((c) => c - 1).join("/"), 15)}${pad(Math.round(heldMs), 9)}${pad(`${(rel * 1000).toFixed(0)} ms`, 10)}${pad(after.length, 8)}${pad(`${fmt(move, 3)} px`, 10)}${ok ? "ok" : inconclusive ? "INCONCLUSIVE (fallback release came first)" : "FAIL"}`);
      if (!ok) fail(`held frame ${a} ${band}`);
    }
    if (errors.length) fail(`page errors:\n${errors.join("\n")}`);
    await ctx.close();
  }
  console.log(failed ? "\nhero-poster --check: FAILED" : "\nhero-poster --check: ok");
  return !failed;
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: FLAGS });
  let ok = true;
  try {
    if (CHECK) ok = await check(browser);
    else await generate(browser);
  } finally {
    await browser.close();
  }
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
