// Computes design tokens from the live beeg.com chrome so FapHive can be
// restyled against the same numbers. Headless, images/media/fonts on the CDN
// blocked — this only reads computed styles of layout chrome (header, buttons,
// cards, chips, body text), never downloads thumbnails.
import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// keep the sandbox clean: no thumbnails/videos/posters, only chrome
await page.setRequestInterception(true);
page.on("request", (req) => {
  const u = req.resourceType();
  if (u === "image" || u === "media") req.abort().catch(() => {});
  else req.continue().catch(() => {});
});

const consoleNotes = [];
page.on("console", (m) => consoleNotes.push(m.text().slice(0, 120)));

try {
  await page.goto("https://beeg.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
} catch (err) {
  console.log("NAV_FAIL", String(err).slice(0, 200));
  await browser.close();
  process.exit(2);
}

await sleep(6000);

// the legal-age consent modal is part of the site flow; dismiss it plainly if present
await page.evaluate(() => {
  const t = [...document.querySelectorAll("button, a")]
    .find((b) => /18|enter|agree|yes|consent|accept/i.test(b.textContent || ""));
  if (t) t.click();
});
await sleep(1500);

// scroll to give lazy layout a chance to settle
await page.evaluate(() => window.scrollTo(0, 800));
await sleep(2000);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(1000);

const css = (el) => {
  if (!el) return null;
  const c = getComputedStyle(el);
  return {
    tag: el.tagName.toLowerCase(),
    cls: (el.className || "").toString().slice(0, 80),
    rect: (({ x, y, width, height }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }))(el.getBoundingClientRect()),
    font: c.fontFamily,
    fontSize: c.fontSize,
    lineHeight: c.lineHeight,
    fontWeight: c.fontWeight,
    letterSpacing: c.letterSpacing,
    textTransform: c.textTransform,
    color: c.color,
    background: c.backgroundColor,
    borderRadius: c.borderRadius,
    padding: c.padding,
    margin: c.margin,
    backdropFilter: c.backdropFilter,
    boxShadow: c.boxShadow.slice(0, 120),
    position: c.position,
    display: c.display,
    gap: c.gap,
    zIndex: c.zIndex,
  };
};

const data = await page.evaluate(() => {
  const out = { header: null, headerItems: [], navLinks: [], gridCards: [], durations: [], buttons: [], inputs: [], bodyFonts: {}, headings: [], misc: [] };

  const pick = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 100),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      font: c.fontFamily, fontSize: c.fontSize, lineHeight: c.lineHeight, fontWeight: c.fontWeight,
      letterSpacing: c.letterSpacing, textTransform: c.textTransform, color: c.color,
      background: c.backgroundColor, borderRadius: c.borderRadius, padding: c.padding, margin: c.margin,
      backdropFilter: c.backdropFilter, position: c.position, display: c.display, gap: c.gap,
      boxShadow: c.boxShadow.slice(0, 140), opacity: c.opacity,
    };
  };

  const body = document.body;
  const bc = getComputedStyle(body);
  out.bodyFonts = { font: bc.fontFamily, fontSize: bc.fontSize, lineHeight: bc.lineHeight, color: bc.color, background: bc.backgroundColor };
  const html = getComputedStyle(document.documentElement);
  out.bodyFonts.htmlBackground = html.backgroundColor;

  // header candidates: fixed bar at top
  const heads = [...document.querySelectorAll("header, nav, [class*='header'], [class*='navbar'], [class*='topbar'], [class*='head']")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 24 && r.height < 140 && r.top < 40 && Math.round(r.width) >= window.innerWidth - 2;
    })
    .slice(0, 6)
    .map(pick);
  out.header = heads;

  // buttons anywhere in the upper page
  out.buttons = [...document.querySelectorAll("button, [role='button']")]
    .slice(0, 30)
    .map(pick)
    .filter((b) => b && b.rect.h > 8);

  // inputs (search)
  out.inputs = [...document.querySelectorAll("input")].slice(0, 8).map(pick);

  // video tiles: links containing 16:9-ish boxes in the main area
  const sixteenNine = [...document.querySelectorAll("a, article, [class*='card'], [class*='thumb'], [class*='video']")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 140 && r.width < 700 && r.height > 60 && Math.abs(r.height / r.width - 0.5625) < 0.06;
    })
    .slice(0, 24)
    .map(pick);
  out.gridCards = sixteenNine;

  // duration-style small dark labels
  out.durations = [...document.querySelectorAll("span, div, p, small")]
    .filter((el) => /^\d{1,2}:\d{2}(\s*\/\s*\d{1,2}:\d{2})?$/.test((el.textContent || "").trim()) && el.children.length === 0)
    .slice(0, 12)
    .map(pick);

  // headings
  out.headings = [...document.querySelectorAll("h1, h2, h3, h4")].slice(0, 10).map(pick);

  // any fixed element near top (logo/search icons row)
  out.misc = [...document.querySelectorAll("*")]
    .filter((el) => {
      const s = getComputedStyle(el);
      return (s.position === "fixed" || s.position === "sticky") && el.getBoundingClientRect().top < 60;
    })
    .slice(0, 12)
    .map(pick);

  return out;
});

writeFileSync("/tmp/beeg-metrics.json", JSON.stringify({ url: page.url(), ...data, consoleNotes: consoleNotes.slice(0, 8) }, null, 2));
console.log("WROTE /tmp/beeg-metrics.json");
const b = data.bodyFonts || {};
console.log("body:", b.font, b.fontSize, "bg:", b.background, "htmlBg:", b.htmlBackground);
console.log("fixed elements:", data.misc.length, "header candidates:", (data.header || []).length);
console.log("buttons:", data.buttons.length, "cards:", data.gridCards.length, "durations:", data.durations.length);
await browser.close();
