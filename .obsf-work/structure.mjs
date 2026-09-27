import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;

const file = process.argv[2] ?? "out/deobfuscated.js";
const code = fs.readFileSync(file, "utf8");
const ast = parse(code, { sourceType: "unambiguous" });

function calleeName(c) {
  if (!c) return null;
  if (c.type === "Identifier") return c.name;
  if (c.type === "MemberExpression") {
    const o = c.object.type === "Identifier" ? c.object.name : "(expr)";
    const p = c.computed ? "[computed]" : c.property.name;
    return `${o}.${p}`;
  }
  return "(expr)";
}

const rows = [];
traverse(ast, {
  FunctionDeclaration(p) {
    if (p.parent.type !== "Program") return;
    rows.push([p.node.loc.start.line, p.node.async ? "async fn" : "fn", p.node.id?.name ?? "(anon)"]);
  },
  ClassDeclaration(p) {
    if (p.parent.type !== "Program") return;
    rows.push([p.node.loc.start.line, "class", p.node.id?.name ?? "(anon)"]);
  },
  VariableDeclaration(p) {
    if (p.parent.type !== "Program") return;
    for (const d of p.node.declarations) {
      if (d.id.type === "Identifier") rows.push([d.loc.start.line, "const", d.id.name]);
    }
  },
  ExpressionStatement(p) {
    if (p.parent.type !== "Program") return;
    const e = p.node.expression;
    if (e.type === "CallExpression") {
      const n = calleeName(e.callee);
      if (n) rows.push([p.node.loc.start.line, "call", n]);
    } else if (e.type === "AssignmentExpression") {
      const n = calleeName(e.right) || e.left.type;
      rows.push([p.node.loc.start.line, "assign", n]);
    }
  },
});

rows.sort((a, b) => a[0] - b[0]);
for (const [line, kind, name] of rows) {
  console.log(String(line).padStart(5) + "  " + kind.padEnd(8) + " " + name);
}
