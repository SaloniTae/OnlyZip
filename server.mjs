// server.mjs — small Node http server that serves the built frontend (dist/)
// plus a JSON API that fetches and parses faphouse2.com listing pages.
//
// Why a server? faphouse2.com sends no CORS headers, so the browser cannot
// fetch it directly — we proxy + parse server-side (porzo-style aggregator),
// while thumbnails/preview MP4s are hotlinked straight from their CDN.

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  searchVideos,
  listVideos,
  listCreators,
  getCreator,
  listCategories,
  fetchUpstream,
  parseListing,
  resolveVideo,
  UPSTREAM,
} from "./lib/faphouse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

// ---------- API routes (all return JSON) ----------

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    // everything here is read live from faphouse2.com — a short edge/browser
    // cache keeps it snappy without ever going stale
    "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
  });
  res.end(body);
}

function fail(res, code, message, extra = {}) {
  json(res, code, { error: message, ...extra });
}

async function handleApi(req, res, url) {
  const p = url.pathname;

  try {
    if (p === "/api/search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return fail(res, 400, "Missing q");
      const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
      const orientation = url.searchParams.get("orientation") || "straight";
      const vr = url.searchParams.get("vr") === "1";
      const rawSort = (url.searchParams.get("sort") || "relevance").toLowerCase();
      const sort = ["relevance", "new", "popular"].includes(rawSort) ? rawSort : "relevance";
      const data = await searchVideos(q, { page, orientation, vr, sort });
      return json(res, 200, data);
    }

    if (p === "/api/videos") {
      const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
      const list = url.searchParams.get("list") || "all";
      const orientation = url.searchParams.get("orientation") || "straight";
      const vr = url.searchParams.get("vr") === "1";
      const ultra = url.searchParams.get("ultra") === "1";
      const rawCategory = (url.searchParams.get("category") || "").trim();
      // only upstream category slugs ever reach the URL we build
      const category = /^[a-z0-9-]{1,64}$/i.test(rawCategory) ? rawCategory : undefined;
      if (rawCategory && !category) return fail(res, 400, "Bad category");
      const data = await listVideos({ list, orientation, vr, page, category, ultra });
      return json(res, 200, data);
    }

    // Creator search (/models?q=) + creator directory
    if (p === "/api/creators") {
      const q = (url.searchParams.get("q") || "").trim();
      const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
      const data = await listCreators({ q, page });
      return json(res, 200, data);
    }

    // One creator: identity, bio, and their own video grid (paged)
    if (p === "/api/creator") {
      const slug = url.searchParams.get("slug") || url.searchParams.get("url") || "";
      if (!slug) return fail(res, 400, "Missing slug");
      const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
      const rawKind = (url.searchParams.get("kind") || "creator").toLowerCase();
      const kind = ["creator", "pornstar", "studio"].includes(rawKind) ? rawKind : "creator";
      const data = await getCreator(slug, { page, kind });
      return json(res, 200, data);
    }

    // Live category index for the filter bar
    if (p === "/api/categories") {
      const data = await listCategories();
      return json(res, 200, data);
    }

    // Watch page data: og meta, preview mp4, related videos
    if (p === "/api/resolve") {
      const target = url.searchParams.get("url") || url.searchParams.get("path") || "";
      if (!target) return fail(res, 400, "Missing url");
      const data = await resolveVideo(target);
      return json(res, 200, data);
    }

    // Generic passthrough for upstream listing paths we haven't wrapped yet:
    // /api/fetch?path=/videos/vr or /gay/videos or /videos?type=new&page=2 …
    if (p === "/api/fetch") {
      const target = url.searchParams.get("path");
      if (!target || !target.startsWith("/")) return fail(res, 400, "Missing path");
      // allow-list: only listing-style paths, no api/query endpoints
      if (
        !/^\/(?:gay\/|transgender\/)?(?:videos|categories|studios|pornstars|models|ultra|search|c\/)/.test(
          target,
        )
      )
        return fail(res, 400, "Path not allowed");
      if (/\/api\/|custodian|\?format=|\?cid=/.test(target))
        return fail(res, 400, "Path not allowed");
      const html = await fetchUpstream(target);
      const data = parseListing(html);
      return json(res, 200, data);
    }

    return fail(res, 404, "Unknown API route");
  } catch (err) {
    const status = err.status || 502;
    return fail(res, status, err.message || "Upstream error");
  }
}

// ---------- static files ----------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function serveStatic(res, filePath) {
  try {
    const st = await stat(filePath);
    if (!st.isFile()) throw new Error("not a file");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
    });
    res.end(await readFile(filePath));
    return true;
  } catch {
    return false;
  }
}

// ---------- server ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }

  // built frontend
  if (await serveStatic(res, path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname))) {
    return;
  }
  // SPA fallback
  if (await serveStatic(res, path.join(DIST, "index.html"))) {
    return;
  }
  res.writeHead(503, { "Content-Type": "text/plain" });
  res.end("Frontend not built. Run: bun run build");
});

server.listen(PORT, HOST, () => {
  console.log(`[faphive] serving dist/ + /api on http://${HOST}:${PORT} (upstream: ${UPSTREAM})`);
});
