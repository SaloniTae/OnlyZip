import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Creator, PreviewSource, ProfileRef, Video } from "./api";
import { isCoarsePointer, pickPreviewSource, registerPreview, type PreviewMode } from "./preview";
import { isSaved, onStoreChange, toggleSaved } from "./store";

// beeg starts its tile preview the instant the cursor lands on it — no gate.
// a press this long is a hold, not a tap — releasing it must not open the video
const LONG_PRESS_MS = 500;

/**
 * Trailer video that sits invisibly on top of the thumbnail until it has a
 * decoded first frame, then fades in. The still image stays underneath the
 * whole time, so the tile never flashes an empty black box while loading.
 *
 * Two priorities are enforced here, in network order:
 * 1. the thumbnail always wins — the trailer element mounts WITHOUT a src, so
 *    it touches no network at all while its tile's still image is still
 *    loading; only once that picture is on screen (or 2.5s stall cap) is a
 *    rendition granted;
 * 2. the rendition itself is adaptive — `pickPreviewSource` resolves the
 *    (usually smaller) AV1 variant on slow links when one exists.
 *
 * `playing` comes from the shared scheduler: a tile that was buffered ahead of
 * time ("armed") already holds its first frames, so flipping this on starts the
 * trailer without a visible loading step.
 */
function PreviewVideo({
  src,
  sources,
  className,
  playing,
}: {
  src?: string;
  sources?: PreviewSource[];
  className: string;
  playing: boolean;
}) {
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  const renditions = useMemo(
    () => (sources && sources.length > 0 ? sources : src ? [{ src }] : []),
    [src, sources],
  );

  // the grant gate: trailer only after the tile's picture is on screen
  useEffect(() => {
    if (renditions.length === 0) return;
    let alive = true;
    const grant = () => alive && setMediaSrc((prev) => prev ?? pickPreviewSource(renditions));
    let host: HTMLElement | null = null;
    const candidate = ref.current;
    if (candidate) {
      host = (candidate.closest(".unit__media") ??
        candidate.closest(".rail-item") ??
        candidate.closest(".train-item")) as HTMLElement | null;
    }
    const img = host?.querySelector("img");
    if (img && !img.complete) {
      // the picture still needs the network — the trailer waits behind it
      img.addEventListener("load", grant, { once: true });
      img.addEventListener("error", grant, { once: true });
      const timer = window.setTimeout(grant, 2500);
      return () => {
        alive = false;
        img.removeEventListener("load", grant);
        img.removeEventListener("error", grant);
        window.clearTimeout(timer);
      };
    }
    grant();
    return () => {
      alive = false;
    };
  }, [renditions]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !mediaSrc) return;
    if (el.getAttribute("src") !== mediaSrc) {
      el.setAttribute("src", mediaSrc);
      el.load();
    }
    if (playing) {
      // already decoded while armed? then this is a single-frame swap
      if (el.readyState >= 2) setReady(true);
      const started = el.play();
      if (started && typeof started.catch === "function") started.catch(() => {});
    } else {
      el.pause();
      setReady(false);
    }
  }, [mediaSrc, playing]);

  return (
    <video
      ref={ref}
      className={`${className}${ready ? " is-ready" : ""}`}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onLoadedData={() => playing && setReady(true)}
      onPlaying={() => setReady(true)}
    />
  );
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
    <path d="M12 20.7 4.6 13.3a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 1 1 6.5 6.5L12 20.7z" />
  </svg>
);

