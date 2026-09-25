import { useRef, useState } from "react";
import type { Video } from "./api";

/** Video card. `mini` renders the compact horizontal variant for sidebars. */
export function VideoCard({ v, onSelect, mini }: { v: Video; onSelect: (v: Video) => void; mini?: boolean }) {
  const [hover, setHover] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const hoverTimer = useRef<number | null>(null);

  const onEnter = () => {
    if (window.matchMedia("(hover: none)").matches) return;
    hoverTimer.current = window.setTimeout(() => setHover(true), 350);
  };
  const onLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHover(false);
  };

  const media = (
    <div className="card-media">
      {v.thumb && !imgFailed ? (
        <img
          className="card-img"
          src={v.thumb}
          alt={v.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="card-img skeleton-box" aria-hidden="true" />
      )}
      {hover && v.preview && (
        <video className="card-preview" src={v.preview} autoPlay muted loop playsInline />
      )}
      {!mini && (
        <div className="card-badges">
          {v.quality && <span className="badge badge-hd">{v.quality}</span>}
          {v.vr && <span className="badge badge-vr">VR</span>}
        </div>
      )}
      {v.duration && <span className="badge badge-duration">{v.duration}</span>}
    </div>
  );

  if (mini) {
    return (
      <a
        className="mini-card"
        href={`#v/${v.id}`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(v);
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {media}
        <div className="card-text">
          <div className="card-title" title={v.title}>
            {v.title}
          </div>
          {v.channel && <div className="card-channel">{v.channel}</div>}
        </div>
      </a>
    );
  }

  return (
    <a
      className="card"
      href={`#v/${v.id}`}
      onClick={(e) => {
        e.preventDefault();
        onSelect(v);
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {media}
      <div className="card-text">
        <div className="card-title" title={v.title}>
          {v.title}
        </div>
        {v.channel && <div className="card-channel">{v.channel}</div>}
      </div>
    </a>
  );
}

export function CardSkeletons({ count = 20 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="card card-skeleton" key={i}>
          <div className="skeleton-box" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ))}
    </>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="status-box">
      <div className="big">⚠️</div>
      <div>
        <strong>Couldn’t load videos</strong>
        <br />
        {message}
      </div>
      <button className="btn btn-glass" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="status-box">
      <div className="big">🫙</div>
      <div>No videos found{query ? ` for “${query}”` : ""} — try different keywords or section.</div>
    </div>
  );
}
