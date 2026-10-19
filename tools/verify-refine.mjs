// Verifies the refined UI:
//  - the circle next to a card is the uploader's *avatar*, never the video frame
//  - tapping that circle opens the uploader's profile (creator / studio)
//  - the home rails carry real avatars, categories still filter
//  - search has faphouse2-style sorting + related searches
//  - studio pages exist and are labelled as studios
import puppeteer from "puppeteer";

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + JSON.stringify(detail) : ""}`);
};

const LAUNCH = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio", "--lang=en-US"],
};

async function scenario(name, hash, fn) {
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("faphive_age_ok", "1");
    } catch {}
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 220)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text().slice(0, 220));
  });
  try {
    await page.goto(`${BASE}/${hash}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await fn(page, errors);
  } catch (err) {
    check(`${name}: scenario completed`, false, String(err).slice(0, 220));
  }
  await browser.close();
}

const avatarInfo = (page) =>
  page.evaluate(() => {
    const img = document.querySelector(".unit__avatar img");
    const first = document.querySelector(".unit");
    return {
      avatarSrc: img?.getAttribute("src") || null,
      channel: first?.querySelector(".unit__line1")?.textContent?.trim() || null,
      title: first?.querySelector(".unit__title")?.textContent?.trim() || null,
      cardAvatarHref: first?.querySelector("a.unit__avatar")?.getAttribute("href") || null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      errors: [],
    };
  });

// ── home: uploader avatars ──
await scenario("home", "#/", async (page, errors) => {
  await page.waitForSelector(".unit__avatar img", { timeout: 45000 });
  await sleep(1200);
  const info = await avatarInfo(page);
  const isFrame = /\/frame\/|\/screen\/|\.mp4|\/xc\//.test(info.avatarSrc || "");
  const isProfileAvatar = /avatar|ic-tt-nss|thumb-ah\.flixcdn\.com\/(studio|xhs2)/.test(info.avatarSrc || "");
  check("card circle shows a profile avatar, not a video frame", !!info.avatarSrc && !isFrame && isProfileAvatar, {
    src: (info.avatarSrc || "").slice(0, 96),
  });
  check("home rails do not overflow horizontally", !info.overflowX, { overflow: info.overflowX });

  const rail = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll(".creator-rail .creator-tile__avatar img")];
    return {
      n: imgs.length,
      frames: imgs.filter((i) => /\/frame\//.test(i.getAttribute("src") || "")).length,
      heads: [...document.querySelectorAll(".rail-head__title")].map((e) => e.textContent),
      studioBadges: [...document.querySelectorAll(".unit__badge")].length,
      fanFlags: [...document.querySelectorAll(".unit__flag")].length,
      gridY: Math.round(document.querySelector(".grid .unit")?.getBoundingClientRect().top + window.scrollY || 0),
      gridLeft: (() => {
        const el = document.querySelector(".grid .unit");
        const chip = document.querySelector(".top-block .chip");
        const head = document.querySelector(".rail-head__title");
        const l = (n) => (n ? Math.round(n.getBoundingClientRect().left) : null);
        return { grid: l(el), chip: l(chip), head: l(head) };
      })(),
    };
  });
  check("creator/channel rail uses avatars only", rail.n > 0 && rail.frames === 0, rail);
  check("home rails are labelled", rail.heads.length >= 1, { heads: rail.heads });
  check("home rows line up with the grid", rail.gridLeft.grid === rail.gridLeft.chip && rail.gridLeft.grid === rail.gridLeft.head, rail.gridLeft);
  check("video cards mark their uploader type", rail.studioBadges > 0, { studioBadges: rail.studioBadges });

  // the circle must open the uploader profile, not the video
  const before = await page.$eval("a.unit__avatar", (a) => a.getAttribute("href"));
  await page.evaluate(() => document.querySelector("a.unit__avatar").click());
  await page.waitForSelector(".creator-head__name", { timeout: 30000 });
  await sleep(1500);
  const prof = await page.evaluate(() => ({
    hash: location.hash,
    name: document.querySelector(".creator-head__name")?.textContent,
    meta: document.querySelector(".creator-head__meta")?.textContent,
    cards: document.querySelectorAll(".unit").length,
  }));
  check(
    "tapping the circle opens the uploader profile",
    prof.hash.replace("#", "") === before?.replace("#", "") && !!prof.name && prof.cards > 0,
    { href: before, ...prof },
  );
  check("home: no runtime errors", errors.length === 0, errors);
});