/** The beeg "VideoTile": 16:9 media, duration pill, avatar + creator/title/meta rows. */
export function VideoCard({
  v,
  onSelect,
  onSelectCreator,
  meta,
}: {
  v: Video & { ts?: number };
  onSelect: (v: Video) => void;
  onSelectCreator?: (p: ProfileRef) => void;
  meta?: string[];
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [saved, setSaved] = useState(() => isSaved(v.id));
  const { playing, active, bind } = usePreview(!!v.preview);

  useEffect(() => onStoreChange(() => setSaved(isSaved(v.id))), [v.id]);

  // the circle next to a card is the *uploader's* avatar — never the video frame
  const up = v.uploader;
  const who = up?.name || v.channel || "FapHive";
  const initial = (who || "?").slice(0, 1).toUpperCase();
  const amount = [v.quality, v.duration].filter(Boolean).join(" ");
  const metaItems = meta && meta.length ? meta : [v.quality && v.vr ? `${v.quality} · VR` : v.vr ? "VR" : v.quality, v.preview ? "Trailer" : "Full video"].filter(Boolean) as string[];

  const avatarInner = up?.avatar && !imgFailed ? (
    <img src={up.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <span>{initial}</span>
  );

  return (
    <div className="unit">
      <a
        className="unit__media"
        href={`#v/${v.id}`}
        {...bind}
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
        {active && v.preview && (
          <PreviewVideo className="unit__preview" src={v.preview} sources={v.previewSources} playing={playing} />
        )}
        {v.fanclub && <span className="unit__flag">Fanclub</span>}
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
              uploader: v.uploader,
            }),
          )
        }
      >
        <HeartIcon filled={saved} />
      </button>

      <div className="unit__info">
        {up?.slug && onSelectCreator ? (
          <a
            className="unit__avatar unit__avatar--link"
            href={`#creator/${up.slug}`}
            title={`${who} — open profile`}
            onClick={(e) => {
              e.preventDefault();
              onSelectCreator(up);
            }}
          >
            {avatarInner}
          </a>
        ) : (
          <span className="unit__avatar" aria-hidden="true">
            {avatarInner}
          </span>
        )}
        <div className="unit__text">
          <div className="unit__line1">
            {who}
            {up?.kind === "studio" && <span className="unit__badge">studio</span>}
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

/**
 * Trailer preview, behaving like the upstream tiles:
 * - every tile competes for the shared scheduler's play slots by how visible
 *   and how close to the middle of the viewport it is, so whichever thumbnails
 *   are under the eyes play as soon as they get there — no hover needed and no
 *   per-tile delay — and the next few are buffered so scrolling never stutters
 * - hovering a tile boosts it: the cursor's tile outranks everything and starts
 *   instantly (from buffer whenever it was visible), like beeg
 * - touch devices (no hover) are the same ranking without the boost; a tap
 *   only ever opens the video, and holding does nothing special
 *
 * `bind` is meant for the thumbnail element itself, never the whole tile, so
 * the preview is tied precisely to the media (title/avatar rows stay inert).
 */
function usePreview(enabled: boolean) {
  const [mode, setMode] = useState<PreviewMode>("off");
  const elRef = useRef<HTMLAnchorElement | null>(null);
  const handleRef = useRef<ReturnType<typeof registerPreview> | null>(null);
  const pressStart = useRef(0);
  const coarse = useRef(isCoarsePointer());

  // every tile registers with the shared scheduler: it decides which tiles may
  // buffer/play — on a finger device nearest the middle of the viewport first,
  // on a mouse device only the hovered one — so a phone or tablet loads one
  // trailer at a time instead of a cascade down the page
  useEffect(() => {
    const el = elRef.current;
    if (!enabled || !el) return;
    const handle = registerPreview(el, coarse.current ? "viewport" : "hover", setMode);
    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.release();
      setMode("off");
    };
  }, [enabled]);

  const setRef = useCallback((node: HTMLAnchorElement | null) => {
    elRef.current = node;
  }, []);

  const bind = {
    ref: setRef,
    onPointerEnter: (e: ReactPointerEvent) => {
      if (!enabled || coarse.current || e.pointerType === "touch") return;
      // beeg parity: the preview starts the instant the pointer enters the tile
      handleRef.current?.setBoost(true);
    },
    onPointerLeave: () => {
      // and cancels the moment it leaves (scheduler drops the slot; the video
      // element unmounts, aborting any in-flight fetch — beeg does src="")
      handleRef.current?.setBoost(false);
    },
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.pointerType !== "mouse") pressStart.current = Date.now();
    },
    onPointerCancel: () => {
      pressStart.current = 0;
    },
    // beeg treats holding a tile as "nothing": only a real tap opens it
    onClickCapture: (e: ReactMouseEvent) => {
      const held = pressStart.current && Date.now() - pressStart.current > LONG_PRESS_MS;
      pressStart.current = 0;
      if (held) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };

  // the scheduler's verdict is the single source of truth for both drivers:
  // `active` = a media element exists (buffering or playing), `playing` = it runs
  const playing = enabled && mode === "playing";
  const active = enabled && mode !== "off";
  return { playing, active, bind };
}

