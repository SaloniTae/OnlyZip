import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  fetchCategories,
  fetchCreators,
  fetchVideos,
  resolveVideo,
  type Category,
  type Creator,
  type Listing,
  type ListName,
  type Orientation,
  type ProfileRef,
  type RelatedSearch,
  type Sort,
  type Uploader,
  type Video,
} from "./api";
import {
  CardSkeletons,
  CreatorLine,
  CreatorTile,
  EmptyState,
  ErrorBox,
  RailHead,
  VideoCard,
} from "./components";
import CreatorPage from "./Creator";
import Watch from "./Watch";
import { clearHistory, loadHistory, loadSaved, onStoreChange, relativeDay } from "./store";

const AGE_KEY = "faphive_age_ok";
const UPSTREAM = "https://faphouse2.com";

const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: "straight", label: "Straight" },
  { id: "gay", label: "Gay" },
  { id: "transgender", label: "Trans" },
];

const TAGS = [
  "POV", "Anal", "MILF", "Teen", "Big Tits", "Creampie", "Lesbian", "Blonde",
  "Ebony", "Asian", "Squirt", "Threesome", "Cosplay", "Massage", "Step Mom", "Amateur",
];

// faphouse2's own search sorting (its search sidebar: Relevant / Newest / Trending)
const SORTS: [Sort, string][] = [
  ["relevance", "Relevant"],
  ["new", "Newest"],
  ["popular", "Trending"],
];

// ── routing ──

type Route =
  | { view: "browse" }
  | { view: "saved" }
  | { view: "history" }
  | { view: "watch"; id: string }
  | { view: "creator"; slug: string; kind: "creator" | "pornstar" | "studio" };

function parseHash(): Route {
  const h = window.location.hash;
  if (h.startsWith("#v/")) return { view: "watch", id: decodeURIComponent(h.slice(3)) };
  if (h.startsWith("#studio/")) return { view: "creator", slug: decodeURIComponent(h.slice(8)), kind: "studio" };
  if (h.startsWith("#studio")) return { view: "creator", slug: "", kind: "studio" };
  if (h.startsWith("#creator/")) return { view: "creator", slug: decodeURIComponent(h.slice(9)), kind: "creator" };
  if (h.startsWith("#pornstar/")) return { view: "creator", slug: decodeURIComponent(h.slice(10)), kind: "pornstar" };
  if (h.startsWith("#saved")) return { view: "saved" };
  if (h.startsWith("#history")) return { view: "history" };
  return { view: "browse" };
}

/** Hash for any profile we can open (creator, pornstar or studio). */
function profileHash(p: { kind: ProfileRef["kind"]; slug: string }): string {
  const prefix = p.kind === "studio" ? "studio" : p.kind === "pornstar" ? "pornstar" : "creator";
  return `${prefix}/${encodeURIComponent(p.slug)}`;
}

// ── icons ──

const I = {
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  ),
  new: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" />
    </svg>
  ),
  vr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 20.7 4.6 13.3a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 1 1 6.5 6.5L12 20.7z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
};

// ── age gate ──

function AgeGate({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="age-overlay">
      <div className="age-modal">
        <h2>This is an adult website</h2>
        <h4>Notice to users</h4>
        <p>
          This website contains age-restricted materials including nudity and explicit depictions of
          sexual activity. By entering, you affirm that you are at least 18 years of age or the age of
          majority in your jurisdiction and you consent to viewing sexually explicit content.
        </p>
        <div className="age-actions">
          <button className="btn" onClick={onEnter}>
            Yes, I am 18 or older
          </button>
          <button className="btn btn--glass" onClick={() => (window.location.href = "https://www.google.com")}>
            No, I am under 18
          </button>
        </div>
      </div>
    </div>
  );
}

// ── app ──

