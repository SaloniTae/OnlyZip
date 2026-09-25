// faphouse.mjs — HTML parser for faphouse2.com listing pages.
// The site has no public API; listing pages are server-rendered HTML, so we
// parse the video-card markup (same technique porzo-style aggregators use).

export const UPSTREAM = "https://faphouse2.com";

// ---------- tiny helpers ----------

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
// A card looks like:
// <a class="t-vl" href="/videos/<slug>">
//   <span class="t-iw"><img class="t-i" src="https://ic-nss.flixcdn.com/..." srcset="... 1x, ... 2x" alt="Studio: Title"></span>
//   <span class="t-vb"><div class="t-vi">4K <span>23:18</span></div></span>
//   <div class="t-v__info" data-poster-src="..." data-sources='[{"src":"https://thumb-ah.flixcdn.com/....mp4",...}]'></div>
// ...
// <div class="t-t"><div class="t-tc" title="...">
//   <a class="t-tv" href="/videos/<slug>">Title</a>
//   <span class="t-ti"><a class="t-tia" href="/models/x">…</a><a class="t-ti-s" href="/models/x">Channel</a></span>

const CARD_RE = /<a[^>]+class="t-vl"[^>]*>([\s\S]*?)<\/a>/g;

function parseCard(anchorTag, inner) {
  const href = attr(anchorTag, "href");
  if (!href || !href.startsWith("/videos/")) return null;

  const img = inner.match(/<img[^>]+class="t-i"[^>]*>/i) || inner.match(/<img[^>]*>/i);
  let thumb, alt;
  if (img) {
    const tag = img[0];
    thumb = attr(tag, "src");
    alt = attr(tag, "alt");
  }

  // duration + quality from "HD <span>17:51</span>"
  let quality, duration;
  const vi = inner.match(/class="t-vi"[^>]*>([\s\S]*?)<\/div>/);
  if (vi) {
    quality = stripTags(vi[1].replace(/<span[\s\S]*?<\/span>/g, "")) || undefined;
    const d = vi[1].match(/<span[^>]*>([\d:]+)<\/span>/);
    if (d) duration = d[1];
  }

  // title: prefer the .t-tv text anchor
  let title;
  const tv = inner.match(/class="t-tv"[^>]*>([\s\S]*?)<\/a>/);
  if (tv) title = stripTags(tv[1]);
  if (!title && alt) title = alt.replace(/^[^:]+:\s*/, ""); // "Studio: Title" fallback
  if (!title) return null;

  // channel/studio name + link
  let channel, channelUrl;
  const ch = inner.match(/class="t-ti-s[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  if (ch) {
    channelUrl = ch[1];
    channel = stripTags(ch[2]);
  } else if (alt && alt.includes(":")) {
    channel = alt.split(":")[0].trim();
  }

  // hover preview mp4 (data-sources JSON) — may be in the inner html or a sibling div
  let preview;
  const srcBlob =
    inner.match(/data-sources="([^"]*)"/) ||
    inner.match(/data-sources='([^']*)'/) ||
    "";
  if (srcBlob[1]) {
    try {
      const arr = JSON.parse(decodeEntities(srcBlob[1]));
      preview = Array.isArray(arr) && arr[0]?.src ? arr[0].src : undefined;
    } catch {
      /* ignore */
    }
  }

  const vr = /vr-label/.test(inner);

  const url = UPSTREAM + href.split("#")[0];
  const slugId = href.split("#")[0].replace("/videos/", "");
  return {
    id: slugId,
    title,
    url, // absolute link to the real video page
    thumb: thumb || undefined,
    preview: preview || undefined,
    duration: duration || undefined,
    quality: quality || undefined,
    channel: channel || undefined,
    channelUrl: channelUrl ? UPSTREAM + channelUrl : undefined,
    vr: vr || /\/videos\/vr/.test(href) ? true : undefined,
  };
}

/** Parse a listing/search HTML page into { videos, total } */
export function parseListing(html) {
  const videos = [];
  const seen = new Set();
  let m;
  CARD_RE.lastIndex = 0;
  while ((m = CARD_RE.exec(html))) {
    const anchorTag = m[0].slice(0, m[0].indexOf(">") + 1);
    const card = parseCard(anchorTag, m[1]);
    if (card && !seen.has(card.id)) {
      seen.add(card.id);
      videos.push(card);
    }
  }

  // "N videos" total count where present
  const totalM = html.match(/([\d,\s]+)\s+videos/i);
  const total = totalM ? Number(totalM[1].replace(/[^\d]/g, "")) : undefined;

  return { videos, total };
}

// ---------- fetch with browser-like headers ----------

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

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
export async function searchVideos(q, { page = 1, orientation = "straight", vr = false } = {}) {
  const params = new URLSearchParams({ q });
  if (vr) params.set("type", "vr");
  if (page > 1) params.set("page", String(page));
  const prefix =
    orientation === "gay" ? "/gay" : orientation === "transgender" ? "/transgender" : "";
  const html = await fetchUpstream(`${prefix}/search/videos?${params}`);
  return parseListing(html);
}

/** Browse a listing: "new" | "best" | "all" plus orientation + vr + page */
export async function listVideos({
  list = "all",
  orientation = "straight",
  vr = false,
  page = 1,
} = {}) {
  const params = new URLSearchParams();
  if (list === "new") params.set("type", "new");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  let path;
  if (vr) {
    path = orientation === "gay" ? "/gay/videos/vr" : "/videos/vr";
  } else if (orientation === "gay") {
    path = "/gay/videos";
  } else if (orientation === "transgender") {
    path = "/transgender/videos";
  } else {
    path = "/videos";
  }
  const html = await fetchUpstream(path + (qs ? `?${qs}` : ""));
  return parseListing(html);
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
  const m = String(pathOrUrl).match(/\/videos\/([a-z0-9-]+)/i);
  return m ? m[1] : null;
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
  // Prefer the H.264 fallback (browser support), then av1, then any signed trailer URL.
  let preview;
  const trailerEl = html.match(/<video[^>]+id="video-trailer"[^>]*>/i);
  if (trailerEl) {
    preview =
      attr(trailerEl[0], "data-fallback") || attr(trailerEl[0], "data-av1-fallback") || undefined;
  }
  if (!preview) {
    const fm = html.match(
      new RegExp(`https://video-nss\\.flixcdn\\.com/[^"'\\s<>]+${slug}/trailer/720\\.mp4`),
    );
    if (fm) preview = fm[0];
  }

  // related videos (the 40-card thumbs wall on the video page)
  const { videos: related } = parseListing(html);

  return {
    id: slug,
    title: meta["og:title"] || slug,
    description: meta["og:description"] || undefined,
    url: `${UPSTREAM}/videos/${slug}`,
    poster,
    preview,
    related: related.filter((v) => v.id !== slug).slice(0, 24),
  };
}
