// Prints a readable UI report from tools/probe.mjs output.
import fs from "node:fs";

const file = process.argv[2];
const j = JSON.parse(fs.readFileSync(file, "utf8"));
const s = (v, n = 90) => (typeof v === "string" ? v.slice(0, n) : v);
const R = (r) => (r ? `${r.x},${r.y} ${r.w}x${r.h}` : "-");
const skip = new Set(["position", "display", "flexDirection", "alignItems", "justifyContent", "transform", "objectFit", "opacity", "overflow", "width", "height"]);
const S = (st, n = 8) =>
  Object.entries(st || {})
    .filter(([k]) => !skip.has(k))
    .slice(0, n)
    .map(([k, v]) => `${k}=${s(v, 60)}`)
    .join(" ");

console.log(`### ${file}  viewport=${j.viewport.w}x${j.viewport.h} dpr=${j.dpr} scroll=${j.scrollHeight}`);
console.log(`body/html class: ${s(j.bodyClass, 200)}`);
console.log(`\n## HEADER ${R(j.header?.rect)} ${s(j.header?.cls, 60)}`);
console.log("   " + S(j.header?.st, 6));
for (const k of j.headerKids || []) {
  console.log(`   - ${k.tag} ${R(k.rect)} ${s(k.cls, 70)} ${S(k.st, 5)}`);
  for (const kk of (k.kids || []).slice(0, 5)) console.log(`       . ${kk.tag} ${R(kk.rect)} ${s(kk.cls, 60)}`);
}

if (j.grid) {
  console.log(`\n## GRID ${R(j.grid.rect)} cols="${s(j.grid.st.gridTemplateColumns, 120)}" gap=${j.grid.st.gap} cards=${j.cardCount}`);
  console.log(`   host ${R(j.gridHost?.rect)} ${s(j.gridHost?.cls, 60)} pad=${j.gridHost?.st.padding}`);
}
for (const [i, c] of (j.cards || []).entries()) {
  console.log(`\n## CARD ${i} col=${R(c.col)}`);
  console.log(`   media ${R(c.media?.rect)} pad=${c.media?.st.paddingTop} br=${c.media?.st.borderRadius}`);
  console.log(`   amount ${R(c.amount?.rect)} "${s(c.amount?.text, 12)}" ${S(c.amount?.st, 8)}`);
  console.log(`   avatar ${R(c.avatar?.rect)} ${s(c.avatar?.cls, 60)}`);
  console.log(`   title  ${R(c.title?.rect)} "${s(c.title?.text, 50)}" ${S(c.title?.st, 6)}`);
  console.log(`   info   ${R(c.info?.rect)} ${s(c.info?.cls, 60)} pad=${c.info?.st.padding}`);
  for (const k of (c.info?.kids || []).slice(0, 6)) console.log(`      . ${k.tag} ${R(k.rect)} "${s(k.text, 40)}" ${S(k.st, 6)}`);
  for (const b of c.buttons || []) console.log(`   btn ${R(b.rect)} ${S(b.st, 5)}`);
}

if (j.plates?.length) {
  console.log("\n## PLATE (creator tile)");
  for (const p of j.plates.slice(0, 1)) {
    console.log(`   ${R(p.rect)} ${s(p.cls, 150)}`);
    for (const k of p.kids || []) console.log(`      . ${k.tag} ${R(k.rect)} ${s(k.cls, 80)}`);
  }
}

if (j.fixed?.length) {
  console.log("\n## FIXED/STICKY");
  for (const f of j.fixed) console.log(`   ${f.tag} ${R(f.rect)} z=${f.st.zIndex} bg=${f.st.backgroundColor} bf=${s(f.st.backdropFilter, 40)} t="${s(f.text, 70)}" ${s(f.cls, 70)}`);
}

if (j.headings?.length) {
  console.log("\n## HEADINGS");
  for (const h of j.headings) console.log(`   ${h.tag} ${R(h.rect)} fs=${h.st.fontSize} fw=${h.st.fontWeight} lh=${h.st.lineHeight} c=${h.st.color} "${s(h.text, 60)}"`);
}

if (j.textButtons?.length) {
  console.log("\n## TEXT BUTTONS");
  for (const b of j.textButtons.slice(0, 16)) console.log(`   ${R(b.rect)} fs=${b.st.fontSize} bg=${b.st.backgroundColor} br=${b.st.borderRadius} "${s(b.text, 40)}"`);
}

if (j.video) {
  console.log(`\n## VIDEO ${R(j.video.rect)}`);
  for (const v of j.videoChain || []) console.log(`   ^ ${v.tag} ${R(v.rect)} ${s(v.cls, 80)} bg=${v.st.backgroundColor} br=${v.st.borderRadius}`);
  console.log("   siblings:");
  for (const v of j.playerSiblings || []) console.log(`     - ${v.tag} ${R(v.rect)} ${s(v.cls, 80)} bg=${v.st.backgroundColor} "${s(v.text, 60)}"`);
}

if (j.footer) {
  console.log(`\n## FOOTER ${R(j.footer.rect)} ${s(j.footer.cls, 60)}`);
  console.log("   " + (j.footerLinks || []).map((l) => l.text).join(" | ").slice(0, 400));
}
console.log(`bottomNav=${j.hasBottomNav}`);
