import fs from "node:fs";
import vm from "node:vm";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const CUSTOM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";

// --- obfuscator's base64 encoder (inverse of the decoder inside background.js) ---
function b64Custom(buf) {
  let out = "";
  for (let i = 0; i < buf.length; i += 3) {
    const b0 = buf[i];
    const b1 = i + 1 < buf.length ? buf[i + 1] : 0;
    const b2 = i + 2 < buf.length ? buf[i + 2] : 0;
    out += CUSTOM[b0 >> 2];
    out += CUSTOM[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < buf.length ? CUSTOM[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < buf.length ? CUSTOM[b2 & 63] : "=";
  }
  return out;
}

// --- standard RC4 over UTF-8 bytes (matches _0x372916 in the file) ---
function rc4(key, data) {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  const kBytes = Buffer.from(key, "utf8");
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + kBytes[i % kBytes.length]) & 255;
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

// ---------------- run the raw file to get the real string array ----------------
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
const entries = new Set(arr);
const entryIndex = new Map();
for (let i = 0; i < arr.length; i++) if (!entryIndex.has(arr[i])) entryIndex.set(arr[i], i);
console.log("string array length:", arr.length, " unique entries:", entries.size);

// ---------------- candidate keys: short literals found in the raw file ----------------
const ast = parse(raw, { sourceType: "unambiguous", allowReturnOutsideFunction: true });
const rawLits = new Set();
traverse(ast, { StringLiteral(p) { rawLits.add(p.node.value); } });
const keys = [...rawLits].filter((s) => s.length >= 3 && s.length <= 12 && /^[\x21-\x7e]+$/.test(s) && !s.includes(" "));
const keySet = [...new Set(keys)];
console.log("candidate RC4 keys:", keySet.length);

// ---------------- decoded file literals ----------------
const decCode = fs.readFileSync("out/deobfuscated.js", "utf8");
const decAst = parse(decCode, { sourceType: "unambiguous" });
const decLits = new Set();
traverse(decAst, {
  StringLiteral(p) { decLits.add(p.node.value); },
  TemplateElement(p) { if (p.node.value.raw) decLits.add(p.node.value.raw); },
});
const targets = [...decLits].filter((s) => s.length >= 2);
console.log("decoded literals to check:", targets.length);

const proven = new Map(); // literal -> {key, index}
for (const lit of targets) {
  const data = Buffer.from(lit, "utf8");
  for (const k of keySet) {
    const entry = b64Custom(rc4(k, data));
    if (entries.has(entry)) {
      proven.set(lit, { key: k, entry, index: entryIndex.get(entry) });
      break;
    }
  }
}
console.log("PROVEN present in raw string array:", proven.size, "/", targets.length);

// spot-confirm through the raw file's own decoder
let confirmed = 0;
let checked = 0;
for (const [lit, info] of [...proven].slice(0, 40)) {
  const idxPlusOffset = info.index + 386; // decoder subtracts 386 from its argument
  for (const arg of [idxPlusOffset, info.index, idxPlusOffset - 386]) {
    let v;
    try { v = sandbox._0x5ae0(arg, info.key); } catch {}
    if (v === lit) { confirmed++; break; }
  }
  checked++;
}
console.log(`decoder round-trip confirmation: ${confirmed}/${checked} spot-checked literals match`);

const unproven = targets.filter((s) => !proven.has(s));
fs.writeFileSync("proven.json", JSON.stringify({ proven: [...proven], unproven }));
console.log("UNPROVEN (need explanation):", unproven.length);
for (const s of unproven.slice(0, 60)) console.log("   ", JSON.stringify(s));
