import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchVideos, resolveVideo, type Listing, type ListName, type Orientation, type Video } from "./api";
import { CardSkeletons, EmptyState, ErrorBox, VideoCard } from "./components";
import Watch, { loadHistory, type HistoryEntry } from "./Watch";

const AGE_KEY = "faphive_age_ok";

const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: "straight", label: "Straight" },
  { id: "gay", label: "Gay" },
  { id: "transgender", label: "Trans" },
];

// ── routing ──

function parseHash(): { view: "browse" } | { view: "watch"; id: string } {
  const m = window.location.hash.match(/^#v\/(.+)$/);
  if (m) return { view: "watch", id: decodeURIComponent(m[1]) };
  return { view: "browse" };
}

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
            YES, I AM 18 OR OLDER
          </button>
          <button className="btn btn-glass" onClick={() => (window.location.href = "https://www.google.com")}>
            NO, I AM UNDER 18
          </button>
        </div>
      </div>
    </div>
  );
}

// ── icons ──

const I = {
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" />
    </svg>
  ),
  fire: (
    <svg viewBox="0 0 24 24">
      <path d="M13.5 0.7s.8 2.8.8 5c0 2.1-1.4 3.9-3.5 3.9S7.3 7.8 7.3 5.7c0-.4 0-.8.1-1.1C5.2 6.6 4 9.4 4 12a8 8 0 0 0 16 0c0-5-2.7-9.3-6.5-11.3z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  ),
};

// ── app ──