// ── studio profile (from a card whose uploader is a studio) ──
await scenario("studio", "#/", async (page, errors) => {
  await page.waitForSelector(".unit__avatar img", { timeout: 45000 });
  await sleep(1200);
  const studioHref = await page.evaluate(async () => {
    const res = await fetch("/api/videos?orientation=straight&page=1");
    const data = await res.json();
    const u = (data.videos || []).find((v) => v.uploader && v.uploader.kind === "studio");
    return u ? { hash: `#studio/${u.uploader.slug}`, name: u.uploader.name, avatar: u.uploader.avatar } : null;
  });
  if (!studioHref) {
    check("a studio uploader exists in the listing", false);
    return;
  }
  await page.goto(`${BASE}/${studioHref.hash}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".creator-head__name", { timeout: 30000 });
  await sleep(1500);
  const prof = await page.evaluate(() => ({
    hash: location.hash,
    name: document.querySelector(".creator-head__name")?.textContent,
    meta: document.querySelector(".creator-head__meta")?.textContent,
    avatar: !!document.querySelector(".creator-head__avatar img"),
    cards: document.querySelectorAll(".unit").length,
    relatedHead: document.querySelector(".creator-related__head")?.textContent,
  }));
  check("studio profile opens on #studio/…", prof.hash.startsWith("#studio/") && !!prof.name, {
    hash: prof.hash,
    name: prof.name,
  });
  check("studio profile is labelled Studio and lists videos", /studio/i.test(prof.meta || "") && prof.cards > 0, prof);
  check("studio profile has an avatar", prof.avatar, { avatar: prof.avatar });
  check("studio: no runtime errors", errors.length === 0, errors);
});

// ── search: sort + related searches (faphouse2 behaviour, our UI) ──
await scenario("search", "#search", async (page, errors) => {
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
  await sleep(1500);

  const first = await page.evaluate(() => ({
    title: document.querySelector(".unit__title")?.textContent,
    heading: document.querySelector(".section-title")?.textContent,
    sorts: [...document.querySelectorAll(".filter-row .chip")].map((e) => e.textContent),
    labels: [...document.querySelectorAll(".filter-row__label")].map((e) => e.textContent),
    related: document.querySelectorAll(".chip--ghost").length,
  }));
  check("search results show sort chips (Relevant / Newest / Trending)", first.sorts.length >= 3, {
    sorts: first.sorts.slice(0, 6),
  });
  check("search results show related searches", first.related > 0, { related: first.related });

  // sorting re-runs the query
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".filter-row .chip")].find((b) => b.textContent.trim() === "Newest");
    btn.click();
  });
  await sleep(4000);
  const after = await page.evaluate(() => ({
    title: document.querySelector(".unit__title")?.textContent,
    on: [...document.querySelectorAll(".filter-row .chip--on")].map((e) => e.textContent),
    cards: document.querySelectorAll(".unit").length,
  }));
  check("“Newest” applies and reloads the grid", after.cards > 0 && after.on.includes("Newest"), after);
  check("newest order differs from relevance", after.title !== first.title, {
    relevance: first.title,
    newest: after.title,
  });

  // a related search chip runs that search
  const rel = await page.evaluate(() => {
    const chip = document.querySelector(".chip--ghost");
    const label = chip.textContent.trim();
    chip.click();
    return label;
  });
  await sleep(4500);
  const st = await page.evaluate(() => ({
    heading: document.querySelector(".section-title")?.textContent,
    cards: document.querySelectorAll(".unit").length,
    related: document.querySelectorAll(".chip--ghost").length,
  }));
  check("tapping a related search runs it", st.heading.toLowerCase().includes(rel.toLowerCase()) && st.cards > 0, {
    clicked: rel,
    ...st,
  });

  // the creators rail on a results page lives inside the content column, so its
  // heading has to line up with the grid below it (not add page padding twice)
  const align = await page.evaluate(() => {
    const left = (s) => {
      const el = document.querySelector(s);
      return el ? Math.round(el.getBoundingClientRect().left) : null;
    };
    return {
      railHead: left(".search-creators .rail-head__title"),
      rail: left(".search-creators .creator-tile"),
      grid: left(".grid .unit"),
      sectionTitle: left(".section-title"),
      cards: document.querySelectorAll(".unit").length,
    };
  });
  check(
    "creators rail lines up with the grid",
    align.railHead !== null && align.railHead === align.grid && align.rail === align.grid,
    align,
  );
  check("search: no runtime errors", errors.length === 0, errors);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