/** Small heading above a horizontal rail ("Popular creators", "Channels" …). */
export function RailHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="rail-head">
      <span className="rail-head__title">{title}</span>
      {sub && <span className="rail-head__sub">{sub}</span>}
    </div>
  );
}

/** Square recommendation tile used by the watch-page rail (beeg "GreyFox"). */
export function RailTile({ v, onSelect }: { v: Video; onSelect: (v: Video) => void }) {
  const { playing, active, bind } = usePreview(!!v.preview);
  return (
    <a
      className="rail-item"
      href={`#v/${v.id}`}
      {...bind}
      onClick={(e) => {
        e.preventDefault();
        onSelect(v);
      }}
      title={v.title}
    >
      {v.thumb ? <img src={v.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      {active && v.preview && (
        <PreviewVideo className="rail-item__preview" src={v.preview} sources={v.previewSources} playing={playing} />
      )}
      {v.quality && <span className="rail-item__status">{v.quality}</span>}
      {v.duration && <span className="rail-item__dur">{v.duration}</span>}
    </a>
  );
}

/** Wide 96px-tall tile used by the watch-page "train". */
export function TrainTile({ v, onSelect }: { v: Video; onSelect: (v: Video) => void }) {
  const { playing, active, bind } = usePreview(!!v.preview);
  return (
    <a
      className="train-item"
      href={`#v/${v.id}`}
      {...bind}
      onClick={(e) => {
        e.preventDefault();
        onSelect(v);
      }}
      title={v.title}
    >
      {v.thumb ? <img src={v.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      {active && v.preview && (
        <PreviewVideo className="train-item__preview" src={v.preview} sources={v.previewSources} playing={playing} />
      )}
      {v.duration && <span className="train-item__dur">{v.duration}</span>}
    </a>
  );
}

/** Circular-avatar creator tile: the creator directory grid and profile rails. */
export function CreatorTile({ c, onSelect }: { c: Creator; onSelect: (c: Creator) => void }) {
  return (
    <a
      className="creator-tile"
      href={`#creator/${c.slug}`}
      title={c.name}
      onClick={(e) => {
        e.preventDefault();
        onSelect(c);
      }}
    >
      <span className="creator-tile__avatar">
        {c.avatar ? (
          <img src={c.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span>{(c.name || "?").slice(0, 1).toUpperCase()}</span>
        )}
      </span>
      <span className="creator-tile__name">{c.name}</span>
      {typeof c.videoCount === "number" && c.videoCount > 0 && (
        <span className="creator-tile__meta">{c.videoCount.toLocaleString()} videos</span>
      )}
    </a>
  );
}

/** Compact avatar + name row: search suggestions and the watch-page cast strip. */
export function CreatorLine({
  c,
  onSelect,
  sub,
}: {
  c: Creator;
  onSelect: (c: Creator) => void;
  sub?: string;
}) {
  const meta = sub ?? (c.videoCount ? `${c.videoCount.toLocaleString()} videos` : undefined);
  return (
    <a
      className="creator-line"
      href={`#creator/${c.slug}`}
      title={c.name}
      onClick={(e) => {
        e.preventDefault();
        onSelect(c);
      }}
    >
      <span className="creator-line__avatar">
        {c.avatar ? (
          <img src={c.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span>{(c.name || "?").slice(0, 1).toUpperCase()}</span>
        )}
      </span>
      <span className="creator-line__text">
        <span className="creator-line__name">{c.name}</span>
        {meta && <span className="creator-line__meta">{meta}</span>}
      </span>
    </a>
  );
}

export function CreatorSkeletons({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="creator-tile" key={i} aria-hidden="true">
          <span className="creator-tile__avatar skeleton" />
          <span className="skeleton skeleton-line" style={{ width: "70%", margin: 0 }} />
        </div>
      ))}
    </>
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
