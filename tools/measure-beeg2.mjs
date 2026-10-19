import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.setRequestInterception(true);
page.on("request", (r) => (r.resourceType() === "image" || r.resourceType() === "media") ? r.abort().catch(()=>{}) : r.continue().catch(()=>{}));
await page.goto("https://beeg.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 6000));
await page.evaluate(() => { const t=[...document.querySelectorAll("button,a")].find(b=>/18|enter|yes/i.test(b.textContent||"")); if(t) t.click(); });
await new Promise(r => setTimeout(r, 1500));
const out = await page.evaluate(() => {
  const pick = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el), r = el.getBoundingClientRect();
    return { tag: el.tagName.toLowerCase(), cls: (el.className||"").toString().slice(0,140), rect: [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],
      font: c.fontFamily, fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight, color: c.color, bg: c.backgroundColor, radius: c.borderRadius, pad: c.padding, ls: c.letterSpacing, tt: c.textTransform, op: c.opacity,
      border: c.border, objectFit: c.objectFit };
  };
  const cards = [...document.querySelectorAll("a.tw-absolute.tw-inset-0")].slice(0,4);
  const parents = cards.map(cv => pick(cv.parentElement));
  const imgs = cards.map(cv => [...cv.querySelectorAll("img")].slice(0,3).map(pick));
  // header left side content (logo), header buttons with their inner svg sizes
  const header = document.querySelector("header");
  const headerHTML = header ? header.innerHTML.replace(/\s+/g," ").slice(0, 1500) : null;
  const svgSize = (el) => { const s = el?.querySelector("svg"); if (!s) return null; const r = s.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  const headerButtons = header ? [...header.querySelectorAll("button")].map(b => ({...pick(b), svg: svgSize(b)})) : [];
  // title/meta text under the first card
  const firstCard = cards[0]?.closest("[class]");
  const tileInfo = [];
  let p = cards[0]?.parentElement?.parentElement;
  if (p) { for (const child of p.querySelectorAll("*")) { if (child.children.length === 0 && (child.textContent || "").trim().length > 1) tileInfo.push(pick(child)); } }
  return { headerHTML, headerButtons, parents: parents.slice(0,2), imgs: imgs.slice(0,2), tileInfo: tileInfo.slice(0,10),
    chips: [...document.querySelectorAll("[class*='chip'], .sw-per, button[class*='rounded-full']")].slice(0,8).map(pick),
    body: pick(document.querySelector("body")) };
});
console.log(JSON.stringify(out, null, 1).slice(0, 9000));
await browser.close();
