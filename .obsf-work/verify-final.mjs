import fs from "node:fs";
import vm from "node:vm";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const CUSTOM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";

function b64Decode(str) {
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of str) {
    const v = CUSTOM.indexOf(ch);
    if (v < 0) continue;
    if (ch === "=") break;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  try {
    return Buffer.from(bytes).toString("utf8");
  } catch {
    return Buffer.from(bytes).toString("latin1");
  }
}

function rc4(key, data) {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  const kb = Buffer.from(key, "utf8");
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + kb[i % kb.length]) & 255;
    [S[i], S[j]] = [S[j], S[i]];
  }
  const out = Buffer.alloc(data.length);
  let i2 = 0;
  j = 0;
  for (let k = 0; k < data.length; k++) {
    i2 = (i2 + 1) & 255;
    j = (j + S[i2]) & 255;
    [S[i2], S[j]] = [S[j], S[i2]];
    out[k] = data[k] ^ S[(S[i2] + S[j]) & 255];
  }
  return out;
}

// --- get the raw array by executing the file ---
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
  globalThis.self = globalThis; globalThis.window = globalThis; globalThis.globalThis = globalThis;
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
console.log("raw string-array entries:", arr.length);

const keys = JSON.parse(fs.readFileSync("keys.json", "utf8"));
console.log("rc4 keys in use:", keys.length);

// a decode is only believable if it is clean, printable text
const clean = (s) =>
  s.length > 0 &&
  s.length < 2000 &&
  !/\uFFFD/.test(s) &&
  !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s);

// --- decode every entry, with and without rc4 ---
const fragments = new Set();
let ambiguous = 0;
let plainEntries = 0;
for (const entry of arr) {
  if (typeof entry !== "string") continue;
  const cands = new Set();
  const plain = b64Decode(entry);
  if (clean(plain)) cands.add(plain);
  for (const k of keys) {
    const s = rc4(k, Buffer.from(plain, "utf8")).toString("utf8");
    if (clean(s)) cands.add(s);
  }
  if (cands.size > 1) ambiguous++;
  if (cands.size >= 1) plainEntries++;
  for (const s of cands) fragments.add(s);
}
console.log(
  `array entries that yielded clean text: ${plainEntries}/${arr.length}` +
    ` (entries with >1 plausible decode: ${ambiguous})`,
);
console.log("distinct plaintext fragments recovered from the raw array:", fragments.size);

// --- decoded file literals ---
const decCode = fs.readFileSync("out/deobfuscated.js", "utf8");
const decAst = parse(decCode, { sourceType: "unambiguous" });
const decLits = new Set();
traverse(decAst, {
  StringLiteral(p) { decLits.add(p.node.value); },
  TemplateElement(p) { if (p.node.value.raw) decLits.add(p.node.value.raw); },
});
const targets = [...decLits].filter((s) => s.length >= 2);

// tiling: can the literal be split into consecutive raw fragments (splitStrings)?
function canTile(s) {
  const n = s.length;
  const ok = new Array(n + 1).fill(false);
  ok[0] = true;
  for (let i = 0; i < n; i++) {
    if (!ok[i]) continue;
    for (let j = i + 1; j <= Math.min(n, i + 60); j++) {
      if (fragments.has(s.slice(i, j))) ok[j] = true;
    }
  }
  return ok[n];
}

const direct = [];
const tiled = [];
const unexplained = [];
for (const lit of targets) {
  if (fragments.has(lit)) direct.push(lit);
  else if (canTile(lit)) tiled.push(lit);
  else unexplained.push(lit);
}

console.log("");
console.log("=== VERIFICATION of out/deobfuscated.js against raw background.js ===");
console.log("decoded literals checked:", targets.length);
console.log("  exact matches in the raw string array :", direct.length);
console.log("  rebuilt by concatenating raw fragments:", tiled.length);
console.log("  unexplained                           :", unexplained.length);
for (const s of unexplained.slice(0, 40)) console.log("     ", JSON.stringify(s));
fs.writeFileSync("unexplained.json", JSON.stringify(unexplained, null, 1));
