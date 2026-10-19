// Temporary check: live category + Ultra filters, creator search suggestions,
// the creator profile page, and the watch page's studio/cast/category blocks.
// Each scenario gets a fresh browser: the sandbox is memory-tight.
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const SLUG = process.env.SLUG || "young-wife-cheated-husband-c2J8jp";
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + JSON.stringify(detail) : ""}`);
};

async function scenario(name, fn) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
      "--lang=en-US",
    ],
  });
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport(DESKTOP);
  await page.evaluateOnNewDocument(() => localStorage.setItem("faphive_age_ok", "1"));
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
  });
  try {
    await fn(page, errors, name);
  } catch (err) {
    check(`${name}: scenario completed`, false, String(err).slice(0, 240));
  }
  await browser.close();
}

// ── home: live categories + creator rail + category filter ──
await scenario("home", async (page, errors) => {
  await page.goto(`${BASE}/#/`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 30000 });
  await sleep(1500);

  const catChips = await page.evaluate(() => {
    const row = [...document.querySelectorAll(".chips")].find((r) =>
      [...r.querySelectorAll(".chip")].some((c) => c.textContent.trim() === "Ultra"),
    );
    return row ? [...row.querySelectorAll(".chip")].map((c) => c.textContent.trim()) : [];
  });
  check("home: live category chips rendered from faphouse2", catChips.length > 10, {
    count: catChips.length,
    first: catChips.slice(0, 5),
  });
  check("home: Ultra chip present", catChips.includes("Ultra"));

  const avatars = await page.$$eval(".creator-rail .creator-tile img", (els) => els.length);
  check("home: creator rail with avatars", avatars > 3, { avatars });

  const target = catChips.find((c) => c !== "Ultra");
  await page.evaluate((name) => {
    const row = [...document.querySelectorAll(".chips")].find((r) =>
      [...r.querySelectorAll(".chip")].some((c) => c.textContent.trim() === "Ultra"),
    );
    [...row.querySelectorAll(".chip")].find((c) => c.textContent.trim() === name).click();
  }, target);
  await page.waitForFunction(
    (name) => document.querySelector(".section-title")?.textContent.includes(name),
    { timeout: 25000 },
    target,
  );
  await sleep(1500);
  const st = await page.evaluate(() => ({
    title: document.querySelector(".section-title")?.textContent,
    cards: document.querySelectorAll(".unit").length,
  }));
  check(`home: category chip "${target}" filters the grid`, st.cards > 0, st);

  check("home: no runtime errors", errors.length === 0, errors);
});

// ── Ultra section ──
await scenario("ultra", async (page, errors) => {
  await page.goto(`${BASE}/#/`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".chips .chip", { timeout: 30000 });
  await sleep(1200);
  await page.evaluate(() => {
    [...document.querySelectorAll(".chips .chip")].find((c) => c.textContent.trim() === "Ultra").click();
  });
  await page.waitForFunction(() => /Ultra videos/i.test(document.querySelector(".section-title")?.textContent || ""), {
    timeout: 25000,
  });
  await sleep(1200);
  const st = await page.evaluate(() => ({
    title: document.querySelector(".section-title")?.textContent,
    cards: document.querySelectorAll(".unit").length,
  }));
  check("Ultra chip loads the Ultra section", st.cards > 0 && /Ultra videos/i.test(st.title || ""), st);
  check("ultra: no runtime errors", errors.length === 0, errors);
});

