// faphouse.mjs — HTML parser for faphouse2.com listing pages.
// The site has no public API; listing pages are server-rendered HTML, so we
// parse the video-card markup (same technique porzo-style aggregators use).

export const UPSTREAM = "https://faphouse2.com";

// ---------- tiny helpers ----------

// Upstream answers 404/410 for "nothing here": a search with no hits, a page
// past the last one, a profile that does not exist. Callers decide which of
// those are an error and which are just the end of a list.
const isPastEnd = (err) => !!err && (err.status === 404 || err.status === 410);

const decodeEntities = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const stripTags = (s) => decodeEntities(String(s).replace(/<[^>]*>/g, "")).trim();

const attr = (tag, name) => {
  const m =
    tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i")) ||
    tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? decodeEntities(m[1]) : undefined;
};

// ---------- card extraction ----------
//
// One tile looks like:
// <a class="t-vl" href="/videos/<slug>">
//   <span class="t-iw"><img class="t-i" src="https://ic-nss.flixcdn.com/..." srcset="... 1x, ... 2x" alt="Studio: Title"></span>
//   <span class="t-vb"><div class="t-vi">4K <span>23:18</span></div></span>
//   <div class="t-v__info" data-poster-src="..." data-sources='[{"src":"https://thumb-ah.flixcdn.com/....mp4",...}]'></div>
// </a>
// <div class="t-t">
//   <a class="t-ta" href="/models/<slug>"><img src=".../avatar1.jpg" width="36" height="36"></a>
//   <div class="t-tc" title="Title">
//     <a class="t-tv" href="/videos/<slug>">Title</a>
//     <span class="t-ti"><a class="t-tia" href="/models/<slug>">…</a><a class="t-ti-s" href="/models/<slug>">Channel</a></span>
//   </div>
// </div>
//
// The uploader anchor (and with it the *profile* avatar) sits in the info block
// that follows the media anchor — the tile is therefore parsed as one segment
// running from a media anchor to the next one.

const TILE_START_RE = /<a[^>]+class="t-vl"[^>]*>/g;
// a tile is ~1.5 kB of markup; anything past this is a different element
const TILE_MAX = 9000;

/** The uploader/profile anchor inside a tile's info block (t-ta or t-tia). */
function findUploaderAnchor(info) {
  const re = /<a\b([^>]*)>([\s\S]{0,900}?)<\/a>/gi;
  let m;
  while ((m = re.exec(info))) {
    const tag = `<a ${m[1]}>`;
    const cls = attr(tag, "class") || "";
    if (!/(^|\s)t-t(?:a|ia)(\s|$)/.test(cls)) continue;
    const href = attr(tag, "href");
    const img = m[2].match(/<img[^>]*>/i);
    if (href && img) return { href, avatar: attr(img[0], "src"), alt: attr(img[0], "alt") };
  }
  return null;
}

