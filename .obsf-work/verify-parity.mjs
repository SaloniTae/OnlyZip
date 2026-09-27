import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

function collect(file) {
  const code = fs.readFileSync(file, "utf8");
  const ast = parse(code, {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    errorRecovery: false,
  });
  const strings = new Set();
  const counts = new Map();
  const add = (v) => {
    strings.add(v);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  };
  traverse(ast, {
    StringLiteral(p) {
      add(p.node.value);
    },
    TemplateElement(p) {
      if (p.node.value.raw) add(p.node.value.raw);
    },
  });
  return { code, strings, counts };
}

const raw = collect(process.argv[2]);
const dec = collect(process.argv[3]);

const minLen = 4;
const keep = (s) => s.length >= minLen;

const rawBig = [...raw.strings].filter(keep);
const decBig = [...dec.strings].filter(keep);
const decSet = new Set(decBig);
const rawSet = new Set(rawBig);

const missing = rawBig.filter((s) => !decSet.has(s));
const invented = decBig.filter((s) => !rawSet.has(s));

console.log("raw: parsed OK, string literals total:", raw.strings.size);
console.log("decoded: parsed OK, string literals total:", dec.strings.size);
console.log("raw >=4 chars:", rawBig.length, " decoded >=4 chars:", decBig.length);
console.log("--- in RAW but NOT in decoded:", missing.length, "---");
for (const s of missing.slice(0, 50)) console.log(JSON.stringify(s));
console.log("--- in DECODED but NOT in raw:", invented.length, "---");
for (const s of invented.slice(0, 50)) console.log(JSON.stringify(s));
