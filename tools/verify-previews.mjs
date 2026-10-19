// Trailer preview priority on touch viewports.
//
// The behaviour under test: only the thumbnail nearest the middle of the
// viewport plays, at most one more is buffered ahead of it (two on tablets),
// tiles outside the viewport pull nothing, and a tile that comes into view
// after being buffered starts playing without a visible loading step.
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
// the watch Page is exercised too, so a real video id is fetched below
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d) => {
  results.push({ n, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  " + JSON.stringify(d) : ""}`);
};

const LAUNCH = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
};

const VIDEO_STATE = `(() => {
  const tiles = [...document.querySelectorAll('.unit')];
  const vh = window.innerHeight;
  const state = tiles.map((tile, i) => {
    const media = tile.querySelector('.unit__media');
    const video = tile.querySelector('video');
    const r = media.getBoundingClientRect();
    return {
      i,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      height: Math.round(r.height),
      centre: Math.round((r.top + r.bottom) / 2),
      hasVideo: !!video,
      playing: !!video && !video.paused && !video.ended,
      readyState: video ? video.readyState : -1,
      currentTime: video ? Math.round(video.currentTime * 10) / 10 : -1,
      visible: r.bottom > 0 && r.top < vh,
      distanceToCentre: Math.round(Math.abs((r.top + r.bottom) / 2 - vh / 2)),
      viaScheduler: tile.dataset.preview !== undefined,
    };
  });
  return {
    vh,
    total: tiles.length,
    withVideo: state.filter((s) => s.hasVideo).length,
    playing: state.filter((s) => s.playing).length,
    visibleWithVideo: state.filter((s) => s.visible && s.hasVideo).length,
    playingTiles: state.filter((s) => s.playing),
    visible: state.filter((s) => s.visible),
    offscreenWithVideo: state.filter((s) => !s.visible && s.hasVideo).length,
  };
})()`;

async function open(width, height) {
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
  page.on("request", (r) => {
    if (/\.mp4(\?|$)/.test(r.url())) requests.push(r.url().split("/").pop());
  });
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(3500);
  return { browser, page, errors, requests };
}

// ── phone ──
{
  const { browser, page, errors } = await open(390, 844);
  const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  check("phone viewport reports a coarse pointer (touch path active)", coarse, { coarse });

  const st = await page.evaluate(VIDEO_STATE);
  check("phone: exactly one trailer plays at a time", st.playing === 1, { playing: st.playing, playingTiles: st.playingTiles.map((t) => t.i) });
  check("phone: at most one extra trailer is buffered ahead", st.withVideo <= 2, { withVideo: st.withVideo, total: st.total });
  check("phone: nothing outside the viewport is loading", st.offscreenWithVideo === 0, { offscreen: st.offscreenWithVideo });

  // the playing tile must be the one nearest the middle of the viewport
  const nearest = st.visible.slice().sort((a, b) => a.distanceToCentre - b.distanceToCentre)[0];
  check(
    "phone: the trailer nearest the viewport centre is the one playing",
    !!nearest && st.playingTiles.some((t) => t.i === nearest.i),
    { nearest: nearest?.i, distance: nearest?.distanceToCentre, playing: st.playingTiles.map((t) => ({ i: t.i, d: t.distanceToCentre })) },
  );

  // scroll further down: priority must follow the viewport, not the page order
  await page.evaluate(() => window.scrollTo({ top: window.scrollY + window.innerHeight * 2.2 }));
  await sleep(1200);
  const after = await page.evaluate(VIDEO_STATE);
  const nearest2 = after.visible.slice().sort((a, b) => a.distanceToCentre - b.distanceToCentre)[0];
  check(
    "phone: after scrolling, only the newly centred tile plays",
    after.playing === 1 && !!nearest2 && after.playingTiles.some((t) => t.i === nearest2.i),
    { playing: after.playing, nearest: nearest2?.i, playingTiles: after.playingTiles.map((t) => t.i) },
  );
  check("phone: still nothing loading off-screen after scrolling", after.offscreenWithVideo === 0, { offscreen: after.offscreenWithVideo });

  // a buffered tile should start quickly when it becomes the centre one
  const start = Date.now();
  const started = await page.evaluate(async () => {
    const vh = window.innerHeight;
    const tiles = [...document.querySelectorAll(".unit")];
    // pick the tile just below the current centre one and scroll it into the middle
    const target = tiles.find((t) => {
      const r = t.querySelector(".unit__media").getBoundingClientRect();
      const c = (r.top + r.bottom) / 2;
      return c > vh * 0.7 && c < vh * 1.6;
    });
    if (!target) return null;
    const r = target.querySelector(".unit__media").getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + (r.top + r.bottom) / 2 - vh / 2, behavior: "instant" });
    const startedAt = performance.now();
    for (let i = 0; i < 60; i++) {
      await new Promise((res) => setTimeout(res, 50));
      const v = target.querySelector("video");
      if (v && !v.paused && v.readyState >= 2) return Math.round(performance.now() - startedAt);
    }
    return -1;
  });
  check("phone: a buffered neighbour starts playing quickly when it comes into view", started !== null && started >= 0 && started < 900, { ms: started });
  // thumbnails first: a trailer element may only have a src once the tile's
  // still image has finished loading — the picture is always first priority
  const thumbsFirst = await page.evaluate(() =>
    [...document.querySelectorAll(".unit__media video")].every((v) => {
      const img = v.closest(".unit__media")?.querySelector("img");
      return !img || img.complete;
    }),
  );
  check("phone: thumbnail first — no trailer fetches before its still image loaded", thumbsFirst);
  check("phone: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── tablet: 2x2 tiles are visible at once ──
{
  const { browser, page, errors } = await open(768, 1024);
  const st = await page.evaluate(VIDEO_STATE);
  check("tablet: a 2x2 grid is visible at once", st.visible.length >= 4, { visible: st.visible.length });
  check("tablet: at most two trailers play at once", st.playing <= 2 && st.playing >= 1, { playing: st.playing });
  check("tablet: buffering stays bounded", st.withVideo <= 4, { withVideo: st.withVideo });
  check("tablet: nothing outside the viewport is loading", st.offscreenWithVideo === 0, { offscreen: st.offscreenWithVideo });
  const playing1 = await page.evaluate(VIDEO_STATE);
  await sleep(1500);
  const playing2 = await page.evaluate(VIDEO_STATE);
  check(
    "tablet: the playing set is stable (no churn)",
    playing1.playing === playing2.playing && playing2.playingTiles.every((t) => t.currentTime > playing1.playingTiles.find((p) => p.i === t.i)?.currentTime - 1),
    { first: playing1.playingTiles.map((t) => t.i), second: playing2.playingTiles.map((t) => t.i) },
  );
  check("tablet: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── phone on a slow link: adaptive — one slot, nothing prefetched ──
{
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
      Object.defineProperty(navigator, "connection", {
        value: { saveData: false, effectiveType: "3g", downlink: 0.4, addEventListener() {}, removeEventListener() {} },
      });
    } catch {}
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(3500);

  const st = await page.evaluate(VIDEO_STATE);
  check("slow phone: adaptive — exactly one trailer loads, nothing prefetched ahead", st.playing === 1 && st.withVideo === 1, { playing: st.playing, withVideo: st.withVideo });
  const nearSlow = st.visible.slice().sort((a, b) => a.distanceToCentre - b.distanceToCentre)[0];
  check("slow phone: the full connection goes to the tile under the eyes", !!nearSlow && st.playingTiles.some((t) => t.i === nearSlow.i), { nearest: nearSlow?.i, distance: nearSlow?.distanceToCentre });
  const thumbsLoaded = await page.evaluate(() =>
    [...document.querySelectorAll(".unit__media video, .rail-item video")].every((v) => {
      const img = (v.closest(".unit__media") ?? v.closest(".rail-item"))?.querySelector("img");
      return !img || img.complete;
    }),
  );
  check("slow phone: thumbnail first — trailers never outrun their still image", thumbsLoaded);
  check("slow phone: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── desktop hover must keep working (regression) ──
{
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(2500);
  const idle = await page.evaluate(VIDEO_STATE);
  // beeg desktop: hover-driven — nothing auto-plays on a plain scroll
  check("desktop: no trailer auto-plays without hover (beeg desktop parity)", idle.playing === 0, { playing: idle.playing, playingTiles: idle.playingTiles.map((t) => t.i) });
  check("desktop: visible tiles may buffer ahead (capped), off-screen stays silent", idle.withVideo <= 2 && idle.offscreenWithVideo === 0, { withVideo: idle.withVideo, offscreen: idle.offscreenWithVideo });

  const box = await page.evaluate(() => {
    const el = document.querySelector(".unit__media");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await sleep(3000);
  const hovered = await page.evaluate(() => {
    const tile = document.querySelector(".unit");
    const v = tile.querySelector("video");
    return { hasVideo: !!v, playing: !!v && !v.paused, readyState: v?.readyState ?? -1 };
  });
  check("desktop: hovering a tile plays its trailer", hovered.hasVideo && hovered.playing, hovered);
  await page.mouse.move(box.x, box.y + 400);
  await sleep(1200);
  const left = await page.evaluate(VIDEO_STATE);
  check("desktop: leaving a tile cancels its preview (nothing keeps playing)", left.playing === 0, { playing: left.playing, playingTiles: left.playingTiles.map((t) => t.i) });
  check("desktop: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── watch page: the player itself outranks the rails ──
{
  const res = await fetch(`${BASE}/api/videos?orientation=straight&page=1`);
  const id = ((await res.json()).videos || [])[0]?.id;
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
  await page.goto(`${BASE}/#v/${encodeURIComponent(id)}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".player-stage", { timeout: 45000 }).catch(() => {});
  await sleep(4500);
  // while the player is on screen and running, its stream has the connection
  const atTop = await page.evaluate(() => {
    const stage = document.querySelector(".player-stage");
    const vids = [...document.querySelectorAll(".rail-item video, .train-item video, .unit video")];
    return {
      stageVisible: !!stage && stage.getBoundingClientRect().bottom > window.innerHeight * 0.2,
      stagePlaying: !!document.querySelector(".player-stage video") && !document.querySelector(".player-stage video").paused,
      tilePlaying: vids.filter((v) => !v.paused).length,
    };
  });
  check("watch: the trailer player is running at the fold", atTop.stagePlaying, atTop);
  check("watch: while the player is on screen the rails stay silent", atTop.stageVisible && atTop.tilePlaying === 0, atTop);

  // scroll the player out of view: related / up next titles take over
  await page.evaluate(() => {
    const g = document.querySelector(".watch__related") || document.querySelector(".watch__strip");
    (g || document.body).scrollIntoView();
  });
  await sleep(3000);
  const down = await page.evaluate(() => {
    const vids = [...document.querySelectorAll(".rail-item video, .train-item video, .unit video")];
    return { tileVideos: vids.length, tilePlaying: vids.filter((v) => !v.paused).length };
  });
  check("watch: scrolling past the player lets related/up-next previews play", down.tilePlaying >= 1, down);

  // back at the fold with the player paused: tiles may resume too
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(1200);
  await page.evaluate(() => document.querySelector(".player-stage video")?.pause());
  await sleep(3000);
  const paused = await page.evaluate(() => {
    const vids = [...document.querySelectorAll(".rail-item video, .train-item video, .unit video")];
    return { tileVideos: vids.length, tilePlaying: vids.filter((v) => !v.paused).length };
  });
  check("watch: pausing the player lets the in-view tiles resume", paused.tileVideos > 0 && paused.tilePlaying >= 1, paused);
  check("watch: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
