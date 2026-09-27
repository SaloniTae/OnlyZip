// Scenario probe: dumps a deep element tree for a region, optionally after hover/click.
// usage: node tools/deep.mjs <scenario> [<scenario> ...]
import fs from "node:fs";
import puppeteer from "puppeteer";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36";
const V = {
  desktop: { viewport: { width: 1920, height: 1080 }, mobile: false, ua: DESKTOP_UA },
  laptop: { viewport: { width: 1440, height: 900 }, mobile: false, ua: DESKTOP_UA },
  mobile: { viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, mobile: true, ua: MOBILE_UA },
};
const WATCH = "https://beeg.com/-0297132863926995";

const SCENARIOS = {
  "desktop-watch-body": { vp: "desktop", url: WATCH, root: "^5", depth: 6 },
  "mobile-watch-body": { vp: "mobile", url: WATCH, root: "^5", depth: 7 },
  "desktop-watch-inner": { vp: "desktop", url: WATCH, root: "^4", depth: 8 },
  "desktop-watch-player": { vp: "desktop", url: WATCH, root: ".x-player", depth: 8 },
  "mobile-watch-player": { vp: "mobile", url: WATCH, root: ".x-player", depth: 8 },
  "desktop-watch-paused": { vp: "desktop", url: WATCH, root: ".x-player", depth: 8, click: ".x-player__video", hover: ".x-player" },
  "mobile-watch-paused": { vp: "mobile", url: WATCH, root: ".x-player", depth: 8, click: ".x-player__video", hover: ".x-player" },
  "desktop-home-top": { vp: "desktop", url: "https://beeg.com/", root: ".tw-pt-3", depth: 8 },
  "mobile-home-top": { vp: "mobile", url: "https://beeg.com/", root: ".tw-pt-3", depth: 8 },
  "desktop-sidebar": { vp: "desktop", url: "https://beeg.com/", root: "aside", depth: 7, hover: "aside" },
  "mobile-drawer": { vp: "mobile", url: "https://beeg.com/", root: "aside", depth: 7, click: "header button" },
  "mobile-search": { vp: "mobile", url: "https://beeg.com/", root: "body", depth: 4, click: "header button:nth-of-type(1)" },
  "desktop-footer": { vp: "desktop", url: "https://beeg.com/", root: "footer", depth: 6 },
  "desktop-search": { vp: "desktop", url: "https://beeg.com/search?q=teen", depth: 6, root: ".core-page" },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DUMP = `(args) => {
  const { root, depth } = args;
  let el;
  if (root.startsWith('^')) {
    const n = parseInt(root.slice(1), 10);
    el = document.querySelector('.x-player__video') || document.querySelector('video');
    for (let i = 0; i < n && el; i++) el = el.parentElement;
  } else {
    el = document.querySelector(root);
  }
  if (!el) return { error: 'no root ' + root, lines: ['no root ' + root] };
  const lines = [];
  const P = ['borderRadius','backgroundColor','color','fontSize','fontWeight','lineHeight','padding','margin','gap','gridTemplateColumns','border','backdropFilter','boxShadow','textShadow','zIndex','display','position','overflow','whiteSpace','textOverflow','letterSpacing','width','height','alignItems','justifyContent','flexDirection','opacity','transform','objectFit','top','left','right','bottom','maxWidth','minHeight','aspectRatio'];
  const fmt = (e, d) => {
    const r = e.getBoundingClientRect();
    const c = getComputedStyle(e);
    const st = P.map((p) => [p, c[p]])
      .filter(([, v]) => v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)')
      .map(([p, v]) => p + '=' + String(v).slice(0, 46));
    const cls = typeof e.className === 'string' ? e.className.split(' ').filter((x) => x && !x.startsWith('focus:') && !x.startsWith('hover:') && !x.startsWith('active:')).slice(0, 18).join(' ') : '';
    const own = e.childElementCount === 0 ? (e.textContent || '').trim().slice(0, 70) : '';
    lines.push('  '.repeat(d) + \`<\${e.tagName.toLowerCase()}> [\${Math.round(r.width)}x\${Math.round(r.height)} @\${Math.round(r.x)},\${Math.round(r.y)}] \${cls}\${st.length ? ' {' + st.join(' ') + '}' : ''}\${own ? ' "' + own + '"' : ''}\`);
    if (d >= depth) return;
    for (const k of e.children) if (k instanceof HTMLElement && !['script','style','svg','path'].includes(k.tagName.toLowerCase())) fmt(k, d + 1);
  };
  fmt(el, 0);
  return { lines, rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() };
}`;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});

for (const name of process.argv.slice(2)) {
  const sc = SCENARIOS[name];
  if (!sc) {
    console.log("unknown scenario", name);
    continue;
  }
  const cfg = V[sc.vp];
  const page = await browser.newPage();
  await page.setUserAgent(cfg.ua);
  await page.setViewport(cfg.viewport);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // eslint-disable-next-line no-undef
    window.chrome = window.chrome || { runtime: {} };
  });
  try {
    await page.goto(sc.url, { waitUntil: "networkidle2", timeout: 45000 });
  } catch (e) {
    console.log(name, "goto:", String(e).slice(0, 100));
  }
  await sleep(4000);
  if (sc.hover) {
    try {
      await page.hover(sc.hover);
      await sleep(1200);
    } catch (e) {
      console.log(name, "hover fail", String(e).slice(0, 80));
    }
  }
  if (sc.click) {
    try {
      await page.click(sc.click);
      await sleep(1800);
    } catch (e) {
      console.log(name, "click fail", String(e).slice(0, 80));
    }
  }
  const res = await page.evaluate(`(${DUMP})(${JSON.stringify({ root: sc.root, depth: sc.depth })})`);
  fs.writeFileSync(`/tmp/shots/${name}.tree.txt`, (res.lines || []).join("\n"));
  fs.writeFileSync(`/tmp/shots/${name}.html`, await page.content());
  await page.screenshot({ path: `/tmp/shots/${name}.png` });
  fs.copyFileSync(`/tmp/shots/${name}.png`, `reference/beeg-ui/${name}.png`);
  console.log(`--- ${name} root=${sc.root} rect=${JSON.stringify(res.rect)} lines=${(res.lines || []).length}`);
  await page.close();
}
await browser.close();