function parseTile(seg) {
  const open = seg.slice(0, seg.indexOf(">") + 1);
  const href = attr(open, "href");
  if (!href || !href.startsWith("/videos/")) return null;

  // media lives inside the t-vl anchor, the title + uploader follow it
  const closeIdx = seg.indexOf("</a>", open.length);
  const media = closeIdx > 0 ? seg.slice(open.length, closeIdx) : seg;
  const info = closeIdx > 0 ? seg.slice(closeIdx) : "";

  const img = media.match(/<img[^>]+class="t-i"[^>]*>/i) || media.match(/<img[^>]*>/i);
  const thumb = img ? attr(img[0], "src") : undefined;
  const alt = img ? attr(img[0], "alt") : undefined;

  // duration + quality from "HD <span>17:51</span>"
  let quality, duration;
  const vi = media.match(/class="t-vi"[^>]*>([\s\S]*?)<\/div>/);
  if (vi) {
    quality = stripTags(vi[1].replace(/<span[\s\S]*?<\/span>/g, "")) || undefined;
    const d = vi[1].match(/<span[^>]*>([\d:]+)<\/span>/);
    if (d) duration = d[1];
  }

  // title: the tile's own text anchor, then its title attribute, then the alt
  let title;
  const tv = info.match(/class="t-tv"[^>]*>([\s\S]*?)<\/a>/);
  if (tv) title = stripTags(tv[1]);
  if (!title) {
    const tc = info.match(/class="t-tc"[^>]*\stitle="([^"]*)"/);
    if (tc) title = decodeEntities(tc[1]).trim();
  }
  if (!title && alt) title = alt.replace(/^[^:]+:\s*/, ""); // "Studio: Title" fallback
  if (!title) return null;

  // channel/studio name + link
  let channel, channelUrl;
  const ch = info.match(/class="t-ti-s[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  if (ch) {
    channelUrl = ch[1];
    channel = stripTags(ch[2]);
  } else if (alt && alt.includes(":")) {
    channel = alt.split(":")[0].trim();
  }

  // who uploaded it: the tile's avatar anchor (models / pornstars / studios)
  const av = findUploaderAnchor(info);
  let uploader;
  if (av) {
    const um = av.href.match(/^\/(models|pornstars|studios)\/([a-z0-9-]+)/i);
    if (um) {
      const section = um[1].toLowerCase();
      uploader = {
        kind: section === "studios" ? "studio" : section === "pornstars" ? "pornstar" : "creator",
        slug: um[2],
        name: channel || stripTags(av.alt || "") || undefined,
        avatar: av.avatar,
        url: UPSTREAM + av.href.split(/[?#]/)[0],
      };
    }
  }

  // hover preview mp4 (data-sources JSON) — may sit in the media or the info
  // block. Keep every rendition the tile offers (normally one 720p H.264) so
  // the client can pick adaptively per connection.
  let preview;
  let previewSources;
  const srcBlob = seg.match(/data-sources="([^"]*)"/) || seg.match(/data-sources='([^']*)'/) || "";
  if (srcBlob[1]) {
    try {
      const arr = JSON.parse(decodeEntities(srcBlob[1]));
      if (Array.isArray(arr)) {
        const renditions = arr
          .filter((s) => s && typeof s.src === "string" && s.src)
          .map((s) => ({ src: s.src, type: typeof s.type === "string" ? s.type : undefined }));
        if (renditions.length > 0) {
          preview = renditions[0].src;
          if (renditions.length > 1) previewSources = renditions;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const vr = /vr-label/.test(seg);
  const fanclub = /btn_square-fan/.test(seg);

  const url = UPSTREAM + href.split("#")[0];
  const slugId = href.split("#")[0].replace("/videos/", "");
  return {
    id: slugId,
    title,
    url, // absolute link to the real video page
    thumb: thumb || undefined,
    preview: preview || undefined,
    previewSources: previewSources || undefined,
    duration: duration || undefined,
    quality: quality || undefined,
    channel: channel || undefined,
    channelUrl: channelUrl ? UPSTREAM + channelUrl.split(/[?#]/)[0] : undefined,
    uploader,
    fanclub: fanclub || undefined,
    vr: vr || /\/videos\/vr/.test(href) ? true : undefined,
  };
}

// ---------- creators (models / pornstars) ----------
//
// <div class="creator" data-el="Creator">
//   <a href="/models/alina-rai" title="Alina Rai" class="creator__thumb">
//     <img class="creator__thumb-picture" src="…avatar-x480…" alt="Alina Rai">
//   </a>
//   <div class="creator__bottom"><p class="creator__studio-title">
//     <a href="/models/alina-rai" title="Alina Rai">Alina Rai</a>…
//     <span class="creator__counter"><span class="creator__counter-number">74</span>
//     <span class="creator__counter-text">videos</span></span>

// creator cards exist in two shapes: the big directory card (creator__thumb)
// and the compact slider card on profile pages (related-studio__thumb)
const CREATOR_ANCHOR_RE =
  /<a\s+[^>]*href="\/(models|pornstars)\/([a-z0-9-]+)"[^>]*class="[^"]*(?:creator__thumb|related-studio__thumb)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

/** Parse every creator card on a page (creator search, /models, profile side-rails). */
export function parseCreators(html) {
  const creators = [];
  const seen = new Set();
  const re = new RegExp(CREATOR_ANCHOR_RE.source, "gi");
  let m;
  while ((m = re.exec(html))) {
    const kind = m[1];
    const slug = m[2];
    const inner = m[3];
    const key = `${kind}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const imgTag = inner.match(/<img[^>]*>/i);
    const avatar = imgTag ? attr(imgTag[0], "src") : undefined;
    const name = (imgTag && attr(imgTag[0], "alt")) || undefined;

    // the counter block sits in the card body right after the thumb anchor
    const tail = html.slice(m.index + m[0].length, m.index + m[0].length + 900);
    const block = tail.split(/<div class="creator"|<div class="content-slide/)[0];
    const titleM = block.match(
      new RegExp(`href="\/${kind}\/${slug}"[^>]*title="([^"]*)"`),
    );
    const counters = [...block.matchAll(/creator__counter-number">\s*([\d,\s]+?)\s*<\/span>\s*<span class="creator__counter-text">\s*([a-z]+)/gi)];
    const countOf = (label) => {
      const hit = counters.find((c) => c[2].toLowerCase().startsWith(label));
      return hit ? Number(hit[1].replace(/[^\d]/g, "")) : undefined;
    };

    creators.push({
      kind: kind === "pornstars" ? "pornstar" : "creator",
      slug,
      name: stripTags(titleM?.[1] || name || slug),
      url: `${UPSTREAM}/${kind}/${slug}`,
      avatar,
      videoCount: countOf("video"),
      photoCount: countOf("photo"),
    });
  }

  // "14 of 14 creators shown"
  const totalM = html.match(/([\d,]+)\s+of\s+([\d,]+)\s+creators shown/i);
  const total = totalM
    ? Number(totalM[2].replace(/[^\d]/g, ""))
    : (() => {
        const m2 = html.match(/Explore\s+([\d,]+)\s+creators/i);
        return m2 ? Number(m2[1].replace(/[^\d]/g, "")) : undefined;
      })();

  return { creators, total };
}

// ---------- categories ----------
//
// <a href="/c/amateur/videos" class="thumb-category-v2" data-el="Thumb">
//   <div class="thumb-category-v2__image-wrap"><img class="thumb-category-v2__image" src=…></div>
//   <div class="thumb-category-v2__title">Amateur</div>
//   <div class="thumb-category-v2__counter">327,713 videos</div>
// </a>

const CATEGORY_RE =
  /<a\s+[^>]*href="\/c\/([a-z0-9-]+)\/videos"[^>]*class="[^"]*thumb-category-v2[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

/** Parse the category grid (/categories) into a slug/name/image/count list. */
export function parseCategories(html) {
  const out = [];
  const seen = new Set();
  let m;
  while ((m = CATEGORY_RE.exec(html))) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const inner = m[2];
    const imgTag = inner.match(/<img[^>]*>/i);
    const titleM = inner.match(/thumb-category-v2__title"[^>]*>([\s\S]*?)<\/div>/i);
    const countM = inner.match(/thumb-category-v2__counter"[^>]*>([\s\S]*?)<\/div>/i);
    out.push({
      slug,
      name: stripTags(titleM?.[1] || slug),
      url: `${UPSTREAM}/c/${slug}/videos`,
      thumb: imgTag ? attr(imgTag[0], "src") : undefined,
      videoCount: countM ? Number(stripTags(countM[1]).replace(/[^\d]/g, "")) || undefined : undefined,
    });
  }
  return { categories: out };
}

/**
 * Related searches shown on a faphouse2 search page ("Mature Anal", "Teen
 * Anal", …). They are RelatedItem anchors pointing at /search/videos?q=…
 */
export function parseRelatedSearches(html) {
  const out = [];
  const seen = new Set();
  const re = /<a\b([^>]*)>([\s\S]{0,220}?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = `<a ${m[1]}>`;
    // only the site's own "related searches" block — not the orientation
    // switcher, pagination or any other /search/ link on the page
    const el = attr(tag, "data-el") || "";
    const spot = attr(tag, "data-el-spot") || "";
    if (el !== "RelatedItem" && !/^related_/.test(spot)) continue;
    const href = attr(tag, "href") || "";
    if (!/^\/search\//.test(href)) continue;
    // a related *search* is a plain query — skip filter/pagination variants
    if (/[?&](type|orientation|page|quality|length|gold|fan|vod|categories)=/.test(href)) continue;
    const qm = href.match(/[?&]q=([^&]*)/);
    if (!qm) continue;
    const q = decodeURIComponent(qm[1].replace(/\+/g, " ")).trim();
    if (!q || seen.has(q.toLowerCase())) continue;
    const label = stripTags(m[2]) || q;
    if (!label) continue;
    seen.add(q.toLowerCase());
    out.push({ q, label });
  }
  return out.slice(0, 16);
}

/** Parse a listing/search HTML page into { videos, total } */
export function parseListing(html) {
  const videos = [];
  const seen = new Set();

  // every tile starts at a media anchor and ends where the next one starts
  const starts = [];
  let m;
  TILE_START_RE.lastIndex = 0;
  while ((m = TILE_START_RE.exec(html))) starts.push(m.index);
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i];
    const next = starts[i + 1] ?? from + TILE_MAX;
    const card = parseTile(html.slice(from, Math.min(next, from + TILE_MAX)));
    if (card && !seen.has(card.id)) {
      seen.add(card.id);
      videos.push(card);
    }
  }

  // faphouse2.com does not publish a per-listing total: the only "N videos"
  // text on the page is the site-wide search placeholder ("Search 2,265,088
  // videos"), which used to make infinite scroll page forever. Only trust an
  // explicit "N videos found" line if the site ever adds one.
  const totalM = html.match(/([\d,]+)\s+videos?\s+found/i);
  const total = totalM ? Number(totalM[1].replace(/[^\d]/g, "")) : undefined;

  return { videos, total };
}

// ---------- fetch with browser-like headers ----------

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Upstream is the source of truth, so every endpoint re-reads it. A very short
// in-memory TTL only exists to collapse bursts (paging + duplicate widgets), and
// is skipped entirely for anything the caller wants straight from the wire.
const htmlCache = new Map();
const CACHE_TTL = 30_000;

export async function fetchUpstreamCached(pathWithQuery, ttl = CACHE_TTL) {
  const hit = htmlCache.get(pathWithQuery);
  const now = Date.now();
  if (hit && now - hit.at < ttl) return hit.html;
  const html = await fetchUpstream(pathWithQuery);
  htmlCache.set(pathWithQuery, { at: now, html });
  if (htmlCache.size > 200) {
    for (const [k, v] of htmlCache) if (now - v.at > 120_000) htmlCache.delete(k);
  }
  return html;
}

export async function fetchUpstream(pathWithQuery, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(UPSTREAM + pathWithQuery, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const err = new Error(`Upstream ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// ---------- public endpoints ----------

/**
 * Search videos. orientation: "straight" | "gay" | "transgender".
 * Upstream exposes orientation-scoped search at /search/videos, /gay/search/videos,
 * /transgender/search/videos (a bare /search?q= redirects by cookie, so always use
 * the explicit scoped path). VR variant adds &type=vr.
 */
export async function searchVideos(q, { page = 1, orientation = "straight", vr = false, sort } = {}) {
  const params = new URLSearchParams({ q });
  // upstream's own search filters: type=vr | new | popular | relevance
  if (vr) params.set("type", "vr");
  else if (sort === "new" || sort === "popular") params.set("type", sort);
  if (page > 1) params.set("page", String(page));
  const prefix =
    orientation === "gay" ? "/gay" : orientation === "transgender" ? "/transgender" : "";
  let html;
  try {
    html = await fetchUpstream(`${prefix}/search/videos?${params}`);
  } catch (err) {
    // a search with no hits answers 404 — that is an empty result, not a failure
    if (isPastEnd(err)) return { videos: [], relatedSearches: [], end: true };
    throw err;
  }
  const listing = parseListing(html);
  // an empty page (or a page past the last one) means the results stopped here
  return {
    ...listing,
    relatedSearches: parseRelatedSearches(html),
    end: listing.videos.length === 0 ? true : undefined,
  };
}

/**
 * Browse a listing: "new" | "best" | "all" plus orientation + vr + page, and
 * optionally a category slug (/c/<slug>/videos) or the Ultra section (/ultra).
 */
export async function listVideos({
  list = "all",
  orientation = "straight",
  vr = false,
  page = 1,
  category,
  ultra = false,
} = {}) {
  const params = new URLSearchParams();
  if (list === "new" && !category && !ultra) params.set("type", "new");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();

  let path;
  if (ultra) {
    path = "/ultra";
  } else if (category) {
    const prefix =
      orientation === "gay" ? "/gay" : orientation === "transgender" ? "/transgender" : "";
    path = `${prefix}/c/${encodeURIComponent(category)}/videos`;
  } else if (vr) {
    path = orientation === "gay" ? "/gay/videos/vr" : "/videos/vr";
  } else if (orientation === "gay") {
    path = "/gay/videos";
  } else if (orientation === "transgender") {
    path = "/transgender/videos";
  } else {
    path = "/videos";
  }
  let html;
  try {
    html = await fetchUpstreamCached(path + (qs ? `?${qs}` : ""));
  } catch (err) {
    // past the last page upstream answers 404; that is simply the end of the list
    if (page > 1 && isPastEnd(err)) return { videos: [], end: true };
    throw err;
  }
  const listing = parseListing(html);
  return { ...listing, end: listing.videos.length === 0 ? true : undefined };
}

// ---------- creators + categories endpoints ----------

/** Search creators (/models?q=) or list them when q is empty. */
export async function listCreators({ q = "", page = 1 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  const html = await fetchUpstreamCached(`/models${qs ? `?${qs}` : ""}`);
  const { creators, total } = parseCreators(html);
  return { creators, total };
}

/**
 * A creator's own page: header identity (name, avatar), bio, their videos
 * (page by page) and the "related creators" rail.
 */
export async function getCreator(pathOrSlug, { page = 1, kind } = {}) {
  const m = String(pathOrSlug).match(/\/(models|pornstars|studios)\/([a-z0-9-]+)/i);
  const slug = (m ? m[2] : String(pathOrSlug)).split(/[?#]/)[0];
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    const err = new Error("Not a creator slug");
    err.status = 400;
    throw err;
  }
  // models + pornstars are people, studios are the channels that upload
  const requested = (m ? m[1] : String(kind || "creator")).toLowerCase();
  const section = requested === "pornstars" || requested === "pornstar"
    ? "pornstars"
    : requested === "studios" || requested === "studio"
      ? "studios"
      : "models";
  const url = `/${section}/${slug}${page > 1 ? `?page=${page}` : ""}`;
  let html;
  try {
    html = await fetchUpstream(url);
  } catch (err) {
    // the profile's grid is finite: upstream answers 404 once a page is past
    // the end, which is what should end the grid — not an error banner
    if (page > 1 && isPastEnd(err)) {
      return { slug, kind: section === "pornstars" ? "pornstar" : section === "studios" ? "studio" : "creator", name: slug, url: `${UPSTREAM}/${section}/${slug}`, videos: [], related: [], end: true };
    }
    throw err;
  }

  const headerTag = html.match(/<[^>]*data-el="StudioHeader"[^>]*>/i);
  const handle = headerTag ? headerTag[0] : "";
  const avatarAttr = attr(handle, "data-el-avatar");
  const avatarImg = html.match(/<img[^>]+class="fh-studio-avatar__img"[^>]*>/i);
  const titleM = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name =
    attr(handle, "data-el-username") ||
    (titleM ? stripTags(titleM[1]).replace(/\s+Porn Videos.*$/i, "").trim() : slug);

  // bio: the profile's details block, skipping the "Creator / Pornstar" role
  // row and any awards furniture, plus the "Also known as" aliases
  let description;
  const blockM = html.match(/details-block__content"[^>]*>([\s\S]*?)<\/details>/i);
  const block = blockM ? blockM[1] : html;
  const paragraphs = [...block.matchAll(/<p(?![^>]*class=)[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((p) => stripTags(p[1]))
    .filter((t) => t && !/^read more/i.test(t));
  if (paragraphs.length) description = paragraphs[0].slice(0, 600);

  const aliasM = block.match(/fh-studio-header__known-as"[^>]*>([\s\S]*?)<\/div>/i);
  const alsoKnownAs = aliasM
    ? stripTags(aliasM[1]).replace(/^also known as:\s*/i, "").trim() || undefined
    : undefined;

  // the profile's own tabs carry the real catalogue size:
  // <span class="switcher-block__title"> Videos <span class="switcher-block__counter"> 114 </span>
  const switcherCount = (label) => {
    const hit = html.match(
      new RegExp(
        `switcher-block__title">\\s*${label}\\s*<span[^>]*switcher-block__counter[^>]*>\\s*([\\d,]+)`,
        "i",
      ),
    );
    return hit ? Number(hit[1].replace(/[^\d]/g, "")) : undefined;
  };
  const videoCount = switcherCount("Videos");
  const photoCount = switcherCount("Photos");

  const { videos } = parseListing(html);
  const { creators: related } = parseCreators(html);
  const mine = videos.filter((v) => v.id !== slug);
  // how many videos this profile has in total — the grid loads up to that many
  // and then stops, exactly like the upstream page does
  const total = videoCount ?? mine.length;

  return {
    slug,
    kind: section === "pornstars" ? "pornstar" : section === "studios" ? "studio" : "creator",
    name,
    url: `${UPSTREAM}/${section}/${slug}`,
    avatar: avatarAttr || (avatarImg ? attr(avatarImg[0], "src") : undefined),
    description,
    alsoKnownAs,
    videoCount,
    photoCount,
    total,
    videos: mine,
    related: related.filter((c) => c.slug !== slug).slice(0, 18),
    end: mine.length === 0 ? true : undefined,
  };
}

/** The full category index (/categories). */
export async function listCategories() {
  const html = await fetchUpstreamCached("/categories", 300_000);
  return parseCategories(html);
}

/** Resolve a card path (/videos/xxx) into an absolute upstream URL (redirect target). */
export function videoUrlFromPath(pathOrUrl) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return UPSTREAM + pathOrUrl;
}

// ---------- video page (watch) ----------

const OG_RE =
  /<meta[^>]+(?:property|name)="(og:[a-z_:]+|twitter:[a-z_:]+)"[^>]+content="([^"]*)"/gi;

