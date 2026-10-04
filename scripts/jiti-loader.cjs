/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS tooling */
/* The bind's jiti loader (scripts/bind-demo.cjs), shared by check-site.cjs and measure.cjs so the
   people deny-list is read from the product fixtures through the same loader, never typed by hand.
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

/** Every handle (with and without "@") and name in C PEOPLE and B CREATORS. */
function people() {
  return jiti("./bind-demo.ts").people();
}

module.exports = { jiti, people, root };
