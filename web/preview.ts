// Shared trailer-preview scheduler.
//
// beeg.com's own behaviour, extracted from their published bundle:
// - fine-pointer (desktop) devices are hover-driven: a tile starts the instant
//   the cursor lands on it, and any tile the cursor leaves is cancelled (an
//   in-flight fetch is aborted) — nothing auto-plays on scroll. A fast sweep
//   lets only the newest hover win.
// - touch devices auto-preview the in-viewport tile nearest the middle (one on
//   a phone, two on a tablet), buffer a neighbour or two ahead, and stop it all
//   again when the tile scrolls away.
// Here every tile hands its element to this place, which decides: "playing"
// (run), "armed" (buffer, don't show), or "off" (no network).

export type PreviewMode = "off" | "armed" | "playing";

/** Kept for API compatibility: a finger (viewport) or a mouse (hover). */
export type PreviewDriver = "hover" | "viewport";

/** Networking tier, read from the browser (Navigator.connection) at plan time. */
export type NetTier = "fast" | "slow";

/**
 * How strong the current link is. Previews always stay available — that is the
 * product requirement — but a slow link gets a minimal footprint: one slot,
 * nothing prefetched, and the (smaller) AV1 rendition when one exists.
 */
export function netTier(): NetTier {
  const c = (navigator as unknown as {
    connection?: { saveData?: boolean; downlink?: number; effectiveType?: string };
  }).connection;
  if (!c) return "fast";
  if (c.saveData) return "slow";
  if (/3g$|(^|-)2g$/.test(c.effectiveType || "")) return "slow";
  if (typeof c.downlink === "number" && c.downlink > 0 && c.downlink < 2.5) return "slow";
  return "fast";
}

/**
 * Pick a rendition: on slow links prefer the AV1 one (same quality, smaller
 * download) when the browser can actually decode it, otherwise the first
 * playable mp4.
 */
export function pickPreviewSource(sources: { src: string; type?: string }[]): string {
  if (!Array.isArray(sources) || sources.length === 0) return "";
  if (sources.length === 1) return sources[0].src;
  if (netTier() === "slow") {
    const av1 = sources.find((s) => /av01|av1/i.test(s.type || "") || /\.av1\.mp4/i.test(s.src));
    if (
      av1 &&
      (document.createElement("video").canPlayType("video/mp4; codecs=av01.0.05M.08") ||
        document.createElement("video").canPlayType("video/mp4; codecs=av01"))
    ) {
      return av1.src;
    }
  }
  return (
    sources.find((s) => /mp4/.test(s.type || "") || /mp4$/.test(s.src))?.src ?? sources[0].src
  );
}

interface Entry {
  el: Element;
  driver: PreviewDriver;
  setMode: (mode: PreviewMode) => void;
  boost: boolean;
  ratio: number;
  mode: PreviewMode;
}

export interface PreviewHandle {
  /** Hovering a tile makes it win over everything else. */
  setBoost(on: boolean): void;
  release(): void;
}

const entries = new Map<number, Entry>();
let nextId = 1;
let frame = 0;
let observer: IntersectionObserver | null = null;
let listening = false;
// On the watch page the main video has the connection while it plays on screen:
// until the user scrolls it out of view, only a deliberate hover may preview.
let held = false;

export function holdPreviews(on: boolean) {
  if (held === on) return;
  held = on;
  schedule();
}

export function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}


/** How many tiles may play at once on this device. */
function playLimit(): number {
  if (document.visibilityState !== "visible") return 0;
  const w = window.innerWidth;
  if (w < 600) return 1; // phone: one trailer at a time
  if (w < 1024) return 2; // tablet: the two nearest the middle
  return isCoarsePointer() ? 2 : 3;
}

/** Playing + buffering ahead (the next tiles the user is about to reach). */
function armLimit(): number {
  const play = playLimit();
  if (play === 0) return 0;
  // adaptive: on a slow link nothing is prefetched — the full connection is
  // reserved for the tile the user is actually looking at, so the trailer
  // under the eyes starts as fast as that link allows, instead of queueing
  // behind neighbours nobody is watching
  if (netTier() === "slow") return 0;
  return window.innerWidth < 600 ? play + 1 : play + 2;
}

