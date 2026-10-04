/* eslint-disable @typescript-eslint/no-require-imports -- a CommonJS launcher (§3.2) */
/* Runs the real product functions and writes app/(site)/_site/data/demo.json.
   jiti 1.21 parses .tsx but does not transform JSX, so .tsx goes through TypeScript. */
const path = require("path");
const root = path.resolve(__dirname, "..");
const ts = require("typescript");
const babel = require("jiti/dist/babel.js");
const transform = (opts) => {
  if (opts.filename && opts.filename.endsWith(".tsx")) {
    const out = ts.transpileModule(opts.source, {
      fileName: opts.filename,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    return { code: out.outputText };
  }
  return (babel.default || babel)(opts);
};
const jiti = require("jiti")(__filename, {
  interopDefault: true, requireCache: false, alias: { "@": root }, transform,
  extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
});
jiti("./bind-demo.ts")
  .main({ check: process.argv.includes("--check") })
  .catch((e) => { console.error(`bind-demo: ${e.message}`); process.exit(1); });
