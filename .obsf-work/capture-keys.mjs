import fs from "node:fs";
import vm from "node:vm";

let raw = fs.readFileSync("background.raw.js", "utf8");

const before = raw.length;
const header = "_0x5ae0=function(_0x4d0281,_0x28ee6e){";
if (!raw.includes(header)) {
  console.log("decoder header not found");
  process.exit(1);
}
raw = raw.replace(
  header,
  header + "try{globalThis.__LOG.push([_0x4d0281,_0x28ee6e]);}catch(_e){}",
);
console.log("instrumented:", raw.length !== before);

const sandbox = {};
sandbox.console = { log() {}, warn() {}, error() {}, info() {} };
sandbox.setTimeout = () => 0;
sandbox.setInterval = () => 0;
sandbox.clearTimeout = () => {};
sandbox.clearInterval = () => {};
sandbox.queueMicrotask = () => {};
sandbox.atob = (s) => Buffer.from(s, "base64").toString("binary");
sandbox.btoa = (s) => Buffer.from(s, "binary").toString("base64");
sandbox.Buffer = Buffer;
vm.createContext(sandbox);
vm.runInContext(
  `
  globalThis.__LOG = [];
  globalThis.self = globalThis; globalThis.window = globalThis;
  globalThis.importScripts = function(){};
  globalThis.navigator = { userAgent: "stub" };
  function makeDeep(){
    const f = function(){ return makeDeep(); };
    return new Proxy(f, {
      get(t,p){
        if (p === Symbol.toPrimitive) return () => "";
        if (p === "toString") return () => "";
        if (p === "valueOf") return () => 0;
        if (p === "then") return undefined;
        if (p === "version") return "30.5";
        return makeDeep();
      },
      apply(){ return makeDeep(); },
      construct(){ return makeDeep(); }
    });
  }
  globalThis.chrome = makeDeep();
  `,
  sandbox,
);
vm.runInContext(raw, sandbox, { timeout: 120000, filename: "instrumented.js" });

const log = sandbox.__LOG ?? [];
console.log("decoder calls logged at runtime:", log.length);
const keys = new Set();
const indexRange = [Infinity, -Infinity];
for (const [idx, key] of log) {
  if (typeof key === "string") keys.add(key);
  if (typeof idx === "number") {
    indexRange[0] = Math.min(indexRange[0], idx);
    indexRange[1] = Math.max(indexRange[1], idx);
  }
}
console.log("unique keys observed:", keys.size);
console.log("keys:", JSON.stringify([...keys].slice(0, 120)));
console.log("key lengths:", JSON.stringify([...new Set([...keys].map((k) => k.length))]));
console.log("index range observed:", indexRange);
fs.writeFileSync("observed-keys.json", JSON.stringify([...keys]));
