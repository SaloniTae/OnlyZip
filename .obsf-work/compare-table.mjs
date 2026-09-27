import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const table = new Set(JSON.parse(fs.readFileSync("table.json", "utf8")));

const code = fs.readFileSync("out/deobfuscated.js", "utf8");
const ast = parse(code, { sourceType: "unambiguous" });
const lits = new Set();
traverse(ast, {
  StringLiteral(p) {
    lits.add(p.node.value);
  },
  TemplateElement(p) {
    if (p.node.value.raw) lits.add(p.node.value.raw);
  },
});

const unexplained = [...lits].filter((s) => s.length && !table.has(s));
console.log("decoded string literals (unique):", lits.size);
console.log("decoder-table plaintexts recovered:", table.size);
console.log("decoded literals NOT found in the raw file's own decoder table:", unexplained.length);
for (const s of unexplained.slice(0, 80)) console.log("  ", JSON.stringify(s));

// how much of the table does the decoded file actually use?
const used = [...table].filter((s) => lits.has(s)).length;
console.log(`table entries referenced by decoded output: ${used}/${table.size}`);
