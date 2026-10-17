// Screenshot the LOCAL faphive app (watch page) at several widths.
// Usage: node tools/shotlocal.mjs <videoId> [tag]
import fs from "node:fs";
import puppeteer from "puppeteer";

const ID = process.argv[2] || "young-beauty-meets-huge-Vg8mEr";
const TAG = process.argv[3] || "cur";
const OUT = "/tmp/local";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";

const CONFIGS = {
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  laptop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
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
  // set age gate before app scripts run
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("faphive_age_ok", "1"); } catch {}
  });
  const log = [];
  page.on("console", (m) => log.push(m.type() + ": " + m.text().slice(0, 160)));
  page.on("pageerror", (e) => log.push("PAGEERROR: " + String(e).slice(0, 200)));
  try {
    await page.goto(`${BASE}/#v/${encodeURIComponent(ID)}`, { waitUntil: "networkidle2", timeout: 45000 });
  } catch (e) {
    log.push("goto: " + String(e).slice(0, 160));
  }
  // wait for the actual player (not the skeleton, which also has .watch__info)
  await page.waitForSelector(".player-stage", { timeout: 20000 }).catch(() => log.push("no player-stage"));
  await sleep(3500);
  // reveal the player chrome (it auto-hides while playing) just before the shot
  const stage = await page.$(".player-stage");
  if (stage) {
    const box = await stage.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2 + 4, box.y + box.height / 2 + 4);
    }
  }
  await sleep(400);
  const prefix = `${OUT}/${TAG}-${name}`;
  await page.screenshot({ path: `${prefix}-fold.png` });
  await page.screenshot({ path: `${prefix}-full.png`, fullPage: true });
  const geom = await page.evaluate(() => {
    const q = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    return {
      innerW: window.innerWidth, innerH: window.innerHeight, scrollH: document.body.scrollHeight,
      appbar: q(".app-bar"), stage: q(".watch__stage"), rail: q(".watch__rail"), info: q(".watch__info"),
      top: q(".watch__top"), player: q(".player-stage"), timeline: q(".x-timeline"), xtop: q(".x-top"),
      train: q(".watch__train"), sidebar: q(".sidebar"), container: q(".main--watch .container"),
    };
  });
  fs.writeFileSync(`${prefix}.geom.json`, JSON.stringify(geom, null, 1));
  console.log(`\n=== ${name} (${vp.width}x${vp.height}) ===`);
  console.log(JSON.stringify(geom));
  if (log.length) console.log("LOG:", log.slice(0, 8).join(" | "));
  await page.close();
}

await browser.close();
console.log("\nsaved to", OUT);
