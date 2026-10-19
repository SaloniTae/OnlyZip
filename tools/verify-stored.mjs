// Saved + history views: seeded localStorage must render cards with the
// uploader avatar (not a video frame) and no runtime errors.
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d) => {
  results.push({ n, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  " + JSON.stringify(d) : ""}`);
};

// pull two real cards from our own API so the stored entries look like the ones
// the app writes
const res = await fetch(`${BASE}/api/videos?orientation=straight&page=1`);
const listing = await res.json();
const seed = (listing.videos || []).slice(0, 4).map((v) => ({
  id: v.id,
  title: v.title,
  url: v.url,
  thumb: v.thumb,
  channel: v.channel,
  uploader: v.uploader,
  ts: Date.now(),
}));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});

for (const route of ["#saved", "#history"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument((entries) => {
    localStorage.setItem("faphive_age_ok", "1");
    localStorage.setItem("faphive_saved", JSON.stringify(entries));
    localStorage.setItem("faphive_history", JSON.stringify(entries));
  }, seed);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(`${BASE}/${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(1500);
  const st = await page.evaluate(() => {
    const img = document.querySelector(".unit__avatar img");
    return {
      cards: document.querySelectorAll(".unit").length,
      title: document.querySelector(".section-title")?.textContent,
      avatarSrc: img?.getAttribute("src") || null,
      frame: /\/frame\/|\/screen\//.test(img?.getAttribute("src") || ""),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      profileLink: !!document.querySelector("a.unit__avatar"),
    };
  });
  check(`${route}: cards render with uploader avatars`, st.cards > 0 && st.avatarSrc && !st.frame && st.profileLink, st);
  check(`${route}: no horizontal overflow / no runtime errors`, !st.overflowX && errors.length === 0, { errors });
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
