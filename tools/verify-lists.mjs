// Finite lists must end like faphouse2 does: as many videos as the profile has,
// then a plain "that's all" line — never a "Couldn't load videos / Upstream 404"
// banner when the last page was simply reached.
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d) => {
  results.push({ n, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  " + JSON.stringify(d) : ""}`);
};

const LAUNCH = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
};

async function open(hash) {
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const errors = [];
  const api = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
  page.on("request", (r) => {
    if (r.url().includes("/api/")) api.push(r.url().replace(BASE, ""));
  });
  await page.goto(`${BASE}/${hash}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  return { browser, page, errors, api };
}

/** Scroll to the bottom until the card count stops growing. */
async function scrollToEnd(page, maxSteps = 14) {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < maxSteps; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1600);
    const n = await page.evaluate(() => document.querySelectorAll(".unit").length);
    if (n === last) {
      stable++;
      if (stable >= 2) return n;
    } else {
      stable = 0;
      last = n;
    }
  }
  return last;
}

const pageState = (page) =>
  page.evaluate(() => ({
    cards: document.querySelectorAll(".unit").length,
    end: document.querySelector(".list-end")?.textContent?.trim() || null,
    retry: !!document.querySelector(".list-end button"),
    sentinel: document.querySelector(".infinite-sentinel")?.textContent?.trim() || null,
    errorBox: document.querySelector(".status-box")?.textContent?.trim().slice(0, 80) || null,
    heading: document.querySelector(".creator-head__meta, .section-title")?.textContent?.trim() || null,
  }));

// ── model profile with a finite grid (faphouse2 says 114 videos) ──
{
  const { browser, page, errors, api } = await open("#creator/julie-jess");
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(2500);
  const head = await pageState(page);
  check("profile header reports the upstream video count", /114\s*videos/i.test(head.heading || ""), { heading: head.heading });

  const cards = await scrollToEnd(page);
  const st = await pageState(page);
  check("profile shows every video upstream has (114)", st.cards === 114, { cards: st.cards });
  check("profile ends with a plain end-of-list line, not an error", !!st.end && /that’s all 114 videos/i.test(st.end), { end: st.end });
  check("no \"Couldn't load videos\" banner anywhere", !st.errorBox && !st.retry, { errorBox: st.errorBox, retry: st.retry });
  check("no sentinel left behind at the end", !st.sentinel, { sentinel: st.sentinel });
  const pages = api.filter((u) => u.startsWith("/api/creator")).length;
  check("it stops asking for pages after the last one", pages <= 3, { requests: api.filter((u) => u.startsWith("/api/creator")) });
  check("model profile: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── studio profile (Dacada com has 204 videos) ──
{
  const { browser, page, errors, api } = await open("#studio/dacada-com");
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(2500);
  const cards = await scrollToEnd(page, 12);
  const st = await pageState(page);
  check("studio profile shows every video upstream has (204)", st.cards === 204, { cards: st.cards });
  check("studio profile ends cleanly", !!st.end && !st.errorBox && !st.retry, { end: st.end, errorBox: st.errorBox });
  check("studio profile: no runtime errors", errors.length === 0, { errors: errors.slice(0, 3), requests: api.filter((u) => u.startsWith("/api/creator")).length });
  await browser.close();
}

// ── a search that matches nothing is empty, not broken ──
{
  const { browser, page, errors } = await open("#search");
  await page.waitForSelector(".search-input", { timeout: 30000 });
  await page.evaluate(() => {
    const input = document.querySelector(".search-input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, "zzzqqqxxyy");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForSelector(".search-suggest__all", { timeout: 25000 });
  await page.evaluate(() => document.querySelector(".search-suggest__all").click());
  await sleep(4000);
  const st = await page.evaluate(() => ({
    empty: document.querySelector(".status-box")?.textContent?.trim().slice(0, 90) || null,
    hasErrorBox: !!document.querySelector(".status-box .btn"),
    cards: document.querySelectorAll(".unit").length,
    heading: document.querySelector(".section-title")?.textContent,
  }));
  check("a no-hit search shows the empty state, not an error", !!st.empty && !st.hasErrorBox && st.cards === 0, st);
  check("no-hit search: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── a normal search still paginates ──
{
  const { browser, page, errors } = await open("#search");
  await page.waitForSelector(".search-input", { timeout: 30000 });
  await page.evaluate(() => {
    const input = document.querySelector(".search-input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, "anal");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForSelector(".search-suggest__all", { timeout: 25000 });
  await page.evaluate(() => document.querySelector(".search-suggest__all").click());
  await page.waitForSelector(".unit", { timeout: 40000 });
  await sleep(2000);
  const first = await page.evaluate(() => document.querySelectorAll(".unit").length);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(3500);
  const after = await page.evaluate(() => document.querySelectorAll(".unit").length);
  check("a real search loads more as you scroll", after > first && first >= 60, { first, after });
  check("search: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

// ── a finite browse listing: gay + VR only is 231 videos upstream (4 pages) ──
{
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const errors = [];
  const api = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
  page.on("request", (r) => {
    if (r.url().includes("/api/videos")) api.push(r.url().replace(BASE, ""));
  });
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".unit", { timeout: 45000 });
  await sleep(2000);

  // sidebar → Gay, then the listing switch → VR only
  await page.evaluate(() => {
    const gay = [...document.querySelectorAll(".sidebar .nav-item")].find((b) => b.textContent.trim() === "Gay");
    gay?.click();
  });
  await sleep(3500);
  await page.evaluate(() => {
    const chip = [...document.querySelectorAll(".section-filters .chip")].find((c) => /VR/i.test(c.textContent));
    chip?.click();
  });
  // the VR switch turns on, then the grid reloads with the VR-only listing
  await page.waitForFunction(
    () => [...document.querySelectorAll(".section-filters .chip--on")].some((c) => /VR/i.test(c.textContent)),
    { timeout: 30000 },
  );
  await page.waitForFunction(() => document.querySelectorAll(".unit").length > 0, { timeout: 40000 });
  await sleep(2500);

  const cards = await scrollToEnd(page, 12);
  const st = await page.evaluate(() => ({
    cards: document.querySelectorAll(".unit").length,
    end: document.querySelector(".list-end")?.textContent?.trim() || null,
    errorBox: document.querySelector(".status-box")?.textContent?.trim().slice(0, 80) || null,
    sentinel: document.querySelector(".infinite-sentinel")?.textContent?.trim() || null,
    heading: document.querySelector(".section-title")?.textContent,
  }));
  check(
    "browse listing shows every video upstream has (gay VR = 231)",
    st.cards === 231,
    { cards: st.cards, heading: st.heading },
  );
  check("browse listing ends cleanly instead of erroring on the last page", !!st.end && !st.errorBox && !st.sentinel, { end: st.end, errorBox: st.errorBox });
  // upstream has 4 pages here, so the grid asks for pages 1-4 and then probes
  // page 5, which answers 404 → that is where it must stop for good
  const vrPages = api.filter((u) => /vr=1/.test(u));
  check(
    "browse listing probes the page after the last one, then stops",
    vrPages.length === 5 && /page=5/.test(vrPages[vrPages.length - 1]),
    { vrPages },
  );
  const before = api.length;
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(3000);
  check("scrolling at the end fires no further page requests", api.length === before, {
    extra: api.slice(before),
  });
  check("browse listing: no runtime errors", errors.length === 0, errors.slice(0, 3));
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
