// Verifies the watch/player behaviour the user reported as glitching:
//  • tapping a card lands on the watch page with a stable top offset
//  • the offset does not change when the page is scrolled
//  • no brightness/volume swipe overlays and no volume slider exist
//  • the single volume button toggles mute
//  • tapping the video toggles the chrome but does not toggle playback
//  • a vertical swipe on the video scrolls the page instead of seeking
// usage: BASE=http://127.0.0.1:3000 node tools/playercheck.mjs
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});

function attach(page, bucket) {
  page.on("pageerror", (e) => bucket.push("pageerror: " + String(e).slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() === "error") bucket.push("console: " + m.text().slice(0, 160));
  });
}

async function desktop() {
  const errors = [];
  const page = await browser.newPage();
  attach(page, errors);
  await page.setUserAgent(DESKTOP_UA);
  await page.setViewport({ width: 1920, height: 1080 });
  await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
  await page.goto(`${BASE}/#/`, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(2500);

  // click the first tile like a user would
  await page.click(".unit__media");
  await page.waitForSelector(".player-stage", { timeout: 15000 });
  await sleep(2500);

  const before = await page.evaluate(() => {
    const stage = document.querySelector(".player-stage");
    const main = document.querySelector(".main--watch");
    const v = document.querySelector("video.x-player__video");
    return {
      hash: location.hash,
      mainPaddingTop: getComputedStyle(main).paddingTop,
      stage: stage && stage.getBoundingClientRect().toJSON(),
      videoDuration: v ? v.duration : null,
      readyState: v ? v.readyState : null,
      autoplayBlocked: v ? v.paused : null,
      rangeInputs: document.querySelectorAll(".player-stage input[type=range]").length,
      gestureOverlays: document.querySelectorAll(".x-vb, .x-vol").length,
      topButtons: [...document.querySelectorAll(".x-top .x-btn")].map((b) => b.getAttribute("aria-label")),
      stageChildren: document.querySelector(".player-stage")?.children.length,
    };
  });
  log("\n[desktop] after clicking a tile:", JSON.stringify(before, null, 1));

  // scroll the page: the watch offset must not move
  await page.evaluate(() => window.scrollTo(0, 400));
  await sleep(600);
  const after = await page.evaluate(() => {
    const stage = document.querySelector(".player-stage");
    return {
      mainPaddingTop: getComputedStyle(document.querySelector(".main--watch")).paddingTop,
      stageTop: stage.getBoundingClientRect().top,
      scrollY: window.scrollY,
    };
  });
  log("[desktop] after scrolling 400px:", JSON.stringify(after));
  log("[desktop] padding stable:", before.mainPaddingTop === after.mainPaddingTop);

  // volume button = mute toggle, no slider
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  const muteTest = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll(".x-top .x-btn")].find((b) => /mute/i.test(b.getAttribute("aria-label") || ""));
    if (!btn) return { found: false };
    const v = document.querySelector("video.x-player__video");
    const first = { label: btn.getAttribute("aria-label"), pressed: btn.getAttribute("aria-pressed"), muted: v.muted };
    btn.click();
    await new Promise((r) => setTimeout(r, 120));
    const second = { label: btn.getAttribute("aria-label"), pressed: btn.getAttribute("aria-pressed"), muted: v.muted };
    return { found: true, first, second };
  });
  log("[desktop] volume button:", JSON.stringify(muteTest));
  log("[desktop] errors:", errors.length, errors.slice(0, 3));
  await page.close();
}

