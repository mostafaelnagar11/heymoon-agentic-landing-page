/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS tooling */
/* npm run measure (SPEC §7.3). A production build into its OWN distDir (.next-measure), so it never
   corrupts the running dev server's .next, behind a lockfile so two measures never overlap.

   1. Take the lock (.next-measure.lock), polling while it is held.
   2. node scripts/bind-demo.cjs --check.
   3. NEXT_DIST_DIR=.next-measure next build.
   4. First load per route = build-manifest rootMainFiles ∪ app-build-manifest /(site)/layout ∪ the
      route's /(site)/<route>/page. Every chunk is gzipped (level 9, as Next reports). rootMainFiles are
      the framework. Every other chunk is split into its webpack modules (the map measure-modules.cjs
      writes during the build, plus an acorn parse of the minified chunk), and each module's share of
      the chunk's gzip bytes goes to its package: motion, motion-dom, motion-utils, framer-motion and
      lenis to "motion+lenis", next/react to the framework, everything else to the site. So a library
      module counts against its budget whichever chunk webpack puts it in (no "mixed" chunks).
   5. Fail on a §7.1 budget, a first-load chunk carrying the shader (`precision highp` / `uWorld`), a
      site chunk carrying a chunk-deny string, or a route that is not static (○).
   6. Print the table. Serve it with: NEXT_DIST_DIR=.next-measure npx next start -p 3005
   7. Release the lock. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");
const { people } = require("./jiti-loader.cjs");

const ROOT = path.resolve(__dirname, "..");
const DIST = ".next-measure";
const OUT = path.join(ROOT, DIST);
const LOCK = path.join(ROOT, ".next-measure.lock");
const ROUTES = ["brands", "creators"];
const KB = 1024;

/* §7.1 budgets, gzip. */
const BUDGET = {
  firstLoad: 160 * KB,       // stretch goal 150
  libs: 44 * KB,             // motion (m, domAnimation, hooks) + lenis + lenis/react, by module. Lead ruling 4 Oct (SPEC §7.1 amended): §5.0.1's own imports floor at 31.7 kB; 42.1 measured + 2. WP0-NOTES D13
  deferred: 110 * KB,        // every lazy site chunk together (next/dynamic sections, lead ruling 4 Oct): off the first load, but it still ships
  site: 45 * KB,             // site code + demo.json
  sky: 12 * KB,              // the lazy sky chunk, absent from first load
  css: 26 * KB,              // every stylesheet the prerendered HTML links (lead ruling 5 Oct: the hero's and the lazy sections' CSS is in the static HTML by design, so it all blocks first paint and all counts)
  html: 60 * KB,
  fontPreloads: 2,           // exactly two: Geist Sans, and the logo's 1.2 kB Sora subset
};
/* Package attribution (step 4). The library packages of the §7.1 "motion + lenis" line, and the
   framework packages whose modules can land outside rootMainFiles (a polyfill, next/font stubs). */
