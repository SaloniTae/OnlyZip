// Typed client for our own /api endpoints.

export type Orientation = "straight" | "gay" | "transgender";
export type ListName = "all" | "new";

export interface Video {
  id: string;
  title: string;
  url: string; // absolute link to faphouse2.com video page
  thumb?: string;
  preview?: string; // hover preview mp4 (upstream CDN)
  duration?: string;
  quality?: string; // HD | 4K | 7K | 5K …
  channel?: string;
  channelUrl?: string;
  vr?: boolean;
}

export interface Listing {
  videos: Video[];
  total?: number;
  error?: string;
}

export interface ResolveResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  poster?: string;
  preview?: string; // signed trailer mp4 playable in our player
  related: Video[];
}

export async function fetchVideos(opts: {
  mode: "list" | "search";
  q?: string;
  list?: ListName;
  orientation: Orientation;
  vr: boolean;
  page: number;
}): Promise<Listing> {
  const params = new URLSearchParams({
    orientation: opts.orientation,
    page: String(opts.page),
  });
  if (opts.vr) params.set("vr", "1");

  let path: string;
  if (opts.mode === "search" && opts.q) {
    path = "/api/search";
    params.set("q", opts.q);
  } else {
    path = "/api/videos";
    if (opts.mode === "list" && opts.list === "new") params.set("list", "new");
  }

  const res = await fetch(`${path}?${params.toString()}`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return (await res.json()) as Listing;
}

export async function resolveVideo(idOrUrl: string): Promise<ResolveResult> {
  const target = /^https?:\/\//.test(idOrUrl) ? idOrUrl : `/videos/${idOrUrl}`;
  const res = await fetch(`/api/resolve?url=${encodeURIComponent(target)}`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return (await res.json()) as ResolveResult;
}
