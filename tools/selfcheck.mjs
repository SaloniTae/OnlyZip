// Geometry + computed-style self-check of the FapHive preview against the beeg
// spec measured earlier (see .tools/out/*.probe.json).
// usage: BASE=http://127.0.0.1:3000 node tools/selfcheck.mjs [slug]
import fs from "node:fs";
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const SLUG = process.argv[2] || "";
const OUT = ".tools/out";
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36";

const VIEWPORTS = {
  desktop: { viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }, ua: DESKTOP_UA },
  mobile: {
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ua: MOBILE_UA,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const cs = (el, ...props) => { if (!el) return null; const c = getComputedStyle(el); const o = {}; for (const p of props) o[p] = c[p]; return o; };
  const q = (s) => document.querySelector(s);
  const out = { url: location.href, viewport: { w: innerWidth, h: innerHeight }, bodyText: document.body.innerText.slice(0, 300), scrollHeight: document.documentElement.scrollHeight };
  out.ageGate = !!q('.age-overlay');
  out.header = { rect: r(q('.app-bar')), st: cs(q('.app-bar'), 'position', 'height', 'padding', 'backgroundColor', 'backdropFilter', 'zIndex') };
  out.logo = r(q('.brand img'));
  out.iconBtn = { rect: r(q('.icon-btn')), st: cs(q('.icon-btn'), 'width', 'height', 'borderRadius', 'color') };
  out.container = { rect: r(q('.container')), st: cs(q('.container'), 'padding', 'maxWidth') };
  const grid = q('.grid');
  out.grid = { rect: r(grid), st: cs(grid, 'display', 'gridTemplateColumns', 'columnGap', 'rowGap') };
  const card = q('.unit');
  out.card = { rect: r(card), st: cs(card, 'gridTemplateColumns', 'borderRadius') };
  out.media = { rect: r(q('.unit__media')), st: cs(q('.unit__media'), 'paddingTop', 'borderRadius', 'backgroundColor') };
  out.thumb = { rect: r(q('.unit__media img')), st: cs(q('.unit__media img'), 'objectFit', 'opacity') };
  out.duration = { rect: r(q('.unit__amount')), st: cs(q('.unit__amount'), 'fontSize', 'borderRadius', 'backgroundColor') };
  out.infoRow = { rect: r(q('.unit__info')), st: cs(q('.unit__info'), 'padding', 'display', 'alignItems') };
  out.infoAvatar = { rect: r(q('.unit__avatar')), st: cs(q('.unit__avatar'), 'width', 'height', 'borderRadius', 'backgroundColor') };
  out.infoTitle = { rect: r(q('.unit__title')), st: cs(q('.unit__title'), 'fontSize', 'lineHeight', 'fontWeight', 'color', 'whiteSpace', 'textOverflow') };
  out.infoMeta = { rect: r(q('.unit__meta')), st: cs(q('.unit__meta'), 'fontSize', 'color', 'marginTop', 'columnGap', 'display') };
  out.plate = { rect: r(q('.plate')), st: cs(q('.plate'), 'gridTemplateRows', 'borderRadius', 'padding') };
  out.plateAvatar = { rect: r(q('.plate__avatar')), st: cs(q('.plate__avatar'), 'width', 'height', 'borderRadius') };
  out.plateName = { rect: r(q('.plate__name')), st: cs(q('.plate__name'), 'fontSize', 'lineHeight', 'color') };
  out.chip = { rect: r(q('.chip')), st: cs(q('.chip'), 'height', 'padding', 'borderRadius', 'fontSize', 'backgroundColor', 'gap') };
  out.chipSm = { rect: r(q('.chip--sm')), st: cs(q('.chip--sm'), 'height', 'padding', 'fontSize') };
  out.sidebar = { rect: r(q('.sidebar')), st: cs(q('.sidebar'), 'position', 'width', 'transform', 'backgroundColor', 'backdropFilter', 'zIndex') };
  out.navItem = { rect: r(q('.nav-item')), st: cs(q('.nav-item'), 'width', 'height', 'padding', 'gap', 'borderRadius') };
  out.topBlock = r(q('.top-block'));
  out.fab = r(q('.fab'));
  out.video = r(q('video'));
  out.stage = { rect: r(q('.player-stage')), st: cs(q('.player-stage'), 'backgroundColor', 'borderRadius', 'position') };
  out.watchTop = r(q('.watch__top'));
  out.rail = { rect: r(q('.watch__rail')), st: cs(q('.watch__rail'), 'position', 'width', 'gridTemplateColumns', 'gap') };
  out.railItem = { rect: r(q('.rail-item')), st: cs(q('.rail-item'), 'borderRadius') };
  out.train = { rect: r(q('.train')), st: cs(q('.train'), 'gridTemplateColumns', 'gap', 'display') };
  out.trainItem = r(q('.train-item'));
  out.watchTitle = { rect: r(q('.watch__title')), st: cs(q('.watch__title'), 'fontSize', 'lineHeight', 'maskImage', 'marginBottom') };
  out.creatorLine = { rect: r(q('.watch__creator')), st: cs(q('.watch__creator'), 'fontSize', 'color', 'textTransform', 'fontWeight') };
  out.xBtn = { rect: r(q('.x-btn')), st: cs(q('.x-btn'), 'width', 'height', 'borderRadius', 'backgroundColor', 'backdropFilter') };
  out.timeline = { rect: r(q('.x-seeker')), st: cs(q('.x-seeker'), 'height', 'bottom', 'left', 'right') };
  out.footer = { rect: r(q('.site-footer')), st: cs(q('.site-footer'), 'display', 'padding', 'fontSize', 'color') };
  out.sectionHead = r(q('.section-head'));
  return out;
})()`;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});

async function shoot(name, { viewport, ua }, hash) {
  const page = await browser.newPage();
  await page.setUserAgent(ua);
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
  });
  try {
    await page.goto(BASE + hash, { waitUntil: "networkidle2", timeout: 45000 });
  } catch (e) {
    errors.push("goto: " + String(e).slice(0, 160));
  }
  await sleep(3000);
  await page.evaluate(async () => {
    for (let y = 0; y < 1200; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
  await sleep(1000);
  const data = await page.evaluate(PROBE);
  data.errors = errors;
  await page.screenshot({ path: `${OUT}/self-${name}-fold.png` });
  await page.screenshot({ path: `${OUT}/self-${name}-full.png`, fullPage: true });
  fs.writeFileSync(`${OUT}/self-${name}.json`, JSON.stringify(data, null, 1));
  console.log(
    `\n===== ${name} ${data.viewport.w}x${data.viewport.h} hash="${hash}" errors=${errors.length} ageGate=${data.ageGate} scrollH=${data.scrollHeight}`,
  );
  console.log("cards:", await page.evaluate(() => document.querySelectorAll(".unit").length));
  for (const [k, v] of Object.entries(data)) {
    if (k === "errors" || k === "viewport" || k === "url") continue;
    console.log(k + ": " + JSON.stringify(v));
  }
  await page.close();
}

await shoot("home-desktop", VIEWPORTS.desktop, "#/");
await shoot("home-mobile", VIEWPORTS.mobile, "#/");
if (SLUG) {
  await shoot("watch-desktop", VIEWPORTS.desktop, `#v/${SLUG}`);
  await shoot("watch-mobile", VIEWPORTS.mobile, `#v/${SLUG}`);
}
await browser.close();
