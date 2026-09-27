import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const raw = fs.readFileSync("background.raw.js", "utf8");
const ast = parse(raw, { sourceType: "unambiguous", allowReturnOutsideFunction: true });

// const maps anywhere in the file
const maps = new Map();
traverse(ast, {
  VariableDeclarator(p) {
    const { id, init } = p.node;
    if (id.type !== "Identifier" || !init || init.type !== "ObjectExpression") return;
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
  },
});

function resolve(node) {
  if (!node) return undefined;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "NumericLiteral") return node.value;
  if (node.type === "MemberExpression" && node.object.type === "Identifier" && !node.computed) {
    const m = maps.get(node.object.name);
    const k = node.property.name;
    if (m && k in m) return m[k];
  }
  return undefined;
}

// wrappers: return <decoder>(<indexExpr>, <keyExpr>)
const wrappers = new Map();
traverse(ast, {
  FunctionDeclaration(p) {
    const body = p.node.body.body;
    if (body.length !== 1 || body[0].type !== "ReturnStatement") return;
    const ret = body[0].argument;
    if (!ret || ret.type !== "CallExpression" || ret.callee.type !== "Identifier") return;
    if (ret.arguments.length < 2) return;
    const params = p.node.params.map((x) => (x.type === "Identifier" ? x.name : null));
    const keyArg = ret.arguments[1];
    let keyIdx = -1;
    if (keyArg.type === "Identifier") keyIdx = params.indexOf(keyArg.name);
    wrappers.set(p.node.id.name, { decoder: ret.callee.name, keyIdx, params });
  },
});

console.log("wrappers:", wrappers.size);

const keys = new Map(); // key -> count
let callSites = 0;
let unresolvable = 0;
const sampleUnresolved = [];
traverse(ast, {
  CallExpression(p) {
    const callee = p.node.callee;
    if (callee.type !== "Identifier") return;
    const w = wrappers.get(callee.name);
    if (!w) return;
    callSites++;
    if (w.keyIdx < 0) {
      unresolvable++;
      if (sampleUnresolved.length < 5)
        sampleUnresolved.push({ wrapper: callee.name, args: p.node.arguments.length, snippet: p.node.start });
      return;
    }
    const v = resolve(p.node.arguments[w.keyIdx]);
    if (typeof v === "string") keys.set(v, (keys.get(v) ?? 0) + 1);
    else unresolvable++;
  },
});

console.log("call sites:", callSites, " unresolved keys:", unresolvable);
console.log("unique keys found:", keys.size);
console.log("sample unresolved:", JSON.stringify(sampleUnresolved));
const sorted = [...keys.entries()].sort((a, b) => b[1] - a[1]);
console.log("top keys:", JSON.stringify(sorted.slice(0, 20)));
console.log("length histogram:", JSON.stringify(sorted.reduce((a, [k, c]) => { const L = k.length; a[L] = (a[L] ?? 0) + c; return a; }, {})));
fs.writeFileSync("keys2.json", JSON.stringify([...keys.keys()]));
