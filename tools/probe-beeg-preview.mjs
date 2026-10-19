// Behavioral probe of beeg.com's trailer previews: measures how their own
// implementation behaves (element lifecycle, hover delay, resume, teardown,
// concurrency, touch autoplay) so FapHive can mirror the same mechanics.
// MP4 requests are allowed (needed for play events) but nothing is saved.
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = (k, d) => console.log(`${k}: ${JSON.stringify(d)}`);

const INSTRUMENT = `
  window.__probe = { events: [], videos: new Map(), mark(ev) {
    window.__probe.events.push({ id: null, ev, t: Math.round(performance.now()) });
  }, rec(el, ev) {
    let rec = window.__probe.videos.get(el);
    if (!rec) { rec = { id: 'v' + (window.__probe.videos.size + 1) }; window.__probe.videos.set(el, rec); }
    window.__probe.events.push({ id: rec.id, ev, t: Math.round(performance.now()) });
    return rec.id;
  }};
  const map = (el, ev) => el.addEventListener(ev, () => window.__probe.rec(el, ev), true);
  const io = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.tagName === 'VIDEO' && !n.__probeId) { n.__probeId = window.__probe.rec(n, 'created'); n.__probeMark(true); }
        else if (n.querySelector) [...n.querySelectorAll('video')].forEach(v => { if (!v.__probeId) { v.__probeId = window.__probe.rec(v, 'created'); v.__probeMark(true); } });
      }
      for (const n of m.removedNodes) {
        if (n.tagName === 'VIDEO' && n.__probeId) window.__probe.events.push({ id: n.__probeId, ev: 'removed', t: Math.round(performance.now()) });
      }
    }
  });
  io.observe(document.documentElement, { childList: true, subtree: true });
`;

const FIND_CARDS = `
  [...document.querySelectorAll('*')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 280 && r.width < 700 && Math.abs(r.height / r.width - 0.5625) < 0.06
      && r.top > 80 && r.bottom < 880 && el.offsetParent;
  }).slice(0, 6).map(el => ({ x: el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2, y: el.getBoundingClientRect().y + el.getBoundingClientRect().height / 2 }));
`;

async function bootDesktop() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--lang=en-US"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(INSTRUMENT);
  await page.setRequestInterception(true);
  page.on("request", (r) => { if (r.resourceType() === "image") r.abort().catch(() => {}); else r.continue().catch(() => {}); });
  await page.goto("https://beeg.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(5000);
  await page.evaluate(() => { const t = [...document.querySelectorAll("button,a")].find(b => /18|enter|yes/i.test(b.textContent || "")); if (t) t.click(); });
  await sleep(1500);
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await sleep(2500);
  return { browser, page };
}

const snapshot = (page) => page.evaluate(() =>
  [...document.querySelectorAll("video")].filter(v => v.__probeId).map(v => ({
    id: v.__probeId, playing: !v.paused && !v.ended, t: Math.round((v.currentTime || 0) * 10) / 10,
    inDoc: document.contains(v), preload: v.preload, loop: v.loop,
  })));

// ── desktop ──
{
  const { browser, page } = await bootDesktop();
  const boxes = await page.evaluate((s) => eval(s), FIND_CARDS);
  P("desktop cards on screen", boxes.length);

  if (boxes.length >= 1) {
    await page.mouse.move(boxes[0].x - 260, boxes[0].y);
    await sleep(200);
    await page.evaluate((b) => window.__probe.mark("enter-t0"), boxes[0]);
    await page.mouse.move(boxes[0].x, boxes[0].y);
    await sleep(5000);
    P("after hover tile#0 5s", await snapshot(page));

    // leave → teardown?
    await page.mouse.move(boxes[0].x, boxes[0].y);
    await page.evaluate(() => window.__probe.mark("leave-t0"));
    await page.mouse.move(200, 200);
    await sleep(1500);
    P("after leave tile#0", await snapshot(page));
    const evs = await page.evaluate(() => window.__probe.events);
    P("events (t0-relative)", evs.map(e => ({ ...e, t: e.t })));

    // re-hover: resume or restart?
    await page.mouse.move(boxes[0].x, boxes[0].y);
    await sleep(3000);
    const again = await snapshot(page);
    P("after re-hover tile#0", again);

    // teleport to tile#1: enter→play latency + does tile#0 (if running) stop?
    if (boxes.length >= 2) {
      await page.mouse.move(200, 200);
      await sleep(1500);
      await page.evaluate((b) => window.__probe.mark("enter-t1"), boxes[1]);
      await page.mouse.move(boxes[1].x, boxes[1].y);
      await sleep(6000);
      P("after hover tile#1 6s", await snapshot(page));
      const evs2 = await page.evaluate(() => window.__probe.events.filter(e => e.t > 0).slice(-18));
      P("recent events", evs2);
    }
  } else {
    P("debug", { url: page.url() });
  }

  // desktop idle scroll: no pointer over tiles
  await page.mouse.move(200, 200);
  await sleep(1200);
  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: "instant" }));
  await sleep(5000);
  P("desktop after plain scroll 5s (no hover)", await snapshot(page));
  await browser.close();
}

// ── touch ──
{
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(INSTRUMENT);
  await page.setRequestInterception(true);
  page.on("request", (r) => { if (r.resourceType() === "image") r.abort().catch(() => {}); else r.continue().catch(() => {}); });
  await page.goto("https://beeg.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(5000);
  await page.evaluate(() => { const t = [...document.querySelectorAll("button,a")].find(b => /18|enter|yes/i.test(b.textContent || "")); if (t) t.click(); });
  await sleep(1500);
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
  await sleep(2500);
  P("touch scroll #1 (idle)", await snapshot(page));
  await page.evaluate(() => window.scrollTo({ top: 1300, behavior: "instant" }));
  await sleep(4500);
  P("touch scroll #2 4.5s", await snapshot(page));
  const evs = await page.evaluate(() => window.__probe.events.slice(-14));
  P("touch events", evs);
  await browser.close();
}
