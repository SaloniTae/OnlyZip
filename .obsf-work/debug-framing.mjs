import fs from "node:fs";
import vm from "node:vm";

const CUSTOM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
function b64Decode(str) {
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of str) {
    if (ch === "=") break;
    const v = CUSTOM.indexOf(ch);
    if (v < 0 || v === 63) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  return Buffer.from(bytes).toString("utf8");
}
function b64Encode(buf) {
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
vm.runInContext(raw, sandbox, { timeout: 120000 });
const arr = sandbox._0x20ab();
const keys = JSON.parse(fs.readFileSync("keys.json", "utf8"));
const TARGETS = ["ql_switc", "Could no", "on has b", "revoked", "ql_credi"];

console.log("array length:", arr.length);
const entriesSet = new Set(arr);

// how is an entry indexed relative to the decoder argument?
const probe = [];
for (let i = 0; i < arr.length; i++) {
  let v;
  try { v = sandbox._0x5ae0(i, undefined); } catch { continue; }
  if (typeof v === "string" && v) probe.push([i, arr[i], v]);
}
console.log("keyless decoder calls that returned a string:", probe.length);
console.log("first 5 (arg, entry, value):");
for (const [i, e, v] of probe.slice(0, 5)) console.log(`  arg=${i} entry=${JSON.stringify(e)} value=${JSON.stringify(v)}`);

for (const t of TARGETS) {
  const hit = probe.find(([, , v]) => v === t);
  console.log(`\n=== target ${JSON.stringify(t)} ===`);
  if (!hit) { console.log("  not returned by any keyless call"); continue; }
  const [arg, entry, value] = hit;
  console.log(`  arg=${arg} entry=${JSON.stringify(entry)} keyless value=${JSON.stringify(value)}`);
  console.log(`  my b64Decode(entry) = ${JSON.stringify(b64Decode(entry))}`);
  console.log(`  arr[arg-386] = ${JSON.stringify(arr[arg - 386])}`);
  console.log(`  arr[arg]     = ${JSON.stringify(arr[arg])}`);
  // does the raw array actually contain our encoding of the chunk?
  console.log(`  b64Encode(chunk) in array: ${entriesSet.has(b64Encode(Buffer.from(t, "utf8")))}`);
  const keyHits = keys.filter((k) => entriesSet.has(b64Encode(rc4(k, Buffer.from(t, "utf8")))));
  console.log(`  b64Encode(rc4(key, chunk)) matches with keys: ${JSON.stringify(keyHits)}`);
}
