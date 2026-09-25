import { useEffect, useState } from "react";
import { resolveVideo, type ResolveResult, type Video } from "./api";
import Player from "./Player";
import { ErrorBox, VideoCard } from "./components";

export interface HistoryEntry {
  id: string;
  title: string;
  thumb?: string;
  url: string;
  channel?: string;
  ts: number;
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("faphive_history") || "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(v: { id: string; title: string; thumb?: string; url: string; channel?: string }) {
  const list = loadHistory().filter((h) => h.id !== v.id);
  list.unshift({ ...v, ts: Date.now() });
  localStorage.setItem("faphive_history", JSON.stringify(list.slice(0, 24)));
}

export default function Watch({
  id,
  onBack,
  onSelect,
}: {
  id: string;
  onBack: () => void;
  onSelect: (v: Video) => void;
}) {
  const [data, setData] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    resolveVideo(id)
      .then((d) => {
        if (!alive) return;
        setData(d);
        saveHistoryEntry({ id: d.id, title: d.title, url: d.url, thumb: d.poster });
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => alive && setLoading(false));
    window.scrollTo({ top: 0 });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="watch-layout">
        <div className="watch-main">
          <div className="skeleton-box" style={{ borderRadius: 12 }} />
          <div className="watch-panel">
            <div className="skeleton-line" style={{ margin: "0 0 10px", width: "60%" }} />
            <div className="skeleton-line" style={{ margin: 0, width: "35%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
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
    );
  }

  const related = data.related;

  return (
    <div className="watch-layout">
      <div className="watch-main">
        <div className="back-row">
          <button className="back-btn" onClick={onBack}>
            ‹ Back
          </button>
        </div>

        {data.preview ? (
          <Player src={data.preview} poster={data.poster} title={data.title} />
        ) : (
          <div className="player-stage">
            <div className="player-empty">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h3>No preview available</h3>
              <p>This video is premium-only. Watch it in full on faphouse2.com.</p>
            </div>
          </div>
        )}

        <div className="watch-panel">
          <h1 className="watch-title">{data.title}</h1>
          {data.description && <p className="watch-desc">{data.description}</p>}
          <div className="watch-actions">
            <a className="btn" href={data.url} target="_blank" rel="noopener noreferrer nofollow">
              ▶ Watch full video
            </a>
            <a className="btn btn-glass" href={data.url} target="_blank" rel="noopener noreferrer nofollow">
              Open on faphouse2.com ↗
            </a>
          </div>
          <p className="watch-note">
            FAPHIVE plays the official trailer preview only. The full-length video streams on faphouse2.com.
          </p>
        </div>
      </div>

      <aside className="related-col">
        <div className="related-head">Up next</div>
        {related.length === 0 ? (
          <div className="status-box" style={{ padding: 24 }}>No related videos</div>
        ) : (
          <div className="related-list">
            {related.slice(0, 12).map((v) => (
              <VideoCard key={v.id} v={v} onSelect={onSelect} mini />
            ))}
          </div>
        )}
        {related.length > 12 && (
          <div className="related-grid-more">
            {related.slice(12).map((v) => (
              <VideoCard key={v.id} v={v} onSelect={onSelect} />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
