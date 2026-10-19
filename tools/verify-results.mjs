// The search panel kills this sandbox's headless Chromium, so the search
// *results* view is exercised through the tag chips, which run the same
// doSearch() path (query -> creators section + video grid).
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + JSON.stringify(detail) : ""}`);
};

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
});

try {
  await page.goto("http://127.0.0.1:3000/#/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".chips .chip", { timeout: 30000 });
  await sleep(1500);

  // the tag row is the one holding "Massage"; its "POV" chip is a tag, not a
  // category, so this exercises doSearch() rather than the category filter
  const tag = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".chips")];
    const tagRow = rows.find((r) => [...r.querySelectorAll(".chip")].some((c) => c.textContent.trim() === "Massage"));
    const t = [...tagRow.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "POV");
    t.click();
    return t.textContent.trim();
  });
  await page.waitForFunction(
    (q) => document.querySelector(".section-title")?.textContent.includes(q),
    { timeout: 30000 },
    tag,
  );
  await page.waitForSelector(".search-creators .creator-tile", { timeout: 30000 });
  await sleep(1500);

  const st = await page.evaluate(() => ({
    tag: document.querySelector(".search-creators")?.parentElement?.querySelector(".section-title")?.textContent,
    creators: document.querySelectorAll(".search-creators .creator-tile").length,
    avatars: document.querySelectorAll(".search-creators .creator-tile__avatar img").length,
    names: [...document.querySelectorAll(".search-creators .creator-tile__name")].slice(0, 3).map((e) => e.textContent),
    videos: document.querySelectorAll(".unit").length,
  }));
  check("search results show a Creators section with avatars", st.creators > 0 && st.avatars > 0 && st.videos > 0, st);

  await page.evaluate(() => document.querySelector(".search-creators .creator-tile").click());
  await page.waitForSelector(".creator-head__name", { timeout: 30000 });
  await sleep(1200);
  const prof = await page.evaluate(() => ({
    hash: location.hash,
    name: document.querySelector(".creator-head__name")?.textContent,
    cards: document.querySelectorAll(".unit").length,
  }));
  check("tapping a creator result opens their profile", prof.hash.startsWith("#creator/") && !!prof.name && prof.cards >= 0, prof);
  check("no runtime errors", errors.length === 0, errors);
} catch (err) {
  check("scenario completed", false, String(err).slice(0, 200));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
