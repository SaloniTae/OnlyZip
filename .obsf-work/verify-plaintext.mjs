import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

function literals(file) {
  const code = fs.readFileSync(file, "utf8");
  const ast = parse(code, {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  });
  const out = [];
  traverse(ast, {
    StringLiteral(p) {
      out.push(p.node.value);
    },
    TemplateElement(p) {
      if (p.node.value.raw) out.push(p.node.value.raw);
    },
  });
  return out;
}

const raw = literals(process.argv[2]);
const dec = literals(process.argv[3]);

// build the set of "knowable" plaintexts from the raw file:
// every literal as-is, plus base64/atob decodings of every literal (utf8 + latin1),
// plus a shifted-base64 variant (javascript-obfuscator offsets the base64 table).
function b64Variants(s) {
  const res = new Set();
  const tryDecode = (str) => {
    try {
      const buf = Buffer.from(str, "base64");
      if (!buf.length) return;
      res.add(buf.toString("utf8"));
      res.add(buf.toString("latin1"));
    } catch {}
  };
  tryDecode(s);
  // obfuscator may shift the base64 alphabet; try the 3 common table rotations
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (let k = 1; k < 64; k++) {
    const rotated = A.slice(k) + A.slice(0, k);
    const map = new Map();
    for (let i = 0; i < 64; i++) map.set(rotated[i], A[i]);
    const translated = s.replace(/[A-Za-z0-9+/]/g, (c) => map.get(c) ?? c);
    if (translated !== s) tryDecode(translated);
    if (res.size > 40000) break;
  }
  return res;
}

const known = new Set();
for (const s of raw) {
  known.add(s);
  if (s.length >= 4 && /^[A-Za-z0-9+/=]+$/.test(s)) {
    for (const v of b64Variants(s)) known.add(v);
  }
}

const decBig = [...new Set(dec)].filter((s) => s.length >= 4);
const unexplained = decBig.filter((s) => !known.has(s));

console.log("raw literals:", raw.length, " unique:", new Set(raw).size);
console.log("decoded literals:", dec.length, " unique >=4ch:", decBig.length);
console.log("known-plaintext pool size:", known.size);
console.log("decoded literals NOT explainable from raw:", unexplained.length);
for (const s of unexplained.slice(0, 60)) console.log(JSON.stringify(s));
