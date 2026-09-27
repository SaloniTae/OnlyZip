import fs from "node:fs";
import vm from "node:vm";

const raw = fs.readFileSync(process.argv[2], "utf8");

// ---- permissive stub object ------------------------------------------------
let depth = 0;
const stubCache = new WeakMap();
function stub() {
  const target = function () {};
  target.__stub = true;
  const p = new Proxy(target, {
    get(t, prop) {
      if (prop === Symbol.toPrimitive) return () => "";
      if (prop === "toString") return () => "";
      if (prop === "valueOf") return () => 0;
      if (prop === "then") return undefined; // keep it non-thenable
      if (prop === "length") return 0;
      if (prop in t) return t[prop];
      if (depth > 6) return undefined;
      let v = stubCache.get(t);
      if (!v) {
        depth++;
        v = stub();
        depth--;
        stubCache.set(t, v);
      }
      return v;
    },
    apply() {
      return undefined;
    },
    construct() {
      return {};
    },
  });
  return p;
}

const sandbox = {};
sandbox.console = {
  log() {},
  warn() {},
  error() {},
  info() {},
  debug() {},
};
sandbox.setTimeout = () => 0;
sandbox.setInterval = () => 0;
sandbox.clearTimeout = () => {};
sandbox.clearInterval = () => {};
sandbox.queueMicrotask = () => {};
sandbox.fetch = () => new Promise(() => {});
sandbox.atob = (s) => Buffer.from(s, "base64").toString("binary");
sandbox.btoa = (s) => Buffer.from(s, "binary").toString("base64");
sandbox.Buffer = Buffer;
sandbox.process = { env: {}, versions: process.versions };

vm.createContext(sandbox);
vm.runInContext(
  `
  globalThis.self = globalThis;
  globalThis.window = globalThis;
  globalThis.globalThis = globalThis;
  globalThis.importScripts = function(){};
  globalThis.navigator = { userAgent: "stub", hardwareConcurrency: 8 };
  const chromeStub = new Proxy(function(){}, {
    get(t,p){
      if (p === "runtime") return runtimeStub;
      return makeDeep();
    }
  });
  function makeDeep(){
    const f = function(){ return undefined; };
    return new Proxy(f, {
      get(t,p){
        if (p === Symbol.toPrimitive) return () => "";
        if (p === "toString") return () => "";
        if (p === "valueOf") return () => 0;
        if (p === "then") return undefined;
        if (p === "version") return "30.5";
        if (p === "local" || p === "sync" || p === "session") return makeDeep();
        return makeDeep();
      },
      apply(){ return makeDeep(); },
      construct(){ return makeDeep(); }
    });
  }
  const runtimeStub = makeDeep();
  globalThis.chrome = chromeStub;
  `,
  sandbox,
);

let runError = null;
try {
  vm.runInContext(raw, sandbox, { timeout: 120000, filename: "background.raw.js" });
} catch (e) {
  runError = e;
}
console.log("top-level execution error:", runError ? String(runError).slice(0, 300) : "none");

const decoder = sandbox._0x5ae0;
console.log("decoder _0x5ae0 present:", typeof decoder);
if (typeof decoder !== "function") process.exit(1);

const table = new Set();
const values = [];
try {
  const arr = sandbox._0x20ab();
  console.log("string array length:", Array.isArray(arr) ? arr.length : typeof arr);
} catch (e) {
  console.log("array length probe failed:", String(e).slice(0, 120));
}
for (let i = -200; i < 60000; i++) {
  try {
    const v = decoder(i);
    if (typeof v === "string" && v.length) {
      table.add(v);
      values.push(v);
    }
  } catch {}
}
console.log("plaintext table entries recovered:", table.size);
fs.writeFileSync("table.json", JSON.stringify([...table], null, 0));
console.log("wrote table.json");
