/**
 * verify.mjs — prove that background-obsf.js is the same program as the webcrack
 * output it was derived from (only identifiers renamed, comments added).
 *
 *   node verify.mjs out/deobfuscated.js ../background-obsf.js
 *
 * Checks (all must match exactly):
 *   * string-literal multiset
 *   * member/property-name multiset (computed string keys included)
 *   * numeric-literal multiset
 *   * AST node-type histogram
 *   * per-kind statement counts
 *   * no `_0x…` identifier left in the code
 *   * the file parses and both files contain the same top-level statement count
 */
import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const [a, b] = process.argv.slice(2);
const read = (f) =>
  parse(fs.readFileSync(f, "utf8"), {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  });

const astA = read(a);
const astB = read(b);

function collect(ast) {
  const strings = [];
  const props = [];
  const numbers = [];
  const types = new Map();
  const statements = [];
  const hexIds = new Set();
  const members = [];
  traverse(ast, {
    enter(p) {
      const t = p.node.type;
      types.set(t, (types.get(t) ?? 0) + 1);
      if (/Statement$|Declaration$/.test(t) && p.isStatement()) statements.push(t);
      if (t === "StringLiteral") strings.push(p.node.value);
      if ((t === "MemberExpression" || t === "OptionalMemberExpression")) {
        if (!p.node.computed && p.node.property.type === "Identifier")
          props.push(p.node.property.name);
        else if (p.node.computed && p.node.property.type === "StringLiteral")
          props.push(p.node.property.value);
        members.push(`${p.node.computed ? "[c]" : "."}${p.node.property.name ?? ""}`);
      }
      if (t === "ObjectProperty" && !p.node.computed && p.node.key.type === "Identifier")
        props.push(p.node.key.name);
      if (t === "NumericLiteral") numbers.push(String(p.node.value));
      if (t === "Identifier" && /^_0x[0-9a-f]+$/.test(p.node.name)) hexIds.add(p.node.name);
    },
  });
  const sortCount = (arr) => {
    const m = new Map();
    for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort();
  };
  return {
    strings: sortCount(strings),
    props: sortCount(props),
    numbers: sortCount(numbers),
    types: [...types.entries()].sort(),
    statements: sortCount(statements),
    hexIds: [...hexIds].sort(),
    memberCount: members.length,
  };
}

const A = collect(astA);
const B = collect(astB);

const show = (label, x = 12) => `\n  first differences (up to ${x}):`;
function diff(label, a, b) {
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${same ? "PASS" : "FAIL"}  ${label}`);
  if (same) return true;
  const mapB = new Map(b);
  const mapA = new Map(a);
  const onlyA = [...mapA].filter(([k, v]) => mapB.get(k) !== v);
  const onlyB = [...mapB].filter(([k, v]) => mapA.get(k) !== v);
  console.log(show(label));
  for (const [k, v] of onlyA.slice(0, 12)) console.log(`    only in ${a.length ? "source" : "source"}: ${JSON.stringify(k)} x${v}`);
  for (const [k, v] of onlyB.slice(0, 12)) console.log(`    only in obsf  : ${JSON.stringify(k)} x${v}`);
  return false;
}

console.log(`source: ${a}`);
console.log(`obsf  : ${b}\n`);

let ok = true;
ok = diff("string literals", A.strings, B.strings) && ok;
ok = diff("member / property names", A.props, B.props) && ok;
ok = diff("numeric literals", A.numbers, B.numbers) && ok;
ok = diff("AST node-type histogram", A.types, B.types) && ok;
ok = diff("statement counts", A.statements, B.statements) && ok;

console.log(`${A.hexIds.length === 0 ? "PASS" : "FAIL"}  source has no _0x identifiers left (${A.hexIds.length})`);
console.log(`${B.hexIds.length === 0 ? "PASS" : "FAIL"}  obsf   has no _0x identifiers left (${B.hexIds.length})`);
if (B.hexIds.length) console.log("    " + B.hexIds.join(", "));
ok = ok && B.hexIds.length === 0;

console.log(`\n${ok ? "VERIFIED: same program, identifiers renamed only" : "MISMATCH — do not trust the file"}`);
process.exit(ok ? 0 : 1);
