/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS tooling */
/* Preloaded into `next build` by measure.cjs (NODE_OPTIONS --require), never by the dev server.
   It adds one read-only hook to webpack's Compiler: after the CLIENT compilation is sealed, it writes
   every chunk's files and modules (webpack id plus resource path; a concatenated module lists its
   inner modules with their sizes) to MEASURE_MODULES_OUT. It changes no output. measure.cjs uses the
   map to attribute each first-load chunk's gzip bytes by package, so motion and lenis count against
   their §7.1 budget whichever chunk webpack puts them in. Pinned to Next 14.2's compiled webpack
   (next/dist/compiled/webpack/webpack.js requires "./bundle5"); measure fails loudly if no map is written. */
const Module = require("module");
const fs = require("fs");

const OUT = process.env.MEASURE_MODULES_OUT;
const origRequire = Module.prototype.require;

function patch(Compiler) {
  if (!Compiler || Compiler.prototype.__measureModules) return;
  Compiler.prototype.__measureModules = true;
  const newCompilation = Compiler.prototype.newCompilation;
  Compiler.prototype.newCompilation = function (params) {
    const compilation = newCompilation.call(this, params);
    if (this.name !== "client") return compilation;
    compilation.hooks.afterSeal.tap("measure-modules", () => {
      const cg = compilation.chunkGraph;
      const res = (m) => (typeof m.nameForCondition === "function" ? m.nameForCondition() : null);
      const chunks = [];
      for (const chunk of compilation.chunks) {
        const modules = [];
        for (const mod of cg.getChunkModulesIterable(chunk)) {
          const inner = mod.modules ? Array.from(mod.modules, (x) => ({ res: res(x), size: x.size() })) : null;
          modules.push({ id: cg.getModuleId(mod), res: res(mod), size: mod.size(), inner });
        }
        chunks.push({ files: Array.from(chunk.files), modules });
      }
      fs.writeFileSync(OUT, JSON.stringify(chunks));
    });
    return compilation;
  };
}

if (OUT) {
  Module.prototype.require = function (id) {
    const exported = origRequire.apply(this, arguments);
    if (/(^|[\\/])bundle5(\.js)?$/.test(id) && typeof exported === "function") {
      try { patch(exported().webpack?.Compiler); } catch (e) { console.error(`measure-modules: ${e.message}`); }
    }
    return exported;
  };
}
