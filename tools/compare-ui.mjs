// Reads the live FapHive DOM the same way measure-beeg.mjs reads beeg.com and
// diffs the two sets of computed styles. Media/images are blocked, so only
// layout chrome (fonts, geometry, colors) ever enters the measurement.
// Run: node tools/compare-ui.mjs [browse|watch|both]
import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";

// ── beeg reference (measured live at 1440×900 by tools/measure-beeg*.mjs) ──
const BEEG = {
  bodyFont: "Roboto", bodyFontSize: "16px", bodyLineHeight: "24px",
  htmlBg: "rgb(2, 4, 8)",
  headerH: 48, headerPadTop: 0, headerPadLeft: 0, headerPadRight: 0, // flex row, brand pad handled inside
  brandPadL: 12, brandNegL: -12, logoH: 32,
  iconBtn: 48, iconGly: 20, iconRadius: "9999px",
  frostSidebarW: 73, frostSidebarBg: "rgba(2, 4, 8, 0.75)",
  frostSidebarBlur: "saturate(1.8) blur(20px)",
  containerPadL: 96, containerPadR: 48, gapX: 16, cardW: 312, cardH: 176,
  digitsFont: '"SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  durFont: "14px", durPad: "5px 8px", durRadius: "0px", durY: 8, durX: 8,
  contentBtn: 36, contentBtnGly: 20, frostBtnBg: "rgba(0, 0, 0, 0.24)",
  frostBtnBlur: "saturate(1.8) blur(12px)",
  tileBody12: "12px", tileBody12Color: "rgba(245, 250, 255, 0.4)",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.env.BASE || "http://127.0.0.1:3000";

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
await page.setRequestInterception(true);
page.on("request", (req) => {
  const t = req.resourceType();
  if (t === "image" || t === "media") req.abort().catch(() => {});
  else req.continue().catch(() => {});
});

await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(".unit__media", { timeout: 30000 });
await sleep(1200);

const metrics = await page.evaluate(() => {
  const packed = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el), r = el.getBoundingClientRect();
    return {
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      font: c.fontFamily, fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight,
      color: c.color, bg: c.backgroundColor, radius: c.borderRadius, pad: c.padding,
      blur: c.backdropFilter, ls: c.letterSpacing, gap: c.gap,
      svg: (() => { const s = el?.querySelector("svg"); if (!s) return null; const b = s.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; })(),
      marL: c.marginLeft,
    };
  };
  const out = {};
  const body = getComputedStyle(document.body);
  out.body = { font: body.fontFamily, fs: body.fontSize, lh: body.lineHeight };
  out.htmlBg = getComputedStyle(document.documentElement).backgroundColor;
  out.header = packed(document.querySelector(".app-bar"));
  out.brand = packed(document.querySelector(".brand"));
  out.brandImg = packed(document.querySelector(".brand img"));
  out.iconBtns = [...document.querySelectorAll(".app-bar .icon-btn")].slice(0, 3).map(packed);
  out.sidebar = packed(document.querySelector(".sidebar"));
  out.container = packed(document.querySelector(".container"));
  const media = document.querySelector(".unit__media");
  out.card = packed(media);
  out.cardImg = packed(media?.querySelector("img"));
  out.dur = packed(document.querySelector(".unit__amount"));
  out.durTitle = packed(document.querySelector(".unit__title"));
  out.tileMeta = packed(document.querySelector(".unit__line1"));
  out.chip = packed(document.querySelector(".chip--sm"));
  out.gridGap = packed(document.querySelector(".container .grid"));
  if (out.dur) {
    const mr = document.querySelector(".unit__media").getBoundingClientRect();
    const dr = document.querySelector(".unit__amount").getBoundingClientRect();
    out.durPos = { x: Math.round(dr.x - mr.x), y: Math.round(dr.y - mr.y), dw: Math.round(dr.width), cw: Math.round(mr.width) };
  }
  return out;
});

// ── pairwise diff ──
const norm = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v);
const rows = [];
const cmp = (what, got, want, fn = (a, b) => (norm(a) === norm(b) ? 1 : 0)) => {
  const ok = fn(got, want);
  rows.push({ what, ok, got, want });
  return ok;
};
const numEq = () => (a, b) => (a === b ? 1 : 0);

cmp("body font", metrics.body?.font?.split(",")[0], BEEG.bodyFont);
cmp("body font-size", metrics.body?.fs, BEEG.bodyFontSize, numEq());
cmp("body line-height", metrics.body?.lh, BEEG.bodyLineHeight, numEq());
cmp("html background", metrics.htmlBg, BEEG.htmlBg);
cmp("header height", metrics.header?.rect[3], BEEG.headerH, numEq());
cmp("header fixed", metrics.header?.rect[1], 0, numEq());
cmp("brand pad", metrics.brand?.pad, `0px 12px`);
cmp("brand img h", metrics.brandImg?.rect[3], BEEG.logoH, numEq());
cmp("header icon btn size", metrics.iconBtns?.[0]?.rect[2], BEEG.iconBtn, numEq());
cmp("header icon glyph", metrics.iconBtns?.[0]?.svg?.[0], BEEG.iconGly, numEq());
cmp("icon btn radius", metrics.iconBtns?.[0]?.radius, BEEG.iconRadius);
cmp("sidebar bg", metrics.sidebar?.bg, BEEG.frostSidebarBg);
cmp("sidebar blur", metrics.sidebar?.blur, BEEG.frostSidebarBlur);
cmp("card width", metrics.card?.rect[2], BEEG.cardW, numEq());
cmp("card height", metrics.card?.rect[3], BEEG.cardH, numEq());
cmp("grid column gap", metrics.gridGap?.gap, `${BEEG.gapX}px normal`, (a, b) => (norm(a).includes("16px") === norm(b).includes("16px") ? 1 : 0));
cmp("container padLeft (card x)", metrics.card?.rect[0], BEEG.containerPadL, numEq());
cmp("duration font", metrics.dur?.font, BEEG.digitsFont);
cmp("duration size", metrics.dur?.fs, BEEG.durFont, numEq());
cmp("duration padding", metrics.dur?.pad, BEEG.durPad);
cmp("duration right inset", metrics.dur ? metrics.durPos.cw - metrics.durPos.x - metrics.durPos.dw : null, BEEG.durX, numEq());
cmp("duration top inset", metrics.dur ? metrics.durPos.y : null, BEEG.durY, numEq());
cmp("grid title size", metrics.durTitle?.fs, "14px", numEq());
cmp("tile meta size/color", metrics.tileMeta?.fs, BEEG.tileBody12, numEq());

const passed = rows.filter((r) => r.ok).length;
for (const r of rows) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.what}  got=${JSON.stringify(r.got)} want=${JSON.stringify(r.want)}`);
console.log(`\nfapHive vs beeg: ${passed}/${rows.length} exact = ${(100 * passed / rows.length).toFixed(1)}%`);
writeFileSync("/tmp/faphive-metrics.json", JSON.stringify(metrics, null, 2));
await browser.close();
process.exit(passed === rows.length ? 0 : 1);
