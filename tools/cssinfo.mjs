// Prints CSS rules matching given patterns, annotated with their enclosing @media query.
import fs from "node:fs";

const file = process.argv[2] || "/tmp/beeg.css";
const patterns = process.argv.slice(3);
const css = fs.readFileSync(file, "utf8");

// Split top-level blocks while tracking @media nesting
const rules = [];
let i = 0;
const stack = [];
while (i < css.length) {
  const open = css.indexOf("{", i);
  if (open === -1) break;
  const prelude = css.slice(i, open).trim();
  const close = css.indexOf("}", open);
  if (close === -1) break;
  const body = css.slice(open + 1, close);
  if (prelude.startsWith("@media") || prelude.startsWith("@supports") || prelude.startsWith("@container")) {
    stack.push(prelude);
    i = open + 1;
    continue;
  }
  if (prelude === "") {
    // closing brace of a media block
    stack.pop();
    i = close + 1;
    continue;
  }
  rules.push({ media: stack.join(" && "), selector: prelude, body });
  i = close + 1;
  // skip stray closing braces
  while (css[i] === "}") {
    stack.pop();
    i++;
  }
}

const out = [];
for (const r of rules) {
  if (!patterns.some((p) => r.selector.includes(p) || r.body.includes(p))) continue;
  out.push(`${r.media ? r.media + "  ==>  " : ""}${r.selector}{${r.body}}`);
}
console.log(out.join("\n"));
console.log(`\n[${out.length} matching rules of ${rules.length}]`);
