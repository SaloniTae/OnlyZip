// Typed client for our own /api endpoints.

export type Orientation = "straight" | "gay" | "transgender";
export type ListName = "all" | "new";
export type Sort = "relevance" | "new" | "popular";

/** Who uploaded a video: a model, a pornstar, or a studio (channel). */
export interface Uploader {
  kind: "creator" | "pornstar" | "studio";
  slug: string;
  name?: string;
  avatar?: string;
  url?: string;
}

/** A preview rendition the tile or video page offers (H.264 / AV1). */
export interface PreviewSource {
  src: string;
  type?: string;
}

export interface Video {
  id: string;
  title: string;
  url: string; // absolute link to faphouse2.com video page
  thumb?: string;
  preview?: string; // hover preview mp4 (upstream CDN)
  previewSources?: PreviewSource[]; // every rendition the tile offers
  duration?: string;
  quality?: string; // HD | 4K | 7K | 5K …
  channel?: string;
  channelUrl?: string;
  uploader?: Uploader; // profile avatar + link for the card's circle
  fanclub?: boolean;
  vr?: boolean;
}

export interface RelatedSearch {
  q: string;
  label: string;
}

export interface Listing {
  videos: Video[];
  total?: number;
  relatedSearches?: RelatedSearch[];
  /** the grid reached the last page upstream has — not an error */
  end?: boolean;
  error?: string;
}

export interface Creator {
  kind: "creator" | "pornstar" | "studio";
  slug: string;
  name: string;
  url: string; // absolute faphouse2.com profile link
  avatar?: string;
  videoCount?: number;
  photoCount?: number;
}

/** Anything that can be opened as a profile (creator rail, uploader, cast). */
export interface ProfileRef {
  kind: "creator" | "pornstar" | "studio";
  slug: string;
  name?: string;
  avatar?: string;
}

export interface CreatorProfile extends Creator {
  description?: string;
  alsoKnownAs?: string;
  /** how many videos this profile has upstream — the grid stops here */
  total?: number;
  /** the requested page was past the last one */
  end?: boolean;
  videos: Video[];
  related: Creator[];
}

export interface Category {
  slug: string;
  name: string;
  url: string;
  thumb?: string;
  videoCount?: number;
}

export interface Studio {
  kind: "creator" | "pornstar" | "studio";
  slug?: string;
  name?: string;
  url?: string;
  avatar?: string;
}

export interface ResolveResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  poster?: string;
  preview?: string; // signed trailer mp4 playable in our player
  previewSources?: PreviewSource[]; // H.264 + AV1 renditions when upstream offers them
  studio?: Studio;
  cast?: Creator[]; // who is in the video (creator avatars from the page)
  categories?: Category[]; // the page's own category chips
  related: Video[];
}

export async function fetchVideos(opts: {
  mode: "list" | "search";
  q?: string;
  list?: ListName;
  orientation: Orientation;
  vr: boolean;
  page: number;
  category?: string;
  ultra?: boolean;
  sort?: Sort;
}): Promise<Listing> {
  const params = new URLSearchParams({
    orientation: opts.orientation,
    page: String(opts.page),
  });
  if (opts.vr) params.set("vr", "1");
  if (opts.sort && opts.sort !== "relevance") params.set("sort", opts.sort);
  if (opts.ultra) params.set("ultra", "1");
  if (opts.category) params.set("category", opts.category);

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

/** Creator search (q) or the directory when q is empty. */
export async function fetchCreators(q = "", page = 1): Promise<{ creators: Creator[]; total?: number }> {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  const res = await fetch(`/api/creators?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { creators: Creator[]; total?: number };
}

/** One creator/studio: profile header, bio and their videos (paged). */
export async function fetchCreator(
  slug: string,
  page = 1,
  kind: Creator["kind"] = "creator",
): Promise<CreatorProfile> {
  const params = new URLSearchParams({ slug, page: String(page) });
  if (kind !== "creator") params.set("kind", kind);
  const res = await fetch(`/api/creator?${params.toString()}`);
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
  return (await res.json()) as CreatorProfile;
}

/** The live category index used by the filter bar. */
export async function fetchCategories(): Promise<{ categories: Category[] }> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { categories: Category[] };
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
