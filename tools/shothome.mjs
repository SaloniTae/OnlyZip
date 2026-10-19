// Screenshot the LOCAL faphive home page (and any hash route) at several widths.
// Usage: node tools/shothome.mjs [hash] [tag]
import fs from "node:fs";
import puppeteer from "puppeteer";

const HASH = process.argv[2] || "#/";
const TAG = process.argv[3] || "home";
const OUT = "/tmp/local";
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://127.0.0.1:3000";

const CONFIGS = {
  desktop: { width: 1600, height: 1000, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});

for (const [name, vp] of Object.entries(CONFIGS)) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const log = [];
  page.on("console", (m) => {
    if (m.type() === "error") log.push("console: " + m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => log.push("PAGEERROR: " + String(e).slice(0, 200)));
  await page.goto(`${BASE}/${HASH}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 45000 }).catch(() => log.push("no .unit"));
  await sleep(3000);
  await page.screenshot({ path: `${OUT}/${TAG}-${name}-fold.png` });
  await page.screenshot({ path: `${OUT}/${TAG}-${name}-full.png`, fullPage: true });
  const geom = await page.evaluate(() => {
    const q = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      appbar: q(".app-bar"),
      barInner: q(".app-bar__inner"),
      chips: q(".chips"),
      creators: q(".creator-rail, .rail--creators, .creator-row"),
      grid: q(".grid"),
      firstCard: q(".unit"),
      avatar: (() => {
        const a = document.querySelector(".unit__avatar img");
        if (!a) return null;
        const r = a.getBoundingClientRect();
        return { src: a.getAttribute("src")?.slice(0, 90), w: Math.round(r.width), h: Math.round(r.height) };
      })(),
      firstThumb: (() => {
        const t = document.querySelector(".unit__img");
        if (!t) return null;
        const r = t.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })(),
      sections: [...document.querySelectorAll(".section-title")].slice(0, 6).map((e) => e.textContent),
      errors: [],
    };
  });
  console.log(name, JSON.stringify({ ...geom, log }, null, 1));
  await page.close();
}

await browser.close();
