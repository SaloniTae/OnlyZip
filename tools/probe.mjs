// Deep layout probe: dumps computed geometry/styles for beeg.com UI regions.
// usage: node tools/probe.mjs desktop:home mobile:watch ...
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const OUT = "/tmp/shots";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync("reference/beeg-ui", { recursive: true });

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36";

const VIEWPORTS = {
  desktop: { viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }, mobile: false, ua: DESKTOP_UA },
  laptop: { viewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, mobile: false, ua: DESKTOP_UA },
  mobile: {
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    mobile: true,
    ua: MOBILE_UA,
  },
};

const VIDEO_URL = process.env.BEEG_VIDEO || "https://beeg.com/-0297132863926995";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(() => {
  const P = ['display','position','width','height','minHeight','padding','margin','gap','backgroundColor','color','fontSize','fontWeight','lineHeight','letterSpacing','borderRadius','gridTemplateColumns','gridAutoRows','fontFamily','boxShadow','backdropFilter','filter','border','borderTop','borderBottom','zIndex','overflow','overflowX','textOverflow','whiteSpace','opacity','alignItems','justifyContent','flexDirection','transform','objectFit','textShadow','top','right','left','bottom','columnGap','rowGap','paddingTop','paddingBottom','paddingLeft','paddingRight','maxWidth'];
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const st = (el) => { const c = getComputedStyle(el); const o = {}; for (const p of P) { const v = c[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') o[p] = v; } return o; };
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const cls = (el) => (el && el.className && typeof el.className === 'string' ? el.className : '').slice(0, 200);
  const node = (el) => (el ? { tag: el.tagName.toLowerCase(), cls: cls(el), rect: rect(el), st: st(el), text: (el.innerText || '').slice(0, 100).replace(/\\n/g, ' / ') } : null);

  const out = { url: location.href, viewport: { w: innerWidth, h: innerHeight }, dpr: devicePixelRatio, scrollHeight: document.documentElement.scrollHeight };

  out.header = node(q('header'));
  if (q('header')) {
    out.headerKids = qa('header > *').map((el) => ({ ...node(el), kids: qa('*', el).slice(0, 8).map(node) }));
  }

  const grid = q('.core-page__units-grid');
  out.gridHost = node(grid ? grid.parentElement : null);
  if (grid) {
    out.grid = { ...node(grid), parent: node(grid.parentElement) };
    out.cardCount = qa('.core-page__unit-column', grid).length;
    out.cards = qa('.core-page__unit-column', grid).slice(0, 4).map((col) => {
      const media = q('[data-testid="unit-media"]', col);
      const info = q('[data-testid="unit-info"]', col);
      return {
        col: rect(col),
        colSt: st(col),
        media: media ? { rect: rect(media), st: st(media), text: (media.innerText || '').slice(0, 40) } : null,
        img: media ? node(q('img', media)) : null,
        amount: node(q('[data-testid="unit-amount"]', col)),
        avatar: node(q('[data-testid="unit-avatar"]', col)),
        title: node(q('[data-testid="unit-title"]', col)),
        info: info ? { rect: rect(info), st: st(info), kids: qa('*', info).slice(0, 6).map(node) } : null,
        buttons: qa('button', col).map(node),
        allText: (col.innerText || '').slice(0, 120).replace(/\\n/g, ' / '),
      };
    });
  }

  out.plates = qa('[--Plate-width], .core-page__plate').slice(0, 2).map((el) => ({ ...node(el), kids: qa('*', el).slice(0, 6).map(node) }));

  out.fixed = qa('*').filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
    .filter((el) => !el.closest('header'))
    .slice(0, 22)
    .map(node);

  out.headings = qa('h1,h2,h3,h4,[class*=text-headline],[class*=text-title]').slice(0, 18).map(node);

  out.textButtons = qa('button').filter((b) => (b.innerText || '').trim().length > 1).slice(0, 30).map(node);

  // video / player region
  const v = q('video');
  out.video = node(v);
  if (v) {
    const chain = [];
    let el = v;
    for (let i = 0; i < 7 && el; i++) { chain.push(node(el)); el = el.parentElement; }
    out.videoChain = chain;
    const top = chain[Math.min(4, chain.length - 1)];
    const host = v.parentElement?.parentElement?.parentElement || document.body;
    out.playerSiblings = qa(':scope > *', host).slice(0, 20).map(node);
  }

  out.footer = node(q('footer'));
  if (q('footer')) out.footerLinks = qa('footer a').slice(0, 30).map((a) => ({ text: a.innerText.trim().slice(0, 40), href: a.getAttribute('href') }));

  out.bodyClass = document.body.className + ' || html:' + document.documentElement.className;
  out.hasBottomNav = !!q('[class*=bottom-nav],nav[class*=mobile],[class*=BottomNavigation]');
  return out;
})()`;

async function run(browser, viewportName, pageName) {
  const cfg = VIEWPORTS[viewportName];
  const url = pageName === "watch" ? VIDEO_URL : "https://beeg.com/";
  const prefix = `${viewportName}-${pageName}`;
  const page = await browser.newPage();
  await page.setUserAgent(cfg.ua);
  await page.setViewport(cfg.viewport);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // eslint-disable-next-line no-undef
    window.chrome = window.chrome || { runtime: {} };
  });
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
  } catch (e) {
    console.log(prefix, "goto:", String(e).slice(0, 120));
  }
  await sleep(4000);
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < Math.min(document.body.scrollHeight, step * 3); y += step / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 300));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
  await sleep(1200);

  const data = await page.evaluate(PROBE);
  fs.writeFileSync(`${OUT}/${prefix}.probe.json`, JSON.stringify(data, null, 1));
  fs.writeFileSync(`${OUT}/${prefix}.html`, await page.content());
  await page.screenshot({ path: `${OUT}/${prefix}-fold.png` });
  await page.screenshot({ path: `${OUT}/${prefix}-full.png`, fullPage: true });
  fs.copyFileSync(`${OUT}/${prefix}-fold.png`, path.join("reference/beeg-ui", `${prefix}-fold.png`));
  fs.copyFileSync(`${OUT}/${prefix}-full.png`, path.join("reference/beeg-ui", `${prefix}-full.png`));
  console.log(prefix, JSON.stringify({
    url: data.url,
    scrollHeight: data.scrollHeight,
    grid: data.grid && { rect: data.grid.rect, gtc: data.grid.st.gridTemplateColumns, gap: data.grid.st.gap },
    card0: data.cards && data.cards[0] && { col: data.cards[0].col, media: data.cards[0].media && data.cards[0].media.rect },
    header: data.header && data.header.rect,
    video: data.video && data.video.rect,
    fixedCount: data.fixed.length,
  }));
  await page.close();
}

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});
for (const job of process.argv.slice(2)) {
  const [vp, pg] = job.split(":");
  await run(browser, vp, pg);
}
await browser.close();