// ── search panel: creator suggestions with avatars -> creator page ──
await scenario("creator", async (page, errors) => {
  await page.goto(`${BASE}/#/`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".bar-actions .icon-btn", { timeout: 30000 });
  await sleep(800);
  await page.click(".bar-actions .icon-btn");
  await page.waitForSelector(".search-input", { timeout: 10000 });
  await page.type(".search-input", "alina", { delay: 40 });
  await page.waitForSelector(".search-suggest .creator-line", { timeout: 20000 });
  const sugg = await page.$$eval(".search-suggest .creator-line", (els) =>
    els.map((e) => ({
      name: e.querySelector(".creator-line__name")?.textContent,
      avatar: !!e.querySelector(".creator-line__avatar img"),
    })),
  );
  check("search: creator suggestions with avatars", sugg.length > 0 && sugg.every((s) => s.avatar), {
    count: sugg.length,
    first: sugg[0],
  });

  await page.click(".search-suggest .creator-line");
  await page.waitForSelector(".creator-head__name", { timeout: 25000 });
  await sleep(1800);
  const prof = await page.evaluate(() => ({
    name: document.querySelector(".creator-head__name")?.textContent,
    avatar: !!document.querySelector(".creator-head__avatar img"),
    cards: document.querySelectorAll(".unit").length,
    related: document.querySelectorAll(".creator-related .creator-tile").length,
    hash: location.hash,
  }));
  check("creator page opens from a suggestion", !!prof.name && prof.avatar && prof.cards > 0, prof);
  check("creator page lists related creators", prof.related > 0, { related: prof.related });
  check("creator: no runtime errors", errors.length === 0, errors);
});

// ── committed search: creators section above the video grid ──
await scenario("search", async (page, errors) => {
  await page.goto(`${BASE}/#/`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".bar-actions .icon-btn", { timeout: 30000 });
  await sleep(800);
  await page.click(".bar-actions .icon-btn");
  await page.waitForSelector(".search-input", { timeout: 10000 });
  await page.type(".search-input", "mia", { delay: 40 });
  await page.keyboard.press("Enter");
  await page.waitForSelector(".search-creators .creator-tile", { timeout: 25000 });
  await sleep(1500);
  const st = await page.evaluate(() => ({
    creators: document.querySelectorAll(".search-creators .creator-tile").length,
    videos: document.querySelectorAll(".unit").length,
  }));
  check("search results show a Creators section + videos", st.creators > 0 && st.videos > 0, st);
  check("search: no runtime errors", errors.length === 0, errors);
});

// ── watch page: studio identity, cast strip, category chips ──
await scenario("watch", async (page, errors) => {
  await page.goto(`${BASE}/#v/${SLUG}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".watch__info", { timeout: 30000 });
  await sleep(1800);

  const st = await page.evaluate(() => ({
    studio: document.querySelector(".watch__creator .up")?.textContent,
    studioAvatar: !!document.querySelector(".watch__studio-avatar"),
    cast: [...document.querySelectorAll(".watch__cast-row .creator-line")].map((e) => ({
      name: e.querySelector(".creator-line__name")?.textContent,
      avatar: !!e.querySelector(".creator-line__avatar img"),
    })),
    cats: [...document.querySelectorAll(".watch__cats .chip")].map((e) => e.textContent.trim()),
  }));
  check("watch: studio identity with avatar", !!st.studio && st.studioAvatar, { studio: st.studio });
  check("watch: cast strip lists who is in the video", st.cast.length > 0 && st.cast.every((c) => c.avatar), st.cast);
  check("watch: category chips from the video page", st.cats.length > 3, {
    n: st.cats.length,
    first: st.cats.slice(0, 4),
  });

  await page.click(".watch__cast-row .creator-line");
  await page.waitForSelector(".creator-head__name", { timeout: 25000 });
  const castNav = await page.evaluate(() => ({
    hash: location.hash,
    name: document.querySelector(".creator-head__name")?.textContent,
  }));
  check("watch: cast member opens their profile", castNav.hash.startsWith("#creator/") && !!castNav.name, castNav);
  check("watch: no runtime errors", errors.length === 0, errors);
});

// ── watch category chip -> filtered browse grid ──
await scenario("watch-category", async (page, errors) => {
  await page.goto(`${BASE}/#v/${SLUG}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".watch__cats .chip", { timeout: 30000 });
  await sleep(1200);
  const firstName = await page.$eval(".watch__cats .chip", (e) => e.textContent.trim());
  await page.click(".watch__cats .chip");
  await page.waitForFunction(
    (name) => document.querySelector(".section-title")?.textContent.includes(name),
    { timeout: 25000 },
    firstName,
  );
  await sleep(1200);
  const st = await page.evaluate(() => ({
    hash: location.hash,
    title: document.querySelector(".section-title")?.textContent,
    cards: document.querySelectorAll(".unit").length,
  }));
  check(`watch: category chip "${firstName}" opens the filtered grid`, st.cards > 0, st);
  check("watch-category: no runtime errors", errors.length === 0, errors);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