const LIB_PKGS = new Set(["motion", "motion-dom", "motion-utils", "framer-motion", "lenis"]);
const FRAMEWORK_PKGS = new Set(["next", "react", "react-dom", "scheduler", "@swc/helpers"]);
const MARK = { shader: [/precision highp/, /uWorld/] };
const MODULES = path.join(OUT, "measure-modules.json");
const PRELOAD = path.join(__dirname, "measure-modules.cjs");
const pkgOf = (res) => {
  if (!res) return null;
  const i = res.replace(/\\/g, "/").lastIndexOf("/node_modules/");
  if (i < 0) return null;
  const [a, b] = res.replace(/\\/g, "/").slice(i + 14).split("/");
  return a.startsWith("@") ? `${a}/${b}` : a;
};
const bucketOf = (res) => {
  const pkg = pkgOf(res);
  return pkg && LIB_PKGS.has(pkg) ? "libs" : pkg && FRAMEWORK_PKGS.has(pkg) ? "framework" : "site";
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
const kb = (n) => `${(n / KB).toFixed(1)} kB`;
const uniq = (xs) => Array.from(new Set(xs));

async function takeLock() {
  for (let waited = 0; ; waited += 2000) {
    try {
      const fd = fs.openSync(LOCK, "wx");
      fs.writeSync(fd, `${process.pid}\n`);
      fs.closeSync(fd);
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      const age = Date.now() - fs.statSync(LOCK).mtimeMs;
      if (age > 30 * 60 * 1000) { fs.unlinkSync(LOCK); continue; }   // a crashed run's lock
      if (waited % 10000 === 0) console.log(`measure: waiting for ${path.basename(LOCK)} (held ${Math.round(age / 1000)}s)`);
      await sleep(2000);
    }
  }
}
const releaseLock = () => { try { fs.unlinkSync(LOCK); } catch { /* already gone */ } };

function run(cmd, args, env) {
  const r = spawnSync(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function main() {
  const failures = [];
  const fail = (m) => failures.push(m);

  /* 2. demo.json is current. */
  const bind = run(process.execPath, ["scripts/bind-demo.cjs", "--check"]);
  process.stdout.write(bind.out);
  if (bind.code !== 0) throw new Error("bind --check failed (run npm run bind)");

  /* 3. The build, into its own distDir. */
  console.log(`measure: next build → ${DIST} …`);
  const build = run(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
    NEXT_DIST_DIR: DIST,
    NEXT_TELEMETRY_DISABLED: "1",
    MEASURE_MODULES_OUT: MODULES,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --require ${JSON.stringify(PRELOAD)}`.trim(),
  });
  if (build.code !== 0) { process.stdout.write(build.out); throw new Error("next build failed"); }
  if (!fs.existsSync(MODULES)) throw new Error(`no module map at ${path.relative(ROOT, MODULES)} (measure-modules.cjs did not hook webpack)`);
  const table = build.out.split("\n").filter((l) => /^[┌├└│]|Route \(app\)|First Load JS|○|ƒ|λ/.test(l));
  console.log(table.join("\n"));

  for (const r of ROUTES) {
    if (!build.out.split("\n").some((l) => new RegExp(`○\\s+/${r}\\s`).test(l))) fail(`/${r} is not static (○) in the route table`);
  }

  /* 4. First load per route. */
  const bm = JSON.parse(fs.readFileSync(path.join(OUT, "build-manifest.json"), "utf8"));
  const abm = JSON.parse(fs.readFileSync(path.join(OUT, "app-build-manifest.json"), "utf8"));
  const rootMain = bm.rootMainFiles || [];
  const layout = abm.pages["/(site)/layout"] || [];
  const file = (f) => path.join(OUT, f);
  const cache = new Map();
  const info = (f) => {
    if (!cache.has(f)) {
      const buf = fs.readFileSync(file(f));
      const src = buf.toString("utf8");
      cache.set(f, { gz: gz(buf), src });
    }
    return cache.get(f);
  };
  /* Step 4: split a chunk's gzip bytes over its modules' packages. Each top-level module's minified
     text (a property of the chunk's module object) is gzipped alone; the chunk total is shared out in
     proportion, and a concatenated module is shared over its inner modules by their source size. */
  const acorn = require("acorn");
  const moduleMap = new Map();
  for (const c of JSON.parse(fs.readFileSync(MODULES, "utf8"))) for (const f of c.files) moduleMap.set(f, c.modules);
  const split = (f) => {
    const { gz: total, src } = info(f);
    if (rootMain.includes(f)) return { framework: total, libs: 0, site: 0, pkgs: {} };
    const mods = moduleMap.get(f);
    if (!mods) throw new Error(`no module map entry for first-load chunk ${f}`);
    const text = new Map();
    const visit = (n) => {
      if (!n || typeof n !== "object") return;
      if (n.type === "ObjectExpression" && n.properties.length && n.properties.every((p) => p.type === "Property" && /Function/.test(p.value.type))) {
        for (const p of n.properties) text.set(String(p.key.value ?? p.key.name), src.slice(p.value.start, p.value.end));
        return;
      }
      for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === "string") visit(v); }
    };
    visit(acorn.parse(src, { ecmaVersion: "latest", sourceType: "script" }));
    const parts = [];
    for (const m of mods) {
      const t = text.get(String(m.id));
      if (t == null) continue;
      const w = gz(Buffer.from(t));
      if (m.inner && m.inner.length) {
        const sz = m.inner.reduce((n, x) => n + x.size, 0) || 1;
        for (const x of m.inner) parts.push({ res: x.res, w: (w * x.size) / sz });
      } else parts.push({ res: m.res, w });
    }
    const out = { framework: 0, libs: 0, site: 0, pkgs: {} };
    const sum = parts.reduce((n, p) => n + p.w, 0);
    if (!sum) { out.site = total; return out; }
    for (const p of parts) {
      const share = (total * p.w) / sum;
      out[bucketOf(p.res)] += share;
      const pkg = pkgOf(p.res);
      if (pkg && LIB_PKGS.has(pkg)) out.pkgs[pkg] = (out.pkgs[pkg] || 0) + share;
    }
    return out;
  };

  const { handles, names } = people();
  const deny = [
    ...handles.map((h) => ({ label: `handle ${h}`, test: (s) => s.toLowerCase().includes(h.toLowerCase()) })),
    ...names.map((n) => ({ label: `name ${n}`, test: (s) => s.toLowerCase().includes(n.toLowerCase()) })),
    ...[/\bounass\b/i, /freshgrocer/i, /\bluna beauty\b/i, /read_site|planFor|DEFAULT_AUTONOMY|FIXTURES/].map((re) => ({ label: String(re), test: (s) => re.test(s) })),
  ];
  const siteChunks = new Set(layout.filter((f) => f.endsWith(".js")));

  const rows = [];
  for (const r of ROUTES) {
    const page = abm.pages[`/(site)/${r}/page`];
    if (!page) { fail(`app-build-manifest has no /(site)/${r}/page`); continue; }
    page.filter((f) => f.endsWith(".js")).forEach((f) => siteChunks.add(f));
    const js = uniq([...rootMain, ...layout, ...page]).filter((f) => f.endsWith(".js"));
    /* CSS: every stylesheet the prerendered HTML links (layout, page and the next/dynamic sections' CSS
       that PreloadCss puts in the static HTML), falling back to the manifest entries. */
    const htmlFile = path.join(OUT, "server", "app", `${r}.html`);
    const linked = fs.existsSync(htmlFile)
      ? uniq((fs.readFileSync(htmlFile, "utf8").match(/\/_next\/static\/css\/[^"'?]+\.css/g) || []).map((h) => h.replace(/^\/_next\//, "")))
      : [];
    const css = linked.length ? linked : uniq([...layout, ...page]).filter((f) => f.endsWith(".css"));
    const sum = { framework: 0, libs: 0, site: 0 };
    const pkgs = {};
    for (const f of js) {
      const x = split(f);
      sum.framework += x.framework; sum.libs += x.libs; sum.site += x.site;
      for (const [k, v] of Object.entries(x.pkgs)) pkgs[k] = (pkgs[k] || 0) + v;
      for (const re of MARK.shader) if (re.test(info(f).src)) fail(`/${r}: first-load chunk ${f} contains ${re}`);
    }
    const total = sum.framework + sum.libs + sum.site;
    const cssGz = css.reduce((n, f) => n + info(f).gz, 0);

    const htmlPath = path.join(OUT, "server", "app", `${r}.html`);
    let htmlGz = NaN, preloads = NaN;
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath);
      htmlGz = gz(html);
      preloads = (html.toString("utf8").match(/<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g) || []).length;
    } else fail(`/${r}: no prerendered HTML at ${path.relative(ROOT, htmlPath)}`);

    if (total > BUDGET.firstLoad) fail(`/${r}: first load ${kb(total)} > ${kb(BUDGET.firstLoad)}`);
    if (sum.libs > BUDGET.libs) fail(`/${r}: motion + lenis ${kb(sum.libs)} > ${kb(BUDGET.libs)} (WP0-NOTES D13)`);
    if (sum.site > BUDGET.site) fail(`/${r}: site code ${kb(sum.site)} > ${kb(BUDGET.site)}`);
    if (cssGz > BUDGET.css) fail(`/${r}: CSS ${kb(cssGz)} > ${kb(BUDGET.css)}`);
    if (!(htmlGz <= BUDGET.html)) fail(`/${r}: HTML ${kb(htmlGz)} > ${kb(BUDGET.html)}`);
    if (preloads !== BUDGET.fontPreloads) fail(`/${r}: ${preloads} preloaded fonts (expected exactly ${BUDGET.fontPreloads})`);
    rows.push({ route: `/${r}`, total, ...sum, pkgs, css: cssGz, html: htmlGz, preloads, chunks: js.length });
  }

  /* The lazy sky chunk: found by its uWorld marker anywhere in static/chunks. */
  const chunkDir = path.join(OUT, "static", "chunks");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const sky = walk(chunkDir).filter((p) => p.endsWith(".js") && /uWorld/.test(fs.readFileSync(p, "utf8")));
  for (const p of sky) {
    const rel = path.relative(OUT, p);
    siteChunks.add(rel);
    const size = info(rel).gz;
    if (size > BUDGET.sky) fail(`sky chunk ${rel} is ${kb(size)} > ${kb(BUDGET.sky)}`);
  }

  /* The lazy site chunks (lead ruling 4 Oct: below-the-fold sections load through next/dynamic, so they
     are off the first load). Every client chunk holding a module from app/(site)/ that the first load
     does not already list. They still ship, so they are budgeted together and deny-scanned. */
  const isSite = (res) => typeof res === "string" && res.replace(/\\/g, "/").includes("/app/(site)/");
  const resOf = (mods) => mods.flatMap((m) => [m.res, ...(m.inner || []).map((x) => x.res)]);
  let deferredGz = 0;
  const deferred = [];
  for (const [f, mods] of moduleMap) {
    if (!f.endsWith(".js") || siteChunks.has(f) || rootMain.includes(f)) continue;
    const res = resOf(mods);
    if (!res.some(isSite)) continue;
    siteChunks.add(f);
    deferred.push(f); deferredGz += info(f).gz;
  }
  if (deferredGz > BUDGET.deferred) fail(`lazy site chunks ${kb(deferredGz)} > ${kb(BUDGET.deferred)}`);

  /* Chunk-deny on site chunks only (never the product routes' chunks). */
  for (const f of siteChunks) {
    const { src } = info(f);
    for (const d of deny) if (d.test(src)) fail(`site chunk ${f} contains ${d.label}`);
  }

  /* 6. The table. */
  console.log("\nroute       first load   framework   motion+lenis   site     css      html     font preloads");
  for (const x of rows) {
    console.log(`${x.route.padEnd(11)} ${kb(x.total).padEnd(12)} ${kb(x.framework).padEnd(11)} ${kb(x.libs).padEnd(14)} ${kb(x.site).padEnd(8)} ${kb(x.css).padEnd(8)} ${kb(x.html).padEnd(8)} ${x.preloads}`);
  }
  for (const x of rows) {
    console.log(`${x.route} motion+lenis by package: ${Object.entries(x.pkgs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${kb(v)}`).join(" · ")}`);
  }
  for (const x of rows) console.log(`${x.route} first-load headroom: ${kb(BUDGET.firstLoad - x.total)} of ${kb(BUDGET.firstLoad)}`);
  console.log(`lazy site chunks: ${deferred.length}, ${kb(deferredGz)} of ${kb(BUDGET.deferred)}`);
  console.log(`sky chunk: ${sky.length ? sky.map((p) => `${path.relative(OUT, p)} ${kb(info(path.relative(OUT, p)).gz)}`).join(", ") : "none yet (stub)"}`);
  console.log(`budgets: first load ≤ ${kb(BUDGET.firstLoad)} · lazy site chunks ≤ ${kb(BUDGET.deferred)} · motion+lenis ≤ ${kb(BUDGET.libs)} · site ≤ ${kb(BUDGET.site)} · css ≤ ${kb(BUDGET.css)} · html ≤ ${kb(BUDGET.html)} · sky ≤ ${kb(BUDGET.sky)}`);
  console.log(`deny-list: ${handles.length} handles, ${names.length} names, 4 patterns over ${siteChunks.size} site chunks`);

  if (failures.length) {
    console.error(`\nmeasure FAILED (${failures.length})`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    return 1;
  }
  console.log("\nmeasure ok");
  return 0;
}

(async () => {
  await takeLock();
  const release = () => { releaseLock(); process.exit(130); };
  process.on("SIGINT", release);
  process.on("SIGTERM", release);
  let code = 1;
  try { code = main(); } catch (e) { console.error(`measure: ${e.message}`); code = 1; } finally { releaseLock(); }
  process.exit(code);
})();
