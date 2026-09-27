import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchVideos, resolveVideo, type Listing, type ListName, type Orientation, type Video } from "./api";
import { CardSkeletons, EmptyState, ErrorBox, VideoCard } from "./components";
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

// ── routing ──

type Route = { view: "browse" } | { view: "saved" } | { view: "history" } | { view: "watch"; id: string };

function parseHash(): Route {
  const h = window.location.hash;
  if (h.startsWith("#v/")) return { view: "watch", id: decodeURIComponent(h.slice(3)) };
  if (h.startsWith("#saved")) return { view: "saved" };
  if (h.startsWith("#history")) return { view: "history" };
  return { view: "browse" };
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

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
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
      }
      try {
        const data: Listing = await fetchVideos({
          mode: query ? "search" : "list",
          q: query || undefined,
          list,
          orientation,
          vr,
          page: nextPage,
        });
        const incoming = data.videos ?? [];
        setTotal(data.total);
        setVideos((prev) => {
          if (!append) return incoming;
          const seen = new Set(prev.map((v) => v.id));
          return [...prev, ...incoming.filter((v) => !seen.has(v.id))];
        });
        setPage(nextPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        if (!append) setVideos([]);
      } finally {
        setListLoading(false);
        setMoreLoading(false);
      }
    },
    [query, list, orientation, vr],
  );

  useEffect(() => {
    if (route.view === "browse") void loadPage(1, false);
  }, [loadPage, route.view]);

  const hasMore = !listLoading && videos.length > 0 && (total === undefined || videos.length < total);

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
    setSearchOpen(false);
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

  const channels = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) if (v.channel && !map.has(v.channel)) map.set(v.channel, v);
    return [...map.entries()].map(([name, v]) => ({ name, v })).slice(0, 40);
  }, [videos]);

  const qualities = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) if (v.quality && !map.has(v.quality)) map.set(v.quality, v);
    return [...map.keys()].slice(0, 8);
  }, [videos]);

  const heading = query
    ? `Results for “${query}”`
    : quality
      ? `${quality} videos`
      : list === "new"
        ? "Newest videos"
        : orientation === "gay"
          ? "Gay videos"
          : orientation === "transgender"
            ? "Transgender videos"
            : vr
              ? "VR videos"
              : "Featured videos";

  const savedVideos: Video[] = saved.map((s) => ({
    id: s.id,
    title: s.title,
    url: s.url,
    thumb: s.thumb,
    channel: s.channel,
  }));

  const historyVideos: Video[] = history.map((h) => ({
    id: h.id,
    title: h.title,
    url: h.url,
    thumb: h.thumb,
    channel: h.channel,
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
          {navItem(route.view === "browse" && !query && !vr, I.home, "Home", () => resetListing(() => {
            setQuery("");
            setSearchText("");
            setQuality(null);
            setVr(false);
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
      <div className="search-layer" onClick={() => setSearchOpen(false)} />
      <div className="search-panel">
        <div className="search-row">
          <input
            className="search-input"
            type="search"
            autoFocus
            placeholder="Search videos, channels — or paste a video URL"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch(searchText);
              if (e.key === "Escape") setSearchOpen(false);
            }}
          />
          <button className="icon-btn" aria-label="Close search" onClick={() => setSearchOpen(false)}>
            {I.close}
          </button>
        </div>
        <div className="search-hint">Try “anal”, “pov”, “milf” — or paste a faphouse2.com video link.</div>
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
        {/* constant top padding — toggling it on scroll shifted the whole page */}
        <div className="main main--watch">
          <Watch
            id={route.id}
            onSelect={openVideo}
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
            {channels.length > 0 && (
              <div className="row-scroller no-scrollbar">
                <div className="plates-track">
                  <div className="plates">
                    {channels.map((c) => (
                      <a
                        key={c.name}
                        className="plate"
                        href={`#/`}
                        title={c.name}
                        onClick={(e) => {
                          e.preventDefault();
                          doSearch(c.name);
                        }}
                      >
                        <span className="plate__avatar">
                          {c.v.thumb ? <img src={c.v.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{c.name.slice(0, 1).toUpperCase()}</span>}
                        </span>
                        <span className="plate__name">{c.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {qualities.length > 0 && (
              <div className="row-scroller no-scrollbar">
                <div className="plates-track">
                  <div className="chips">
                    {qualities.map((q) => {
                      const rep = videos.find((v) => v.quality === q);
                      return (
                        <button
                          key={q}
                          className={`chip${quality === q ? " chip--on" : ""}`}
                          onClick={() => {
                            setQuality(quality === q ? null : q);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          {rep?.thumb && <img className="chip__avatar" src={rep.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                          {q}
                        </button>
                      );
                    })}
                    <button
                      className={`chip${vr ? " chip--on" : ""}`}
                      onClick={() => {
                        setVr(!vr);
                        setQuality(null);
                        window.scrollTo({ top: 0 });
                      }}
                    >
                      VR
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="row-scroller no-scrollbar">
              <div className="plates-track">
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
          </div>
        </div>

        <div className="container">
          {(query || quality || vr || list === "new") && (
            <div className="section-head">
              <div className="section-title">{heading}</div>
              {total ? <div className="section-sub">{total.toLocaleString()} videos</div> : null}
              {(query || quality) && (
                <button
                  className="section-action"
                  onClick={() => {
                    setQuery("");
                    setSearchText("");
                    setQuality(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {listLoading ? (
            <div className="grid">
              <CardSkeletons count={24} />
            </div>
          ) : error ? (
            <ErrorBox message={error} onRetry={() => void loadPage(1, false)} />
          ) : shown.length === 0 ? (
            <EmptyState query={query || undefined} />
          ) : (
            <div className="grid">
              {shown.map((v) => (
                <VideoCard key={v.id} v={v} onSelect={openVideo} />
              ))}
            </div>
          )}

          {!listLoading && !error && shown.length > 0 && (
            <div className="infinite-sentinel" ref={sentinel}>
              {moreLoading ? (
                <>
                  <span className="spinner" />
                  Loading more…
                </>
              ) : hasMore ? (
                "Scroll for more"
              ) : (
                `${shown.length} videos`
              )}
            </div>
          )}

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
                    v={{ id: h.id, title: h.title, url: h.url, thumb: h.thumb, channel: h.channel }}
                    onSelect={openVideo}
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
