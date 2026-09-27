import { useEffect, useRef, useState } from "react";
import type { Video } from "./api";
import { isSaved, onStoreChange, toggleSaved } from "./store";

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
    <path d="M12 20.7 4.6 13.3a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 1 1 6.5 6.5L12 20.7z" />
  </svg>
);

/** The beeg "VideoTile": 16:9 media, duration pill, avatar + creator/title/meta rows. */
export function VideoCard({
  v,
  onSelect,
  meta,
}: {
  v: Video & { ts?: number };
  onSelect: (v: Video) => void;
  meta?: string[];
}) {
  const [hover, setHover] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [saved, setSaved] = useState(() => isSaved(v.id));
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => onStoreChange(() => setSaved(isSaved(v.id))), [v.id]);

  const onEnter = () => {
    if (window.matchMedia("(hover: none)").matches) return;
    hoverTimer.current = window.setTimeout(() => setHover(true), 350);
  };
  const onLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHover(false);
  };

  const amount = [v.quality, v.duration].filter(Boolean).join(" ");
  const metaItems = meta && meta.length ? meta : [v.quality && v.vr ? `${v.quality} · VR` : v.vr ? "VR" : v.quality, v.preview ? "Trailer" : "Full video"].filter(Boolean) as string[];

  return (
    <div className="unit" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <a
        className="unit__media"
        href={`#v/${v.id}`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(v);
        }}
        aria-label={v.title}
      >
        {v.thumb && !imgFailed ? (
          <img
            className="unit__img"
            src={v.thumb}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="unit__img" aria-hidden="true" />
        )}
        {hover && v.preview && <video className="unit__preview" src={v.preview} autoPlay muted loop playsInline />}
        {amount && <span className="unit__amount">{amount}</span>}
      </a>

      <button
        className={`unit__save${saved ? " unit__save--on" : ""}`}
        aria-label={saved ? "Remove from saved" : "Save video"}
        onClick={() =>
          setSaved(
            toggleSaved({
              id: v.id,
              title: v.title,
              url: v.url,
              thumb: v.thumb,
              channel: v.channel,
            }),
          )
        }
      >
        <HeartIcon filled={saved} />
      </button>

      <div className="unit__info">
        <a
          className="unit__avatar"
          href={`#v/${v.id}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(v);
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          {v.thumb && !imgFailed ? (
            <img src={v.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <span>{(v.channel || v.title || "?").slice(0, 1).toUpperCase()}</span>
          )}
        </a>
        <div className="unit__text">
          <div className="unit__line1">
            {v.channel || "FapHouse"}
            {v.channel && <span className="unit__sep">·</span>}
            {v.channel && <span className="unit__studio">faphouse2.com</span>}
          </div>
          <div className="unit__title" title={v.title}>
            {v.title}
          </div>
          <div className="unit__meta">
            {metaItems.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Square recommendation tile used by the watch-page rail (beeg "GreyFox"). */
export function RailTile({ v, onSelect }: { v: Video; onSelect: (v: Video) => void }) {
  return (
    <a
      className="rail-item"
      href={`#v/${v.id}`}
      onClick={(e) => {
        e.preventDefault();
        onSelect(v);
      }}
      title={v.title}
    >
      {v.thumb ? <img src={v.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      {v.quality && <span className="rail-item__status">{v.quality}</span>}
      {v.duration && <span className="rail-item__dur">{v.duration}</span>}
    </a>
  );
}

/** Wide 96px-tall tile used by the watch-page "train". */
export function TrainTile({ v, onSelect }: { v: Video; onSelect: (v: Video) => void }) {
  return (
    <a
      className="train-item"
      href={`#v/${v.id}`}
      onClick={(e) => {
        e.preventDefault();
        onSelect(v);
      }}
      title={v.title}
    >
      {v.thumb ? <img src={v.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      {v.duration && <span className="train-item__dur">{v.duration}</span>}
    </a>
  );
}

export function CardSkeletons({ count = 24 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="unit" key={i} aria-hidden="true">
          <div className="skeleton skeleton-block" />
          <div className="unit__info">
            <div className="unit__avatar skeleton" style={{ background: "var(--x-color-overlay-5)" }} />
            <div className="unit__text" style={{ justifyContent: "flex-start" }}>
              <div className="skeleton skeleton-line" style={{ margin: 0 }} />
              <div className="skeleton skeleton-line skeleton-line--short" />
            </div>
          </div>
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
      <button className="btn btn--glass" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="status-box">
      <div className="big">🔍</div>
      <div>No videos found{query ? ` for “${query}”` : ""} — try different keywords or section.</div>
    </div>
  );
}