function extractSlug(pathOrUrl) {
  const s = String(pathOrUrl || "").split(/[?#]/)[0];
  const m = s.match(/\/videos\/([a-z0-9-]+)/i);
  if (m) return m[1];
  // a bare slug is accepted too (search bar / hand-typed ids)
  return /^[a-z0-9-]{2,}$/i.test(s) ? s : null;
}

/**
 * Fetch a faphouse2.com video page and extract everything our watch page needs:
 * og metadata (title, description, poster), the video's own preview/trailer MP4
 * (public CDN mp4 we can play in our custom player), and related videos.
 */
export async function resolveVideo(pathOrUrl) {
  const slug = extractSlug(pathOrUrl);
  if (!slug) {
    const err = new Error("Not a faphouse video URL");
    err.status = 400;
    throw err;
  }
  const html = await fetchUpstream(`/videos/${slug}`);

  const meta = {};
  let m;
  OG_RE.lastIndex = 0;
  while ((m = OG_RE.exec(html))) meta[m[1]] = decodeEntities(m[2]);

  // og:image is a 1200x630 poster for this exact video
  const poster = meta["og:image"] || undefined;

  // The video page ships a public trailer mp4 on the page's own player:
  // <video id="video-trailer" ... data-fallback="https://video-nss.flixcdn.com/<sig>/<id>/trailer/720.mp4"
  //        data-av1-fallback=".../trailer/720.av1.mp4">
  // Both renditions are exposed so the client can pick the (usually smaller)
  // AV1 one on slower links; H.264 stays the default.
  let preview;
  let previewSources;
  const trailerEl = html.match(/<video[^>]+id="video-trailer"[^>]*>/i);
  if (trailerEl) {
    const h264 = attr(trailerEl[0], "data-fallback");
    const av1 = attr(trailerEl[0], "data-av1-fallback");
    preview = h264 || av1 || undefined;
    if (preview) {
      previewSources = [
        ...(h264 ? [{ src: h264, type: "video/mp4" }] : []),
        ...(av1 ? [{ src: av1, type: "video/mp4; codecs=av01.0.05M.08" }] : []),
      ];
    }
  }
  if (!preview) {
    const fm = html.match(
      new RegExp(`https://video-nss\\.flixcdn\\.com/[^"'\\s<>]+${slug}/trailer/720\\.mp4`),
    );
    if (fm) preview = fm[0];
  }

  // related videos (the 40-card thumbs wall on the video page)
  const { videos: related } = parseListing(html);

  // who is in the video + its categories + the channel, all from the info block
  const facets = parseVideoFacets(html);

  return {
    id: slug,
    title: meta["og:title"] || slug,
    description: meta["og:description"] || undefined,
    url: `${UPSTREAM}/videos/${slug}`,
    poster,
    preview,
    previewSources,
    studio: facets.studio,
    cast: facets.cast,
    categories: facets.categories,
    related: related.filter((v) => v.id !== slug).slice(0, 24),
  };
}

/**
 * The video page's own info block: the channel/studio (with avatar) plus the
 * "cast" chips (creator avatars) and category chips that link to /c/<slug>.
 */
function parseVideoFacets(html) {
  const start = html.search(/class="video-info-details/);
  const region = start > 0 ? html.slice(start, start + 80_000) : html;

  const cast = [];
  const categories = [];
  const seenCast = new Set();
  const seenCats = new Set();

  const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRe.exec(region))) {
    const tag = `<a ${m[1]}>`;
    const cls = attr(tag, "class") || "";
    if (!/(^|\s)vid-c(\s|$)/.test(cls)) continue;
    const href = attr(tag, "href");
    if (!href) continue;

    const creatorHref = href.match(/^\/(models|pornstars)\/([a-z0-9-]+)/i);
    if (creatorHref) {
      const slug = creatorHref[2];
      if (seenCast.has(slug)) continue;
      seenCast.add(slug);
      const img = m[2].match(/<img[^>]*>/i);
      const titleM = m[2].match(
        /studio-seo-improvements__category-btn-title"[^>]*>([\s\S]*?)<\/span>/i,
      );
      cast.push({
        kind: creatorHref[1].toLowerCase() === "pornstars" ? "pornstar" : "creator",
        slug,
        name: stripTags(titleM?.[1] || (img ? attr(img[0], "alt") : "")) || slug,
        avatar: img ? attr(img[0], "src") : undefined,
        url: UPSTREAM + href.split(/[?#]/)[0],
      });
      continue;
    }

    const catHref = href.match(/^\/c\/([a-z0-9-]+)\/videos/i);
    if (catHref) {
      const cs = catHref[1];
      if (seenCats.has(cs)) continue;
      seenCats.add(cs);
      categories.push({
        slug: cs,
        name: stripTags(m[2]) || cs,
        url: UPSTREAM + href.split(/[?#]/)[0],
      });
    }
  }

  // channel / studio: avatar anchor first, then the plain text link
  let studio;
  const avatarAnchor = region.match(
    /<a\b[^>]*class="[^"]*video-info-details__studio-avatar[^"]*"[^>]*>[\s\S]*?<\/a>/i,
  );
  const avatarTag = avatarAnchor ? avatarAnchor[0] : "";
  const avatarImg = avatarTag.match(/<img[^>]*>/i);
  const linkM = region.match(
    /<a\b[^>]*class="[^"]*video-info-details__studio-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
  );
  if (linkM) {
    const tag = linkM[0].slice(0, linkM[0].indexOf(">") + 1);
    const href = attr(tag, "href");
    studio = {
      kind: !href
        ? "creator"
        : /^\/studios\//i.test(href)
          ? "studio"
          : /^\/pornstars\//i.test(href)
            ? "pornstar"
            : "creator",
      slug: href ? href.replace(/^\/(?:models|studios|pornstars)\//, "").split(/[?#/]/)[0] : undefined,
      name: stripTags(linkM[1]) || undefined,
      url: href ? UPSTREAM + href.split(/[?#]/)[0] : undefined,
      avatar: avatarImg ? attr(avatarImg[0], "src") : undefined,
    };
  }

  return { studio, cast, categories };
}
