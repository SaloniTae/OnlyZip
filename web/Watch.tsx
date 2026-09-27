import { useEffect, useState } from "react";
import { resolveVideo, type ResolveResult, type Video } from "./api";
import Player from "./Player";
import { ErrorBox, RailTile, TrainTile, VideoCard } from "./components";
import { isSaved, onStoreChange, saveHistoryEntry, toggleSaved } from "./store";

const I = {
  heart: (on: boolean) => (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20.7 4.6 13.3a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 1 1 6.5 6.5L12 20.7z" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4v16l14-8z" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
};

export default function Watch({
  id,
  onSelect,
  onBack,
}: {
  id: string;
  onSelect: (v: Video) => void;
  onBack: () => void;
}) {
  const [data, setData] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(() => isSaved(id));
  const [copied, setCopied] = useState(false);

  useEffect(() => onStoreChange(() => setSaved(isSaved(id))), [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    window.scrollTo({ top: 0 });
    resolveVideo(id)
      .then((d) => {
        if (!alive) return;
        setData(d);
        saveHistoryEntry({ id: d.id, title: d.title, url: d.url, thumb: d.poster });
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="watch">
          <div className="watch__stage">
            <div className="skeleton" style={{ paddingTop: "56.25%" }} />
          </div>
          <div className="watch__info">
            <div className="skeleton skeleton-line" style={{ width: "55%", marginLeft: 0 }} />
            <div className="skeleton skeleton-line" style={{ width: "22%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <ErrorBox
          message={error || "Unknown error"}
          onRetry={() => {
            setLoading(true);
            setError(null);
            resolveVideo(id)
              .then(setData)
              .catch((e) => setError(String(e)))
              .finally(() => setLoading(false));
          }}
        />
      </div>
    );
  }

  const related = data.related.slice(0, 24);
  const rail = related.slice(0, 12);
  const train = related.slice(0, 14);

  const share = async () => {
    const url = `${window.location.origin}/#v/${encodeURIComponent(data.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="container">
      <div className="watch">
        <div className="watch__top">
          <div className="watch__stage">
            {data.preview ? (
              <Player src={data.preview} poster={data.poster} title={data.title} />
            ) : (
              <div className="unit__media" style={{ borderRadius: 12 }}>
                {data.poster && <img className="unit__img" src={data.poster} alt="" referrerPolicy="no-referrer" />}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  <div className="t-headline-24">Preview unavailable</div>
                  <div className="t14 c-2">This title is streaming-only. Open it on faphouse2.com to watch.</div>
                  <a className="btn" href={data.url} target="_blank" rel="noopener noreferrer nofollow">
                    {I.play} Watch full video
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="watch__rail">
            {rail.map((v) => (
              <RailTile key={v.id} v={v} onSelect={onSelect} />
            ))}
          </div>
        </div>

        <div className="watch__info">
          <div className="watch__title-row">
            <div className="watch__title" title={data.title}>
              {data.title}
            </div>
            <div className="watch__actions">
              <button
                className={`icon-btn icon-btn--40${saved ? " icon-btn--accent" : ""}`}
                aria-label={saved ? "Remove from saved" : "Save"}
                onClick={() =>
                  setSaved(
                    toggleSaved({
                      id: data.id,
                      title: data.title,
                      url: data.url,
                      thumb: data.poster,
                    }),
                  )
                }
              >
                {I.heart(saved)}
              </button>
              <a
                className="icon-btn icon-btn--40"
                href={data.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="Open on faphouse2.com"
              >
                {I.ext}
              </a>
              <button className="icon-btn icon-btn--40" aria-label="Copy link" onClick={() => void share()}>
                {I.link}
              </button>
              <button className="icon-btn icon-btn--40" aria-label="Back" onClick={onBack}>
                {I.back}
              </button>
            </div>
          </div>

          <div className="watch__creator">
            <a
              className="up c-action"
              href={data.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              faphouse2.com
            </a>
            {copied && <span className="t-label-11 c-2">link copied</span>}
          </div>

          {train.length > 0 && (
            <div className="watch__train row-scroller no-scrollbar">
              {train.map((v) => (
                <TrainTile key={v.id} v={v} onSelect={onSelect} />
              ))}
            </div>
          )}

          {data.description && <p className="watch__desc">{data.description}</p>}

          <div className="watch__buttons">
            <a className="btn" href={data.url} target="_blank" rel="noopener noreferrer nofollow">
              Watch full video
            </a>
            <a className="btn btn--glass" href={data.url} target="_blank" rel="noopener noreferrer nofollow">
              Open on faphouse2.com
            </a>
          </div>
        </div>

        {related.length > 0 && (
          <div className="watch__related">
            <div className="watch__related-head">Related videos</div>
            <div className="grid">
              {related.map((v) => (
                <VideoCard key={v.id} v={v} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