function score(entry: Entry, centre: number, vh: number): number {
  // hovering wins outright
  if (entry.boost) return 10;
  // live-from-the-DOM visibility: a jump straight to the bottom of the page
  // must rank the tiles the user is actually looking at within the first
  // frame, instead of waiting for the IntersectionObserver to catch up and
  // queueing stale rows that were visible a moment ago
  const rect = entry.el.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= vh) return -1;
  const visible = (Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) / Math.max(rect.height, 1);
  const middle = (rect.top + rect.bottom) / 2;
  const closeness = 1 - Math.min(Math.abs(middle - centre) / vh, 1);
  // nearest to the middle first, then the most visible one
  return closeness * 0.65 + Math.min(visible, 1) * 0.35;
}

function plan() {
  frame = 0;

  if (held) {
    // the video being watched has the connection; only the tile the user is
    // deliberately hovering may preview (and it pre-buffered while visible)
    let gave = false;
    for (const entry of entries.values()) {
      apply(entry, !gave && entry.boost ? ((gave = true), "playing") : "off");
    }
    return;
  }

  const coarse = isCoarsePointer();

  if (!coarse) {
    // desktop (beeg): hover-driven only — the cursor's tile plays instantly,
    // everything else may just buffer ahead while visible (keep it capped so a
    // big grid doesn't prefetch a wall of trailers — and on a slow link,
    // nothing at all: the hovered tile is the only thing on the connection)
    let gave = false;
    let armed = 0;
    const armCap = netTier() === "slow" ? 0 : 2;
    for (const entry of entries.values()) {
      if (entry.boost) {
        apply(entry, gave ? "off" : ((gave = true), "playing"));
      } else {
        const s = score(entry, window.innerHeight / 2, window.innerHeight);
        apply(entry, !gave && s >= 0 && armed < armCap ? ((armed += 1), "armed") : "off");
      }
    }
    return;
  }

  const vh = window.innerHeight || 1;
  const centre = vh / 2;

  const ranked: Entry[] = [];
  for (const entry of entries.values()) {
    const s = score(entry, centre, vh);
    if (s >= 0) ranked.push(entry);
  }
  ranked.sort((a, b) => score(b, centre, vh) - score(a, centre, vh));

  const play = playLimit();
  const arm = armLimit();
  const chosen = new Set<Entry>();
  ranked.forEach((entry, i) => {
    chosen.add(entry);
    apply(entry, i < play ? "playing" : i < arm ? "armed" : "off");
  });
  for (const entry of entries.values()) {
    if (!chosen.has(entry)) apply(entry, "off");
  }
}

function apply(entry: Entry, mode: PreviewMode) {
  if (entry.mode === mode) return;
  entry.mode = mode;
  entry.setMode(mode);
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(plan);
}

function ensureObserver() {
  if (!observer && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const entry = byElement.get(record.target);
          if (!entry) continue;
          entry.ratio = record.isIntersecting ? record.intersectionRatio : 0;
        }
        schedule();
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] },
    );
  }
  if (!listening && typeof window !== "undefined") {
    listening = true;
    // scroll moves the viewport centre, so priorities have to be re-ranked
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    document.addEventListener("visibilitychange", schedule);
    // the connection can change mid-session (wifi ↔ cell): re-plan with the
    // new tier, because it decides how much may be prefetched
    const conn = (navigator as unknown as {
      connection?: { addEventListener?: (t: string, f: () => void) => void };
    }).connection;
    try {
      conn?.addEventListener?.("change", schedule);
    } catch {
      /* older connections API */
    }
  }
}

const byElement = new WeakMap<Element, Entry>();

/**
 * Register a tile: the returned callback receives "armed" (buffer it, don't
 * play), "playing", or "off" (don't touch the network at all).
 */
export function registerPreview(
  el: Element,
  driver: PreviewDriver,
  setMode: (mode: PreviewMode) => void,
): PreviewHandle {
  const id = nextId++;
  const entry: Entry = { el, driver, setMode, boost: false, ratio: 0, mode: "off" };
  entries.set(id, entry);
  byElement.set(el, entry);
  ensureObserver();
  observer?.observe(el);
  schedule();

  return {
    setBoost(on: boolean) {
      if (entry.boost === on) return;
      entry.boost = on;
      schedule();
    },
    release() {
      entries.delete(id);
      byElement.delete(el);
      observer?.unobserve(el);
      entry.mode = "off";
      setMode("off");
      schedule();
    },
  };
}
