import fs from "node:fs";
import vm from "node:vm";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const raw = fs.readFileSync("background.raw.js", "utf8");
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
vm.runInContext(raw, sandbox, { timeout: 120000, filename: "background.raw.js" });

const arr = sandbox._0x20ab();
const decoder = sandbox._0x5ae0;
// every 4-character literal in the raw file is a candidate rc4 key
const rawAstKeys = parse(raw, { sourceType: "unambiguous", allowReturnOutsideFunction: true });
const fourChar = new Set();
traverse(rawAstKeys, {
  StringLiteral(p) { if (p.node.value.length === 4) fourChar.add(p.node.value); },
});
const keys = [undefined, ...new Set([...fourChar, ...JSON.parse(fs.readFileSync("keys.json", "utf8"))])];
console.log("array length:", arr.length, " keys swept:", keys.length - 1);

const clean = (s) =>
  typeof s === "string" &&
  s.length > 0 &&
  s.length < 3000 &&
  !/\uFFFD/.test(s) &&
  !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s);

const fragments = new Set();
let hits = 0;
for (let arg = -500; arg < arr.length + 3000; arg++) {
  for (const k of keys) {
    let v;
    try {
      v = decoder(arg, k);
    } catch {
      continue;
    }
    if (clean(v)) {
      fragments.add(v);
      hits++;
    }
  }
}
console.log("clean decodes:", hits, " distinct plaintext fragments:", fragments.size);
fs.writeFileSync("fragments.json", JSON.stringify([...fragments]));

// ---- decoded file literals ----
const decCode = fs.readFileSync("out/deobfuscated.js", "utf8");
const decAst = parse(decCode, { sourceType: "unambiguous" });
const decLits = new Set();
traverse(decAst, {
  StringLiteral(p) { decLits.add(p.node.value); },
  TemplateElement(p) { if (p.node.value.raw) decLits.add(p.node.value.raw); },
});
const targets = [...decLits].filter((s) => s.length >= 2);

// literals that already appear verbatim (escapes decoded) in the raw source
const rawLits = new Set();
const rawAst = parse(raw, { sourceType: "unambiguous", allowReturnOutsideFunction: true });
traverse(rawAst, {
  StringLiteral(p) { rawLits.add(p.node.value); },
  TemplateElement(p) { if (p.node.value.raw) rawLits.add(p.node.value.raw); },
});

function canTile(s) {
  const n = s.length;
  const ok = new Array(n + 1).fill(false);
  ok[0] = true;
  for (let i = 0; i < n; i++) {
    if (!ok[i]) continue;
    for (let j = i + 1; j <= Math.min(n, i + 80); j++) {
      const piece = s.slice(i, j);
      if (fragments.has(piece) || rawLits.has(piece)) ok[j] = true;
    }
    if (ok[n]) return true;
  }
  return ok[n];
}

const fromArray = [];
const fromPlain = [];
const tiled = [];
const unexplained = [];
for (const lit of targets) {
  if (fragments.has(lit)) fromArray.push(lit);
  else if (rawLits.has(lit)) fromPlain.push(lit);
  else if (canTile(lit)) tiled.push(lit);
  else unexplained.push(lit);
}

console.log("");
console.log("=== VERIFICATION: out/deobfuscated.js vs raw background.js ===");
console.log("decoded literals checked                   :", targets.length);
console.log("  matched raw decoder output (string array):", fromArray.length);
console.log("  present verbatim in the raw source       :", fromPlain.length);
console.log("  rebuilt from consecutive array fragments :", tiled.length);
console.log("  UNEXPLAINED (possible fabrication)       :", unexplained.length);
for (const s of unexplained.slice(0, 40)) console.log("     ", JSON.stringify(s));
fs.writeFileSync("unexplained.json", JSON.stringify({ unexplained, tiled }, null, 1));
