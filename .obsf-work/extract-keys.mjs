import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const raw = fs.readFileSync("background.raw.js", "utf8");
const ast = parse(raw, { sourceType: "unambiguous", allowReturnOutsideFunction: true });

// 1. const maps:  const _0x62990 = { _0x4c34c7: 'aBde', _0x59ad35: 0xb, ... }
const maps = new Map();
traverse(ast, {
  VariableDeclarator(p) {
    const { id, init } = p.node;
    if (id.type === "Identifier" && init && init.type === "ObjectExpression") {
      const obj = {};
      for (const prop of init.properties) {
        if (prop.type !== "ObjectProperty") continue;
        const k = prop.key.type === "Identifier" ? prop.key.name : prop.key.value;
        if (prop.value.type === "StringLiteral") obj[k] = prop.value.value;
        else if (prop.value.type === "NumericLiteral") obj[k] = prop.value.value;
        else if (prop.value.type === "UnaryExpression" && prop.value.operator === "-" && prop.value.argument.type === "NumericLiteral")
          obj[k] = -prop.value.argument.value;
      }
      maps.set(id.name, obj);
    }
  },
});

// 2. wrapper functions: function _0x4eae59(a,b,c,d,e){ return _0x5ae0(c - -OFF, a); }
const wrappers = new Map(); // wrapperName -> { decoderName, keyParamIndex, args }
traverse(ast, {
  FunctionDeclaration(p) {
    const body = p.node.body.body;
    if (body.length !== 1 || body[0].type !== "ReturnStatement") return;
    const ret = body[0].argument;
    if (!ret || ret.type !== "CallExpression" || ret.callee.type !== "Identifier") return;
    const params = p.node.params.map((x) => (x.type === "Identifier" ? x.name : null));
    const keyIdx = params.findIndex((n) => n && ret.arguments.some((a) => a.type === "Identifier" && a.name === n));
    if (keyIdx < 0) return;
    wrappers.set(p.node.id.name, { decoderName: ret.callee.name, keyIdx, paramCount: params.length });
  },
});

// 3. resolve call sites
function resolve(node) {
  if (!node) return undefined;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "Identifier") {
    // look for a const of the same name holding a literal
    return undefined;
  }
  if (node.type === "MemberExpression" && node.object.type === "Identifier" && !node.computed) {
    const m = maps.get(node.object.name);
    const k = node.property.name;
    if (m && k in m) return m[k];
  }
  return undefined;
}

const keys = new Set();
let callSites = 0;
let resolvedKey = 0;
traverse(ast, {
  CallExpression(p) {
    const callee = p.node.callee;
    if (callee.type !== "Identifier") return;
    const w = wrappers.get(callee.name);
    if (!w) return;
    callSites++;
    const arg = p.node.arguments[w.keyIdx];
    const v = resolve(arg);
    if (typeof v === "string") {
      keys.add(v);
      resolvedKey++;
    }
  },
});

console.log("const maps:", maps.size, " wrapper fns:", wrappers.size);
console.log("wrapper call sites:", callSites, " with resolvable key arg:", resolvedKey);
console.log("unique keys:", keys.size);
console.log("sample keys:", JSON.stringify([...keys].slice(0, 40)));
console.log("key lengths:", JSON.stringify([...new Set([...keys].map((k) => k.length))].sort((a, b) => a - b)));
fs.writeFileSync("keys.json", JSON.stringify([...keys]));
