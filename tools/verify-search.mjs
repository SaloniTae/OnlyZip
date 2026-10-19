// Temporary check of the search panel (opened via its /#search deep link so the
// sandbox does not have to synthesise a click on a heavy page).
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + JSON.stringify(detail) : ""}`);
};

async function scenario(name, url, fn) {
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
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
  if (process.env.LIGHT) {
    // this sandbox's Chromium dies when the panel renders over a media-heavy
    // page; keep the run light so the panel itself can still be exercised
    await page.setRequestInterception(true);
    page.on("request", (r) => {
      const u = r.url();
      if (u.includes("/api/videos") || /flixcdn|xhcdn/.test(u)) r.abort().catch(() => {});
      else r.continue().catch(() => {});
    });
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await fn(page, errors);
  } catch (err) {
    check(`${name}: scenario completed`, false, String(err).slice(0, 200));
  }
  await browser.close();
}

const typeValue = (page, value) =>
  page.evaluate((v) => {
    const input = document.querySelector(".search-input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);

// ── suggestions ──
await scenario("suggestions", `${BASE}/#search`, async (page, errors) => {
  await page.waitForSelector(".search-input", { timeout: 30000 });
  check("search panel opens from the deep link", true);

  await typeValue(page, "alina");
  await page.waitForSelector(".search-suggest .creator-line", { timeout: 25000 });
  const sugg = await page.$$eval(".search-suggest .creator-line", (els) =>
    els.map((e) => ({
      name: e.querySelector(".creator-line__name")?.textContent,
      meta: e.querySelector(".creator-line__meta")?.textContent,
      avatar: !!e.querySelector(".creator-line__avatar img"),
    })),
  );
  check("suggestions appear for a creator name with avatars", sugg.length > 0 && sugg.every((s) => s.avatar), {
    count: sugg.length,
    first: sugg[0],
  });
  const allLabel = await page.$eval(".search-suggest__all", (e) => e.textContent);
  check("panel offers a video search for the same text", /search videos for/i.test(allLabel), { allLabel });

  await page.evaluate(() => document.querySelector(".search-suggest .creator-line").click());
  await page.waitForSelector(".creator-head__name", { timeout: 25000 });
  await sleep(1200);
  const prof = await page.evaluate(() => ({
    hash: location.hash,
    name: document.querySelector(".creator-head__name")?.textContent,
    cards: document.querySelectorAll(".unit").length,
  }));
  check("suggestion opens that creator's profile", prof.hash.startsWith("#creator/") && !!prof.name, prof);
  check("suggestions: no runtime errors", errors.length === 0, errors);
});

// ── creators section in committed search results ──
await scenario("results", `${BASE}/#search`, async (page, errors) => {
  await page.waitForSelector(".search-input", { timeout: 30000 });
  await typeValue(page, "mia");
  await page.waitForSelector(".search-suggest .creator-line", { timeout: 25000 });
  await page.evaluate(() => document.querySelector(".search-suggest__all").click());
  await page.waitForSelector(".search-creators .creator-tile", { timeout: 30000 });
  await sleep(1500);
  const st = await page.evaluate(() => ({
    creators: document.querySelectorAll(".search-creators .creator-tile").length,
    avatars: document.querySelectorAll(".search-creators .creator-tile__avatar img").length,
    videos: document.querySelectorAll(".unit").length,
    title: document.querySelector(".section-title")?.textContent,
  }));
  check("results show a Creators section above the videos", st.creators > 0 && st.videos > 0, st);
  check("creator results carry avatars", st.avatars > 0, { avatars: st.avatars });

  await page.evaluate(() => document.querySelector(".search-creators .creator-tile").click());
  await page.waitForSelector(".creator-head__name", { timeout: 25000 });
  const st2 = await page.evaluate(() => ({
    hash: location.hash,
    name: document.querySelector(".creator-head__name")?.textContent,
  }));
  check("tapping a creator result opens the profile", st2.hash.startsWith("#creator/") && !!st2.name, st2);
  check("results: no runtime errors", errors.length === 0, errors);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