async function mobile() {
  const errors = [];
  const page = await browser.newPage();
  attach(page, errors);
  await page.setUserAgent(MOBILE_UA);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
  await page.goto(`${BASE}/#/`, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(2500);

  const card = await page.$(".unit__media");
  const box = await card.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForSelector(".player-stage", { timeout: 15000 });
  await sleep(2500);

  const start = await page.evaluate(() => {
    const v = document.querySelector("video.x-player__video");
    const stage = document.querySelector(".player-stage");
    return {
      hash: location.hash,
      paused: v.paused,
      duration: v.duration,
      readyState: v.readyState,
      ui: stage.className,
      stageRect: stage.getBoundingClientRect().toJSON(),
      hasRange: !!document.querySelector(".player-stage input[type=range]"),
    };
  });
  log("\n[mobile] after tapping a tile:", JSON.stringify(start, null, 1));

  // single tap on the video surface → chrome toggles, playback unchanged
  const r = start.stageRect;
  await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
  await sleep(500);
  const afterTap = await page.evaluate(() => {
    const v = document.querySelector("video.x-player__video");
    const stage = document.querySelector(".player-stage");
    return { paused: v.paused, ui: stage.className, showUI: stage.className.includes("player-stage--ui") };
  });
  log("[mobile] after single tap:", JSON.stringify(afterTap));
  log("[mobile] playback unchanged by tap:", start.paused === afterTap.paused);

  // pause first so natural playback cannot mask a seek
  await page.evaluate(() => {
    const v = document.querySelector("video.x-player__video");
    if (!v.paused) v.pause();
  });
  await sleep(300);

  const stageRect = async () =>
    await page.evaluate(() => {
      const el = document.querySelector(".player-stage");
      return el ? el.getBoundingClientRect().toJSON() : null;
    });
  const time = async () =>
    await page.evaluate(() => {
      const v = document.querySelector("video.x-player__video");
      return v ? v.currentTime : null;
    });
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) log("[mobile] navigated →", f.url().slice(0, 120));
  });
  const state = async () =>
    await page.evaluate(() => ({
      url: location.href.slice(0, 120),
      hash: location.hash,
      scrollY: window.scrollY,
      players: document.querySelectorAll("video.x-player__video").length,
      stage: !!document.querySelector(".player-stage"),
      skeleton: !!document.querySelector(".watch__stage"),
      body: document.body.innerText.slice(0, 70).replace(/\n/g, " | "),
    }));
  const reset = async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
  };

  // vertical swipe on the video → page scrolls, no seek, no overlay
  const s = await stageRect();
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  const tBeforeV = await time();
  await page.touchscreen.touchStart(cx, cy + 80);
  for (let i = 1; i <= 10; i++) {
    await page.touchscreen.touchMove(cx, cy + 80 - i * 18);
    await sleep(16);
  }
  await page.touchscreen.touchEnd();
  await sleep(900);
  const afterV = await page.evaluate(() => ({
    t: document.querySelector("video.x-player__video").currentTime,
    y: window.scrollY,
    overlay: document.querySelectorAll(".x-vb, .x-vol").length,
    dragTime: !!document.querySelector(".x-drag-time.show"),
  }));
  log("[mobile] vertical swipe:", JSON.stringify({ tBeforeV, afterV }));
  log("[mobile] page scrolled & seek suppressed:", afterV.y > 50 && Math.abs(afterV.t - tBeforeV) < 0.3);
  log("[mobile] state after vertical swipe:", JSON.stringify(await state()));

  // horizontal drag must not seek nor navigate away (it used to trigger
  // Chromium's swipe-back and leave the page)
  await reset();
  const s2 = await stageRect();
  if (!s2) {
    log("[mobile] player vanished — skipping tap checks");
    log("[mobile] errors:", errors.length, errors.slice(0, 3));
    await page.close();
    return;
  }
  const c2x = s2.x + s2.width / 2;
  const c2y = s2.y + s2.height / 2;
  const tBeforeH = await time();
  await page.touchscreen.touchStart(c2x - 120, c2y);
  for (let i = 1; i <= 12; i++) {
    await page.touchscreen.touchMove(c2x - 120 + i * 18, c2y);
    await sleep(16);
  }
  await page.touchscreen.touchEnd();
  await sleep(800);
  const afterH = await time();
  log("[mobile] horizontal drag:", JSON.stringify({ tBeforeH, afterH }));
  log("[mobile] after horizontal drag (still on page):", JSON.stringify(await state()));
  log("[mobile] drag did not seek:", afterH !== null && Math.abs(afterH - tBeforeH) < 0.3);

  // double tap → ±10s pulse
  await reset();
  const s3 = await stageRect();
  if (!s3) {
    log("[mobile] no player for the double-tap check");
    await page.close();
    return;
  }
  const tx = s3.x + s3.width * 0.75;
  const ty = s3.y + s3.height / 2;
  const t0 = await time();
  await page.touchscreen.tap(tx, ty);
  await sleep(120);
  await page.touchscreen.tap(tx, ty);
  await sleep(500);
  const dbl = await page.evaluate(() => ({
    t: document.querySelector("video.x-player__video").currentTime,
    pulse: !!document.querySelector(".x-pulse"),
    hash: location.hash,
  }));
  log("[mobile] double tap right side:", JSON.stringify(dbl), "delta:", (dbl.t - t0).toFixed(2));

  const layout = await page.evaluate(() => {
    const main = document.querySelector(".main--watch");
    return { paddingTop: getComputedStyle(main).paddingTop, scrollY: window.scrollY };
  });
  log("[mobile] watch padding:", JSON.stringify(layout));
  log("[mobile] errors:", errors.length, errors.slice(0, 3));
  await page.close();
}

await desktop();
await mobile();
await browser.close();
