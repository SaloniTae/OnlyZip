// Layout audit for the refined UI. Reports, per route and width:
//  - horizontal overflow of the document
//  - whether the first rail heading / chip lines up with the content column
//  - interactive elements smaller than 32px (touch targets)
//  - text clipped by its own box (scrollWidth > clientWidth) outside the
//    intentional scrollers
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["#/", "#search", "#studio/dacada-com", "#v/ac5t-madvr-2Mab"];
const WIDTHS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1440, height: 900 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});

for (const route of ROUTES) {
  for (const vp of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem("faphive_age_ok", "1");
      } catch {}
    });
    if (route === "#search") {
      // the search panel is an overlay: open it and type so the suggestion list renders
      await page.evaluateOnNewDocument(() => {
        window.addEventListener("DOMContentLoaded", () => {
          const t = setInterval(() => {
            const el = document.querySelector(".search-input");
            if (el) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              setter.call(el, "mia");
              el.dispatchEvent(new Event("input", { bubbles: true }));
              clearInterval(t);
            }
          }, 200);
        });
      });
    }
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(`${BASE}/${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(route === "#search" ? ".search-panel" : ".unit, .watch, .creator-head", { timeout: 45000 }).catch(() => {});
    await sleep(2500);

    const report = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight * 4;
      };
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;

      // touch targets
      const small = [];
      for (const el of document.querySelectorAll("button, a")) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 32 || r.height < 32) {
          small.push({
            el: el.className || el.tagName,
            w: Math.round(r.width),
            h: Math.round(r.height),
            text: (el.textContent || "").trim().slice(0, 24),
          });
        }
      }

      // clipped text (ignore horizontal scrollers, which are intentional)
      const clipped = [];
      for (const el of document.querySelectorAll("div, span, p, h1, h2, h3")) {
        if (!visible(el)) continue;
        const style = getComputedStyle(el);
        if (style.overflowX !== "hidden" && !/ellipsis/.test(style.textOverflow)) continue;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          clipped.push({ el: el.className || el.tagName, text: (el.textContent || "").trim().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth });
        }
      }

      // alignment: first rail heading/chip vs the grid's left edge
      const grid = document.querySelector(".grid .unit");
      const firstChip = document.querySelector(".top-block .chip");
      const railHead = document.querySelector(".rail-head__title");
      const left = (el) => (el ? Math.round(el.getBoundingClientRect().left) : null);
      return {
        overflowX,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        gridLeft: left(grid),
        chipLeft: left(firstChip),
        railHeadLeft: left(railHead),
        small: small.slice(0, 12),
        smallCount: small.length,
        clipped: clipped.slice(0, 8),
        clippedCount: clipped.length,
      };
    });

    console.log(`\n== ${route} @ ${vp.name} (${vp.width}) ==`);
    console.log("  overflowX:", report.overflowX, `(scrollW ${report.scrollW} / innerW ${report.innerW})`);
    console.log("  lefts — grid:", report.gridLeft, "chip:", report.chipLeft, "railHead:", report.railHeadLeft);
    if (report.smallCount) console.log("  small targets:", report.smallCount, JSON.stringify(report.small));
    if (report.clippedCount) console.log("  clipped text:", report.clippedCount, JSON.stringify(report.clipped));
    if (errors.length) console.log("  errors:", errors.slice(0, 4));
    await page.close();
  }
}

await browser.close();