export default function App() {
  const [ageOk, setAgeOk] = useState(() => localStorage.getItem(AGE_KEY) === "1");
  const [route, setRoute] = useState<Route>(parseHash);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("straight");
  const [list, setList] = useState<ListName>("all");
  const [vr, setVr] = useState(false);
  const [quality, setQuality] = useState<string | null>(null);
  const [ultra, setUltra] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [sort, setSort] = useState<Sort>("relevance");
  const [categories, setCategories] = useState<Category[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [creatorHits, setCreatorHits] = useState<Creator[]>([]);
  const [resultCreators, setResultCreators] = useState<Creator[]>([]);
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [listDone, setListDone] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState(loadHistory);
  const [saved, setSaved] = useState(loadSaved);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // deep link: /#search opens the search panel directly
  useEffect(() => {
    if (window.location.hash === "#search") setSearchOpen(true);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    if (window.location.hash === "#search") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  useEffect(() => onStoreChange(() => {
    setHistory(loadHistory());
    setSaved(loadSaved());
  }), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setMoreLoading(true);
      else {
        setListLoading(true);
        setError(null);
        setMoreError(null);
      }
      try {
        const data: Listing = await fetchVideos({
          mode: query ? "search" : "list",
          q: query || undefined,
          list,
          orientation,
          vr,
          ultra,
          category: category?.slug,
          sort: query ? sort : undefined,
          page: nextPage,
        });
        const incoming = data.videos ?? [];
        setTotal(data.total);
        if (!append && query) setRelatedSearches(data.relatedSearches ?? []);
        // the upstream publishes no total, so the end of the list is the first
        // page that brings nothing new
        const fresh = append ? incoming.filter((v) => !seenIds.current.has(v.id)) : incoming;
        if (!append) seenIds.current = new Set(fresh.map((v) => v.id));
        else for (const v of fresh) seenIds.current.add(v.id);
        // upstream answers 404 past the last page — that ends the grid instead
        // of raising an error, so infinite scroll stops on "no more videos"
        setListDone(!!data.end || fresh.length === 0);
        setVideos((prev) => (append ? [...prev, ...fresh] : fresh));
        setMoreError(null);
        setPage(nextPage);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // a failure while appending keeps the grid that is already on screen
        if (append) setMoreError(message);
        else {
          setError(message);
          setVideos([]);
        }
      } finally {
        setListLoading(false);
        setMoreLoading(false);
      }
    },
    [query, list, orientation, vr, ultra, category, sort],
  );

  // live upstream directory: categories power the filter bar, /models the creator rail
  useEffect(() => {
    let alive = true;
    fetchCategories()
      .then((r) => alive && setCategories(r.categories))
      .catch(() => {});
    fetchCreators("", 1)
      .then((r) => alive && setTopCreators(r.creators.slice(0, 24)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // creators matching what is being typed in the search field
  useEffect(() => {
    const text = searchText.trim();
    if (!searchOpen || text.length < 2) {
      setCreatorHits([]);
      return;
    }
    let alive = true;
    const t = window.setTimeout(() => {
      fetchCreators(text, 1)
        .then((r) => alive && setCreatorHits(r.creators.slice(0, 6)))
        .catch(() => alive && setCreatorHits([]));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [searchOpen, searchText]);

  // creators matching a committed search, shown above the video results
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResultCreators([]);
      return;
    }
    let alive = true;
    fetchCreators(q, 1)
      .then((r) => alive && setResultCreators(r.creators.slice(0, 12)))
      .catch(() => alive && setResultCreators([]));
    return () => {
      alive = false;
    };
  }, [query]);

  useEffect(() => {
    if (route.view === "browse") void loadPage(1, false);
  }, [loadPage, route.view]);

  const hasMore = !listLoading && !listDone && !moreError && videos.length > 0;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || moreLoading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !moreLoading) void loadPage(page + 1, true);
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, moreLoading, page, loadPage]);

  const openVideo = useCallback((v: Video) => {
    window.location.hash = `v/${encodeURIComponent(v.id)}`;
    setRoute({ view: "watch", id: v.id });
    window.scrollTo({ top: 0 });
  }, []);

  const openVideoById = useCallback(
    async (input: string) => {
      const m = input.match(/\/videos\/([a-z0-9-]+)/i);
      const id = m ? m[1] : input.trim();
      if (!id) return;
      try {
        const info = await resolveVideo(id);
        openVideo({ id: info.id, title: info.title, url: info.url, thumb: info.poster, preview: info.preview });
      } catch {
        openVideo({ id, title: "Video", url: `${UPSTREAM}/videos/${id}` });
      }
    },
    [openVideo],
  );

  const doSearch = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (/^https?:\/\//.test(t) || t.includes("/videos/")) {
      setSearchOpen(false);
      void openVideoById(t);
      return;
    }
    setSearchText(t);
    setQuery(t);
    setQuality(null);
    setSort("relevance");
    setSearchOpen(false);
    // the search panel is a hash overlay — leave it so the URL stays shareable
    if (window.location.hash === "#search") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    window.scrollTo({ top: 0 });
  };

  const resetListing = (fn: () => void) => {
    setDrawerOpen(false);
    fn();
    window.scrollTo({ top: 0 });
  };

  const shown = useMemo(
    () => (quality ? videos.filter((v) => v.quality === quality) : videos),
    [videos, quality],
  );

  // the uploaders (channels/studios) we actually saw in this listing, each with
  // their real profile avatar — never a video frame
  const channels = useMemo(() => {
    const map = new Map<string, Uploader>();
    for (const v of videos) {
      const u = v.uploader;
      if (!u?.slug || !u.avatar) continue;
      const key = `${u.kind}/${u.slug}`;
      if (!map.has(key)) map.set(key, u);
    }
    return [...map.values()].slice(0, 28);
  }, [videos]);

  /** One home rail: directory creators first, then the channels seen in the grid. */
  const railCreators = useMemo(() => {
    const out: Creator[] = [];
    const seen = new Set<string>();
    for (const c of topCreators) {
      if (!c.slug || seen.has(`${c.kind}/${c.slug}`)) continue;
      seen.add(`${c.kind}/${c.slug}`);
      out.push(c);
    }
    for (const u of channels) {
      if (seen.has(`${u.kind}/${u.slug}`)) continue;
      seen.add(`${u.kind}/${u.slug}`);
      out.push({ kind: u.kind, slug: u.slug, name: u.name || u.slug, avatar: u.avatar, url: u.url || "" });
    }
    return out.slice(0, 30);
  }, [topCreators, channels]);

  const qualities = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) if (v.quality && !map.has(v.quality)) map.set(v.quality, v);
    return [...map.keys()].slice(0, 8);
  }, [videos]);

  const openCreator = useCallback((c: ProfileRef | Creator | Uploader) => {
    const kind = (c as ProfileRef).kind === "studio" ? "studio" : (c as ProfileRef).kind === "pornstar" ? "pornstar" : "creator";
    window.location.hash = profileHash({ kind, slug: c.slug });
    setRoute({ view: "creator", slug: c.slug, kind });
    setCreatorHits([]);
    setSearchOpen(false);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  /** Category chips on the watch page land back on the filtered browse grid. */
  const openCategory = useCallback((c: Category) => {
    setCategory(c);
    setUltra(false);
    setQuery("");
    setSearchText("");
    setQuality(null);
    setDrawerOpen(false);
    window.location.hash = "";
    setRoute({ view: "browse" });
    window.scrollTo({ top: 0 });
  }, []);

  const heading = query
    ? `Results for “${query}”`
    : category
      ? `${category.name} videos`
      : ultra
        ? "Ultra videos"
        : quality
          ? `${quality} videos`
          : list === "new"
            ? "Newest videos"
            : vr
              ? orientation === "gay"
                ? "Gay VR videos"
                : orientation === "transgender"
                  ? "Transgender VR videos"
                  : "VR videos"
              : orientation === "gay"
                ? "Gay videos"
                : orientation === "transgender"
                  ? "Transgender videos"
                  : "Featured videos";

  const savedVideos: Video[] = saved.map((s) => ({
    id: s.id,
    title: s.title,
    url: s.url,
    thumb: s.thumb,
    channel: s.channel,
    uploader: s.uploader,
  }));

  const historyVideos: Video[] = history.map((h) => ({
    id: h.id,
    title: h.title,
    url: h.url,
    thumb: h.thumb,
    channel: h.channel,
    uploader: h.uploader,
  }));

  const goHome = () => {
    window.location.hash = "";
    setRoute({ view: "browse" });
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  };

  // ── sidebar / drawer ──

  const navItem = (on: boolean, icon: ReactNode, label: string, onClick: () => void, key?: string) => (
    <button key={key ?? label} className={`nav-item${on ? " nav-item--on" : ""}`} onClick={onClick} title={label}>
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__text">{label}</span>
    </button>
  );

  const sidebar = (
    <aside className={`sidebar${drawerOpen ? " sidebar--open" : ""}`} aria-label="Main navigation">
      <div className="sidebar__body">
        <div className="sidebar__group">
          {navItem(route.view === "browse" && !query && !vr && !ultra && !category, I.home, "Home", () => resetListing(() => {
            setQuery("");
            setSearchText("");
            setQuality(null);
            setVr(false);
            setUltra(false);
            setCategory(null);
            setList("all");
            goHome();
          }))}
          {navItem(route.view === "browse" && list === "new", I.new, "Newest", () =>
            resetListing(() => {
              setQuery("");
              setSearchText("");
              setQuality(null);
              setList("new");
              goHome();
            }),
          )}
          {navItem(vr, I.vr, "VR only", () =>
            resetListing(() => {
              setQuality(null);
              setVr(!vr);
              goHome();
            }),
          )}
        </div>

        <div className="sidebar__group">
          <div className="sidebar__label">Orientation</div>
          {ORIENTATIONS.map((o) =>
            navItem(
              orientation === o.id && route.view === "browse",
              I.grid,
              o.label,
              () =>
                resetListing(() => {
                  setQuery("");
                  setSearchText("");
                  setQuality(null);
                  setOrientation(o.id);
                  goHome();
                }),
              o.id,
            ),
          )}
        </div>

        <div className="sidebar__group">
          <div className="sidebar__label">You</div>
          {navItem(route.view === "saved", I.heart, `Saved${saved.length ? ` (${saved.length})` : ""}`, () =>
            resetListing(() => {
              window.location.hash = "saved";
              setRoute({ view: "saved" });
            }),
          )}
          {navItem(route.view === "history", I.clock, "History", () =>
            resetListing(() => {
              window.location.hash = "history";
              setRoute({ view: "history" });
            }),
          )}
        </div>

        <div className="sidebar__group">
          <div className="sidebar__label">External</div>
          <a className="nav-item" href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">
            <span className="nav-item__icon">{I.ext}</span>
            <span className="nav-item__text">faphouse2.com</span>
          </a>
        </div>
      </div>
    </aside>
  );

  const appBar = (
    <header className={`app-bar${scrolled ? " app-bar--scrolled" : ""}`}>
      <a className="brand" href="#/" onClick={goHome} aria-label="FapHive home">
        <img src="/favicon.svg" alt="FapHive" />
      </a>
      <div className="spacer" />
      <div className="bar-actions">
        <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
          {I.search}
        </button>
        <button
          className="icon-btn sidebar-toggle"
          aria-label="Menu"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {drawerOpen ? I.close : I.menu}
        </button>
      </div>
    </header>
  );

  const searchLayer = searchOpen ? (
    <>
      <div className="search-layer" onClick={closeSearch} />
      <div className="search-panel">
        <div className="search-row">
          <input
            className="search-input"
            type="search"
            autoFocus
            placeholder="Search videos, creators — or paste a video URL"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch(searchText);
              if (e.key === "Escape") setSearchOpen(false);
            }}
          />
          <button className="icon-btn" aria-label="Close search" onClick={closeSearch}>
            {I.close}
          </button>
        </div>

        {searchText.trim().length >= 2 ? (
          <div className="search-suggest">
            <button className="search-suggest__all" onClick={() => doSearch(searchText)}>
              <span className="search-suggest__icon">{I.search}</span>
              Search videos for “{searchText.trim()}”
            </button>
            {creatorHits.length > 0 ? (
              <>
                <div className="search-suggest__label">Creators</div>
                {creatorHits.map((c) => (
                  <CreatorLine
                    key={`${c.kind}/${c.slug}`}
                    c={c}
                    onSelect={(picked) => {
                      setSearchOpen(false);
                      openCreator(picked);
                    }}
                  />
                ))}
              </>
            ) : (
              <div className="search-suggest__empty">No creators match — press Enter for videos.</div>
            )}
          </div>
        ) : (
          <div className="search-hint">
            Try “anal”, “pov”, “mia” — or paste a faphouse2.com video link.
          </div>
        )}
      </div>
    </>
  ) : null;

  const footer = (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-links">
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Copyright</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Takedown</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Contact</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Creators</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Webmasters</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Terms</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">Privacy</a>
          <a href={UPSTREAM} target="_blank" rel="noopener noreferrer nofollow">2257</a>
        </div>
        <div className="footer-note">
          © {new Date().getFullYear()} FapHive — a preview front-end for faphouse2.com. Thumbnails and
          trailer previews are served by their CDN; full videos open on faphouse2.com. 18+ only.
        </div>
      </div>
    </footer>
  );

  // beeg shows its back-to-top FAB on phones (also on the watch page),
  // but not on desktop watch, where the rail already anchors the fold.
  const fab = scrolled ? (
    <button
      className={`fab${route.view === "watch" ? " fab--mobile" : ""}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      {I.up}
    </button>
  ) : null;

  const ageGate = !ageOk ? (
    <AgeGate
      onEnter={() => {
        localStorage.setItem(AGE_KEY, "1");
        setAgeOk(true);
      }}
    />
  ) : null;

  // ── watch ──

  if (route.view === "watch") {
    return (
      <>
        {ageGate}
        {appBar}
        {searchLayer}
        {/* constant top padding — toggling it on scroll shifted the whole page */}
        <div className="main main--watch">
          <Watch
            id={route.id}
            onSelect={openVideo}
            onSelectCreator={openCreator}
            onSelectCategory={openCategory}
            onBack={() => {
              window.location.hash = "";
              setRoute({ view: "browse" });
            }}
          />
          {footer}
        </div>
        {sidebar}
        {drawerOpen && <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
        {fab}
      </>
    );
  }

  // ── creator profile ──

  if (route.view === "creator") {
    return (
      <>
        {ageGate}
        {appBar}
        {searchLayer}
        <div className="main">
          <CreatorPage
            slug={route.slug}
            kind={route.kind}
            onSelect={openVideo}
            onSelectCreator={openCreator}
            onBack={goHome}
          />
          {footer}
        </div>
        {sidebar}
        {drawerOpen && <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
        {fab}
      </>
    );
  }

  // ── saved / history ──

  if (route.view === "saved" || route.view === "history") {
    const isSavedView = route.view === "saved";
    const data = isSavedView ? savedVideos : historyVideos;
    return (
      <>
        {ageGate}
        {appBar}
        {searchLayer}
        <div className="main">
          <div className="container">
            <div className="section-head">
              <div className="section-title">{isSavedView ? "Saved videos" : "Watch history"}</div>
              <div className="section-sub">{data.length} videos</div>
              {data.length > 0 && (
                <button
                  className="section-action"
                  onClick={() => {
                    if (isSavedView) localStorage.removeItem("faphive_saved");
                    else clearHistory();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {data.length === 0 ? (
              <div className="status-box">
                <div className="big">{isSavedView ? "♡" : "🕒"}</div>
                <div>{isSavedView ? "Nothing saved yet — tap the heart on any tile." : "You haven’t watched anything yet."}</div>
              </div>
            ) : (
              <div className="grid">
                {data.map((v) => (
                  <VideoCard
                    key={v.id}
                    v={v}
                    onSelect={openVideo}
                    onSelectCreator={openCreator}
                    meta={isSavedView ? undefined : [relativeDay(history.find((h) => h.id === v.id)?.ts ?? Date.now())]}
                  />
                ))}
              </div>
            )}
          </div>
          {footer}
        </div>
        {sidebar}
        {drawerOpen && <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
        {fab}
      </>
    );
  }

  // ── browse ──

  return (
    <>
      {ageGate}
      {appBar}
      {searchLayer}

      <div className="main">
        <div className="top-block">
          <div className="top-rows">
            {categories.length > 0 && (
              <section className="rail">
                <RailHead title="Browse categories" />
                <div className="row-scroller no-scrollbar">
                  <div className="rail-track">
                    <div className="chips">
                      <button
                        className={`chip chip--sm chip--ultra${ultra ? " chip--on" : ""}`}
                        title="Ultra videos"
                        onClick={() => {
                          setUltra(!ultra);
                          setCategory(null);
                          setQuery("");
                          setSearchText("");
                          setQuality(null);
                          window.scrollTo({ top: 0 });
                        }}
                      >
                        Ultra
                      </button>
                      {categories.slice(0, 24).map((c) => (
                        <button
                          key={c.slug}
                          className={`chip chip--sm${category?.slug === c.slug ? " chip--on" : ""}`}
                          title={c.videoCount ? `${c.name} — ${c.videoCount.toLocaleString()} videos` : c.name}
                          onClick={() => {
                            setCategory(category?.slug === c.slug ? null : c);
                            setUltra(false);
                            setQuery("");
                            setSearchText("");
                            setQuality(null);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {railCreators.length > 0 && !query && !category && !ultra && (
              <section className="rail">
                <RailHead title="Creators & channels" sub="tap a profile to see their videos" />
                <div className="row-scroller no-scrollbar">
                  <div className="rail-track">
                    <div className="creator-rail">
                      {railCreators.map((c) => (
                        <CreatorTile key={`${c.kind}/${c.slug}`} c={c} onSelect={openCreator} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rail rail--tight">
              <div className="row-scroller no-scrollbar">
                <div className="rail-track">
                  <div className="chips">
                    {TAGS.map((t) => (
                      <button
                        key={t}
                        className={`chip chip--sm${query.toLowerCase() === t.toLowerCase() ? " chip--on" : ""}`}
                        onClick={() => doSearch(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="container">
          <div className="section-head">
            <div className="section-title">{heading}</div>
            <div className="section-sub">
              {total
                ? `${total.toLocaleString()} videos`
                : listLoading
                  ? "loading…"
                  : `${shown.length} videos`}
            </div>
            {(qualities.length > 0 || vr) && !listLoading && (
              <div className="section-filters row-scroller no-scrollbar">
                {qualities.map((q) => (
                  <button
                    key={q}
                    className={`chip chip--sm${quality === q ? " chip--on" : ""}`}
                    onClick={() => {
                      setQuality(quality === q ? null : q);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    {q}
                  </button>
                ))}
                <button
                  className={`chip chip--sm${vr ? " chip--on" : ""}`}
                  onClick={() => {
                    setVr(!vr);
                    setQuality(null);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  VR only
                </button>
              </div>
            )}
            {(query || quality || ultra || category) && (
              <button
                className="section-action"
                onClick={() => {
                  setQuery("");
                  setSearchText("");
                  setQuality(null);
                  setUltra(false);
                  setCategory(null);
                  setSort("relevance");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {query && (
            <div className="filter-rows">
              <div className="filter-row">
                <span className="filter-row__label">Sort</span>
                <div className="chips chips--tight">
                  {SORTS.map(([id, label]) => (
                    <button
                      key={id}
                      className={`chip chip--sm${sort === id ? " chip--on" : ""}`}
                      onClick={() => {
                        setSort(id);
                        window.scrollTo({ top: 0 });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {relatedSearches.length > 0 && (
                <div className="filter-row">
                  <span className="filter-row__label">Related</span>
                  <div className="chips chips--tight">
                    {relatedSearches.slice(0, 12).map((r) => (
                      <button key={r.q} className="chip chip--sm chip--ghost" onClick={() => doSearch(r.q)}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {query && resultCreators.length > 0 && (
            <div className="search-creators">
              <RailHead
                title="Creators"
                sub={`${resultCreators.length} matching — tap for their profile`}
              />
              <div className="creator-rail row-scroller no-scrollbar">
                {resultCreators.map((c) => (
                  <CreatorTile key={`${c.kind}/${c.slug}`} c={c} onSelect={openCreator} />
                ))}
              </div>
            </div>
          )}

          {listLoading ? (
            <div className="grid">
              <CardSkeletons count={24} />
            </div>
          ) : error && videos.length === 0 ? (
            <ErrorBox message={error} onRetry={() => void loadPage(1, false)} />
          ) : shown.length === 0 ? (
            <EmptyState query={query || undefined} />
          ) : (
            <div className="grid">
              {shown.map((v) => (
                <VideoCard key={v.id} v={v} onSelect={openVideo} onSelectCreator={openCreator} />
              ))}
            </div>
          )}

          {!listLoading && shown.length > 0 && (hasMore || moreLoading ? (
            <div className="infinite-sentinel" ref={sentinel}>
              {moreLoading ? (
                <>
                  <span className="spinner" />
                  Loading more…
                </>
              ) : (
                "Scroll for more"
              )}
            </div>
          ) : (
            <div className="list-end">
              {moreError ? (
                <button className="btn btn--glass" onClick={() => void loadPage(page + 1, true)}>
                  Couldn’t load more — tap to retry
                </button>
              ) : (
                <>That’s all {shown.length.toLocaleString()} videos</>
              )}
            </div>
          ))}

          {history.length > 0 && !query && (
            <>
              <div className="section-head" style={{ marginTop: 32 }}>
                <div className="section-title">Recently watched</div>
                <button className="section-action" onClick={clearHistory}>
                  Clear
                </button>
              </div>
              <div className="grid">
                {history.slice(0, 12).map((h) => (
                  <VideoCard
                    key={h.id}
                    v={{ id: h.id, title: h.title, url: h.url, thumb: h.thumb, channel: h.channel, uploader: h.uploader }}
                    onSelect={openVideo}
                    onSelectCreator={openCreator}
                    meta={[relativeDay(h.ts)]}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {footer}
      </div>

      {sidebar}
      {drawerOpen && <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
      {fab}
    </>
  );
}
