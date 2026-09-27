import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const MODE = process.argv[2] || "desktop";
const OUT = "/tmp/shots";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync("reference/beeg-ui", { recursive: true });

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36";

const CONFIGS = {
  desktop: { viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }, mobile: false, ua: DESKTOP_UA },
  desktop1440: { viewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, mobile: false, ua: DESKTOP_UA },
  mobile: {
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    mobile: true,
    ua: MOBILE_UA,
  },
};

const LABEL = MODE;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const METRIC_JS = `(() => {
  const interesting = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const out = [];
  const seen = new Set();
  const walk = (el, depth) => {
    if (depth > 9) return;
    for (const child of el.children) {
      if (!(child instanceof HTMLElement)) { walk(child, depth + 1); continue; }
      const tag = child.tagName.toLowerCase();
      if (["script","style","link","meta","noscript","svg","path","template"].includes(tag)) continue;
      if (!interesting(child)) { walk(child, depth + 1); continue; }
      const cs = getComputedStyle(child);
      const r = child.getBoundingClientRect();
      const key = tag + "|" + (child.className && typeof child.className === "string" ? child.className : "") + "|" + Math.round(r.x) + "|" + Math.round(r.y);
      if (seen.has(key)) { walk(child, depth + 1); continue; }
      seen.add(key);
      out.push({
        tag,
        cls: (typeof child.className === "string" ? child.className : "").slice(0, 260),
        nw: child.getAttribute("nowrap") !== null,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        d: cs.display, pos: cs.position, fd: cs.flexDirection, gtc: cs.gridTemplateColumns,
        gap: cs.gap, pad: cs.padding, mar: cs.margin, bg: cs.backgroundColor, color: cs.color,
        fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, br: cs.borderRadius, z: cs.zIndex,
        depth,
        text: (child.childElementCount === 0 ? (child.textContent || "").trim().slice(0, 80) : ""),
      });
      walk(child, depth + 1);
    }
  };
  walk(document.body, 0);
  return out;
})()`;

async function shoot(browser, { url, filePrefix, cfg, project }) {
  const page = await browser.newPage();
  await page.setUserAgent(cfg.ua);
  await page.setViewport(cfg.viewport);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // eslint-disable-next-line no-undef
    window.chrome = window.chrome || { runtime: {} };
  });
  const log = [];
  page.on("console", (m) => log.push(m.type() + ": " + m.text().slice(0, 200)));
  page.on("requestfailed", (r) => log.push("FAIL " + r.url().slice(0, 120) + " " + (r.failure()?.errorText || "")));

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
  } catch (e) {
    log.push("goto: " + String(e).slice(0, 200));
  }
  await sleep(3500);

  const title = await page.title();
  const bodyTextLen = await page.evaluate(() => document.body.innerText.length);

  // scroll through the page to trigger lazy loading
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < Math.min(document.body.scrollHeight, step * 4); y += step / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 350));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
  await sleep(1500);

  const html = await page.content();
  fs.writeFileSync(`${OUT}/${filePrefix}.html`, html);
  const metrics = await page.evaluate(METRIC_JS);
  fs.writeFileSync(`${OUT}/${filePrefix}.metrics.json`, JSON.stringify(metrics, null, 1));

  const geom = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollHeight: document.body.scrollHeight,
    docHeight: document.documentElement.scrollHeight,
  }));

  await page.screenshot({ path: `${OUT}/${filePrefix}-fold.png` });
  await page.screenshot({ path: `${OUT}/${filePrefix}-full.png`, fullPage: true });
  if (project) {
    fs.copyFileSync(`${OUT}/${filePrefix}-fold.png`, path.join("reference/beeg-ui", `${filePrefix}-fold.png`));
    fs.copyFileSync(`${OUT}/${filePrefix}-full.png`, path.join("reference/beeg-ui", `${filePrefix}-full.png`));
  }

  // links for follow-up captures
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href"))
      .filter((h, i, arr) => h && arr.indexOf(h) === i)
      .slice(0, 120),
  );
  fs.writeFileSync(`${OUT}/${filePrefix}.links.json`, JSON.stringify(links, null, 1));

  fs.writeFileSync(`${OUT}/${filePrefix}.log.txt`, log.slice(0, 200).join("\n"));
  const stat = (p) => {
    try { return fs.statSync(p).size; } catch { return -1; }
  };
  console.log(
    JSON.stringify({
      mode: LABEL,
      url,
      title,
      bodyTextLen,
      geom,
      metricsCount: metrics.length,
      foldBytes: stat(`${OUT}/${filePrefix}-fold.png`),
      fullBytes: stat(`${OUT}/${filePrefix}-full.png`),
      linksCount: links.length,
      logLines: log.length,
    }),
  );
  await page.close();
  return links;
}

const cfg = CONFIGS[MODE] || CONFIGS.desktop;
const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--mute-audio",
    "--lang=en-US",
  ],
});

const homeLinks = await shoot(browser, {
  url: "https://beeg.com/",
  filePrefix: `beeg-${MODE}-home`,
  cfg,
  project: true,
});

const target = process.argv[3];
if (target) {
  await shoot(browser, { url: target, filePrefix: `beeg-${MODE}-watch`, cfg, project: true });
} else {
  console.log("candidate video links:", homeLinks.filter((h) => /video/i.test(h)).slice(0, 10).join(" "));
}

await browser.close();
