// Infinite scroll must load page 2 and then stop (the parser used to report the
// site-wide video count as the section total, which made the grid request pages
// forever).
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

const pageRequests = [];
page.on("request", (r) => {
  const u = r.url();
  if (u.includes("/api/videos")) pageRequests.push(u);
});

try {
  await page.goto("http://127.0.0.1:3000/#/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 40000 });
  await sleep(2000);
  const first = await page.$$eval(".unit", (els) => els.length);
  check("first page renders a full grid", first >= 40, { cards: first });

  // scroll a couple of screens to trigger the next page
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1200);
  }
  const after = await page.$$eval(".unit", (els) => els.length);
  check("scrolling loads further pages", after > first, { first, after });

  // now sit at the bottom and make sure it stops asking for more
  const before = pageRequests.length;
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(7000);
  const extra = pageRequests.length - before;
  check("no endless page requests once the grid is exhausted", extra <= 2, { extra, total: pageRequests.length });

  const titles = await page.$$eval(".unit", (els) =>
    els.map((e) => e.querySelector(".unit__title, .unit__name")?.textContent || "").filter(Boolean),
  );
  const unique = new Set(titles).size;
  check("loaded cards are distinct", unique === titles.length && titles.length > 0, { unique, titles: titles.length });
  check("paging: no runtime errors", errors.length === 0, errors);
} catch (err) {
  check("paging scenario completed", false, String(err).slice(0, 200));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