export default function App() {
  const [ageOk, setAgeOk] = useState<boolean>(() => localStorage.getItem(AGE_KEY) === "1");
  const [route, setRoute] = useState(parseHash);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("straight");
  const [vr, setVr] = useState(false);
  const [list, setList] = useState<ListName>("all");
  const [page, setPage] = useState(1);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVideos({
        mode: submittedQ ? "search" : "list",
        q: submittedQ || undefined,
        list,
        orientation,
        vr,
        page,
      });
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [submittedQ, list, orientation, vr, page]);

  useEffect(() => {
    if (route.view === "browse") void load();
  }, [load, route.view]);

  const videos = useMemo(() => listing?.videos ?? [], [listing]);

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
        openVideo({ id, title: "Video", url: `https://faphouse2.com/videos/${id}` });
      }
    },
    [openVideo],
  );

  const doSearch = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (/^https?:\/\//.test(t) || t.includes("/videos/")) {
      void openVideoById(t);
      return;
    }
    setQ(t);
    setSubmittedQ(t);
    setPage(1);
  };

  const clearSearch = () => {
    setQ("");
    setSubmittedQ("");
    setPage(1);
  };

  const goPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const heading = submittedQ
    ? `Results for “${submittedQ}”`
    : list === "new"
      ? "Newest videos"
      : orientation === "gay"
        ? "Gay videos"
        : orientation === "transgender"
          ? "Transgender videos"
          : "Featured videos";

  const navTo = (fn: () => void) => {
    setDrawerOpen(false);
    fn();
  };

  const header = (
    <header className="site-header">
      <button className="header-burger" aria-label="Menu" onClick={() => setDrawerOpen(true)}>
        {I.menu}
      </button>
      <a
        className="brand"
        href="#/"
        onClick={() => {
          setRoute({ view: "browse" });
          setDrawerOpen(false);
        }}
      >
        <span className="hex">🐝</span>
        <span className="wordmark">
          FAP<span className="dim">HIVE</span>
        </span>
      </a>
      <div className="header-search">
        <input
          type="search"
          placeholder="Search… or paste a video URL"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") doSearch(q);
          }}
        />
        <span className="s-icon">{I.search}</span>
      </div>
      <div className="header-actions">
        <a className="chip-btn primary" href="https://faphouse2.com" target="_blank" rel="noopener noreferrer nofollow">
          Full site ↗
        </a>
      </div>
    </header>
  );

  const bottomNav = (
    <nav className="bottom-nav">
      <button
        className={route.view === "browse" ? "active" : ""}
        onClick={() => {
          window.location.hash = "#/";
          setRoute({ view: "browse" });
        }}
      >
        {I.home}
        Home
      </button>        <button className={route.view === "watch" ? "active" : ""} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {I.grid}
          Watch
        </button>
      <button onClick={() => setDrawerOpen(true)}>{I.clock}History</button>
      <button onClick={() => setDrawerOpen(true)}>{I.fire}More</button>
    </nav>
  );

  // ── watch view ──
  if (route.view === "watch") {
    return (
      <>
        {!ageOk && (
          <AgeGate
            onEnter={() => {
              localStorage.setItem(AGE_KEY, "1");
              setAgeOk(true);
            }}
          />
        )}
        {header}
        <div className="container">
          <Watch
            id={route.id}
            onBack={() => {
              window.location.hash = "#/";
              setRoute({ view: "browse" });
            }}
            onSelect={openVideo}
          />
        </div>
        {bottomNav}
      </>
    );
  }

  // ── browse view ──
  return (
    <>
      {!ageOk && (
        <AgeGate
          onEnter={() => {
            localStorage.setItem(AGE_KEY, "1");
            setAgeOk(true);
          }}
        />
      )}

      {drawerOpen && <button className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-label="Close menu" />}
      {drawerOpen && (
        <aside className="drawer">
          <div className="drawer-head">
            <a className="brand" href="#/" onClick={() => setDrawerOpen(false)}>
              <span className="hex">🐝</span>
              <span className="wordmark">
                FAP<span className="dim">HIVE</span>
              </span>
            </a>
          </div>
          <div className="drawer-section">Browse</div>
          <button
            className={`drawer-item${list === "all" && !submittedQ ? " active" : ""}`}
            onClick={() => navTo(() => { clearSearch(); setList("all"); setPage(1); })}
          >
            {I.grid} Featured
          </button>
          <button
            className={`drawer-item${list === "new" ? " active" : ""}`}
            onClick={() => navTo(() => { clearSearch(); setList("new"); setPage(1); })}
          >
            {I.clock} Newest
          </button>
          <button
            className={`drawer-item${vr ? " active" : ""}`}
            onClick={() => navTo(() => { setVr(!vr); setPage(1); })}
          >
            {I.eye} VR only
          </button>
          <div className="drawer-section">Orientation</div>
          {ORIENTATIONS.map((o) => (
            <button
              key={o.id}
              className={`drawer-item${orientation === o.id ? " active" : ""}`}
              onClick={() => navTo(() => { setOrientation(o.id); clearSearch(); setPage(1); })}
            >
              {I.fire} {o.label}
            </button>
          ))}
          <div className="drawer-section">Recently watched</div>
          {history.length === 0 ? (
            <div className="drawer-empty">Nothing yet</div>
          ) : (
            history.slice(0, 6).map((h) => (
              <button
                key={h.id}
                className="drawer-item"
                onClick={() => navTo(() => openVideo({ id: h.id, title: h.title, url: h.url, thumb: h.thumb }))}
              >
                {I.clock} <span className="drawer-ellipsis">{h.title}</span>
              </button>
            ))
          )}
          <div className="drawer-section">External</div>
          <a className="drawer-item" href="https://faphouse2.com" target="_blank" rel="noopener noreferrer nofollow">
            {I.ext} faphouse2.com ↗
          </a>
        </aside>
      )}

      {header}

      <div className="chips-row" style={{ paddingTop: 12 }}>
        {ORIENTATIONS.map((o) => (
          <button
            key={o.id}
            className={`chip-btn${orientation === o.id ? " on" : ""}`}
            onClick={() => {
              setOrientation(o.id);
              clearSearch();
              setPage(1);
            }}
          >
            {o.label}
          </button>
        ))}
        <span className="chip-gap" />
        <button
          className={`chip-btn${list === "all" ? " on" : ""}`}
          onClick={() => {
            setList("all");
            setPage(1);
          }}
        >
          Featured
        </button>
        <button
          className={`chip-btn${list === "new" ? " on" : ""}`}
          onClick={() => {
            setList("new");
            setPage(1);
          }}
        >
          Newest
        </button>
        <button
          className={`chip-btn${vr ? " on" : ""}`}
          onClick={() => {
            setVr(!vr);
            setPage(1);
          }}
        >
          VR
        </button>
      </div>

      <div className="container">
        <div className="section-head">
          <div className="section-title">{heading}</div>
          {listing?.total ? <div className="section-sub">{listing.total.toLocaleString()} videos</div> : null}
        </div>

        {loading ? (
          <div className="grid">
            <CardSkeletons count={20} />
          </div>
        ) : error ? (
          <ErrorBox message={error} onRetry={() => void load()} />
        ) : videos.length === 0 ? (
          <EmptyState query={submittedQ || undefined} />
        ) : (
          <div className="grid">
            {videos.map((v) => (
              <VideoCard key={v.id} v={v} onSelect={openVideo} />
            ))}
          </div>
        )}

        <div className="pagination">
          <button className="page-btn" disabled={page <= 1 || loading} onClick={() => goPage(page - 1)}>
            ‹
          </button>
          {[...Array(5)].map((_, i) => {
            const start = Math.max(1, page - 2);
            const p = start + i;
            return (
              <button key={p} className={`page-btn${p === page ? " current" : ""}`} onClick={() => goPage(p)}>
                {p}
              </button>
            );
          })}
          <button className="page-btn" disabled={loading || videos.length === 0} onClick={() => goPage(page + 1)}>
            ›
          </button>
        </div>

        {history.length > 0 && (
          <>
            <div className="section-head">
              <div className="section-title">Recently watched</div>
              <button
                className="section-action"
                onClick={() => {
                  localStorage.removeItem("faphive_history");
                  setHistory([]);
                }}
              >
                Clear
              </button>
            </div>
            <div className="grid">
              {history.slice(0, 12).map((h) => (
                <VideoCard
                  key={h.id}
                  v={{ id: h.id, title: h.title, url: h.url, thumb: h.thumb }}
                  onSelect={openVideo}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="site-footer">
        FAPHIVE aggregates publicly listed metadata from faphouse2.com. We host nothing — thumbnails
        &amp; trailer previews are served by their CDN; full videos open on{" "}
        <a href="https://faphouse2.com" target="_blank" rel="noopener noreferrer nofollow">
          faphouse2.com
        </a>
        . 18+ only.
      </footer>

      {bottomNav}
    </>
  );
}
