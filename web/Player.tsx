import { useCallback, useEffect, useRef, useState } from "react";
import "./player.css";

const SEEK_STEP = 10;
const HIDE_CONTROLS_DELAY = 2800;
const SWIPE_THRESHOLD = 16;
const SPEEDS = [0.5, 1, 1.5, 2];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (h > 0 ? `${h}:` : "") + String(m).padStart(h > 0 ? 2 : 1, "0") + ":" + String(s).padStart(2, "0");
}

const Icon = {
  play: <path d="M8 5v14l11-7z" />,
  pause: <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />,
  rewind: <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />,
  forward: <path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z" />,
  volume: (
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  ),
  muted: (
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z" />
  ),
  pip: (
    <path d="M19 7h-8v6h8V7zm2-4H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H3V5h18v14z" />
  ),
  fullscreen: (
    <path
      d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  settings: (
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  ),
};

export interface PlayerProps {
  src: string;
  poster?: string;
  title: string;
  chip?: string;
}

export default function Player({ src, poster, title, chip = "TRAILER" }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFs, setIsFs] = useState(false);

  // scrub preview
  const [scrub, setScrub] = useState<{ show: boolean; pct: number; t: number }>({ show: false, pct: 0, t: 0 });
  const dragging = useRef(false);
  const wasPlayingBeforeDrag = useRef(false);

  // gesture feedback
  const [seekPulse, setSeekPulse] = useState<{ side: "left" | "right"; key: number } | null>(null);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const hasStream = () => {
    const v = videoRef.current;
    return !!v && !!v.src && !Number.isNaN(v.duration) && v.duration > 0;
  };

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused) {
        setShowUI(false);
        setMenuOpen(false);
      }
    }, HIDE_CONTROLS_DELAY);
  }, []);

  const revealUI = useCallback(() => {
    setShowUI(true);
    scheduleHide();
  }, [scheduleHide]);

  // reset when source changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setWaiting(false);
    setShowUI(true);
    setDragTime(null);
    setMenuOpen(false);
    setScrub({ show: false, pct: 0, t: 0 });
  }, [src]);

  // ── video element events ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => {
      setPlaying(true);
      revealUI();
    };
    const onPause = () => {
      setPlaying(false);
      setShowUI(true);
    };
    const onTime = () => {
      if (!dragging.current) setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) setBufferedEnd(v.buffered.end(v.buffered.length - 1));
    };
    const onMeta = () => setDuration(v.duration);
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onCanPlay = () => setWaiting(false);
    const onVolume = () => setMuted(v.muted);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("progress", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("volumechange", onVolume);
    void v.play().catch(() => {});
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("progress", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("volumechange", onVolume);
    };
  }, [revealUI, src]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v || !hasStream()) return;
      v.currentTime = clamp(v.currentTime + delta, 0, v.duration || 0);
      setSeekPulse({ side: delta < 0 ? "left" : "right", key: Date.now() });
      revealUI();
    },
    [revealUI],
  );

  /** Single volume button: mute / unmute (no slider, no swipe). */
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 1;
    setMuted(v.muted);
    revealUI();
  };

  const enterPip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* unsupported */
    }
  };

  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch {
      /* fallback handled via fullscreenchange */
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── progress / scrubbing ──
  const pctFromEvent = (e: React.PointerEvent) => {
    const rect = progressRef.current!.getBoundingClientRect();
    return clamp((e.clientX - rect.left) / rect.width, 0, 1);
  };

  const showScrubPreview = (pct: number, t: number) => {
    setScrub({ show: true, pct, t });
    const pv = previewRef.current;
    if (pv) {
      try {
        pv.currentTime = t;
      } catch {
        /* not seekable yet */
      }
    }
  };

  const onProgressDown = (e: React.PointerEvent) => {
    const v = videoRef.current;
    if (!v || !hasStream()) return;
    dragging.current = true;
    wasPlayingBeforeDrag.current = !v.paused;
    v.pause();
    progressRef.current!.setPointerCapture(e.pointerId);
    const pct = pctFromEvent(e);
    const t = pct * (v.duration || 0);
    v.currentTime = t;
    setCurrentTime(t);
    setDragTime(t);
    showScrubPreview(pct, t);
    revealUI();
  };

  const onProgressMove = (e: React.PointerEvent) => {
    const v = videoRef.current;
    if (!v || !hasStream()) return;
    const pct = pctFromEvent(e);
    const t = pct * (v.duration || 0);
    showScrubPreview(pct, t);
    if (dragging.current) {
      v.currentTime = t;
      setCurrentTime(t);
      setDragTime(t);
    }
  };

  const onProgressUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      progressRef.current!.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    setScrub((s) => ({ ...s, show: false }));
    setDragTime(null);
    const v = videoRef.current;
    if (v && wasPlayingBeforeDrag.current) void v.play().catch(() => {});
    revealUI();
  };

  const onProgressLeave = () => {
    if (!dragging.current) setScrub((s) => ({ ...s, show: false }));
  };

  // ── touch: tap toggles the chrome, double-tap seeks ±10s.
  //    Deliberately NO swipe gestures: a horizontal drag over the video is
  //    claimed by the OS/browser (swipe-back), which is what made the page
  //    jump away, and the old brightness/volume swipe handled vertical drags.
  const touch = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number }>({ t: 0, x: 0 });

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      touch.current = null;
      return;
    }
    if ((e.target as HTMLElement).closest("button, .x-seeker, .x-menu")) return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const st = touch.current;
    touch.current = null;
    if (!st) return;
    const t = e.changedTouches[0];
    // anything that moved was a page scroll, not a tap on the video
    if (Math.abs(t.clientX - st.x) > SWIPE_THRESHOLD || Math.abs(t.clientY - st.y) > SWIPE_THRESHOLD) return;
    if (Date.now() - st.time > 350) return;
    const x = t.clientX;
    const w = window.innerWidth;
    if (lastTap.current.t && Date.now() - lastTap.current.t < 280 && Math.abs(x - lastTap.current.x) < 60) {
      lastTap.current = { t: 0, x: 0 };
      if (hasStream()) seekBy(x < w * 0.5 ? -SEEK_STEP : SEEK_STEP);
      return;
    }
    lastTap.current = { t: Date.now(), x };
    setShowUI((s) => !s);
    scheduleHide();
  };

  // mouse / pen only: tapping the surface plays or pauses
  const onStagePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    if ((e.target as HTMLElement).closest("button, .x-seeker, .x-menu, input")) return;
    revealUI();
    togglePlay();
  };

  const dur = duration || 0;
  const playedPct = dur > 0 ? (currentTime / dur) * 100 : 0;
  const loadedPct = dur > 0 ? clamp((bufferedEnd / dur) * 100, 0, 100) : 0;
  const controlsHidden = !showUI && playing;

  return (
    <div
      ref={stageRef}
      className={`player-stage${isFs ? " web-fs" : ""}${showUI ? " player-stage--ui" : ""}${controlsHidden ? " player-stage--hidden" : ""}`}
      onPointerUp={onStagePointerUp}
      onMouseMove={revealUI}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <video
        ref={videoRef}
        className="x-player__video"
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        autoPlay
        muted={muted}
        loop
        title={title}
      />

      {waiting && (
        <div className="x-spinner-wrap show">
          <div className="x-spinner" />
        </div>
      )}

      {seekPulse && (
        <div key={seekPulse.key} className={`x-pulse ${seekPulse.side}`}>
          {seekPulse.side === "left" ? (
            <>
              <svg viewBox="0 0 24 24">{Icon.rewind}</svg>
              <span>{SEEK_STEP}s</span>
            </>
          ) : (
            <>
              <span>{SEEK_STEP}s</span>
              <svg viewBox="0 0 24 24">{Icon.forward}</svg>
            </>
          )}
        </div>
      )}

      {dragTime !== null && (
        <div className="x-drag-time show">
          <span>{formatTime(dragTime)}</span>
          <span className="sep">/</span>
          <span className="rest">{formatTime(dur)}</span>
        </div>
      )}

      {/* top control row */}
      <div className="x-top">
        <div className="x-top__side">
          <button
            className="x-btn"
            aria-label={playing ? "Pause" : "Play"}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <svg viewBox="0 0 24 24">{playing ? Icon.pause : Icon.play}</svg>
          </button>
          <button
            className="x-btn"
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={!muted}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
          >
            <svg viewBox="0 0 24 24">{muted ? Icon.muted : Icon.volume}</svg>
          </button>
        </div>

        <div className="x-top__spacer" />

        <div className="x-top__side">
          <button
            className="x-btn"
            aria-label={`Rewind ${SEEK_STEP} seconds`}
            onClick={(e) => {
              e.stopPropagation();
              seekBy(-SEEK_STEP);
            }}
          >
            <svg viewBox="0 0 24 24">{Icon.rewind}</svg>
          </button>
          <button
            className="x-btn"
            aria-label={`Forward ${SEEK_STEP} seconds`}
            onClick={(e) => {
              e.stopPropagation();
              seekBy(SEEK_STEP);
            }}
          >
            <svg viewBox="0 0 24 24">{Icon.forward}</svg>
          </button>
          <div className="x-menu-host">
            <button
              className="x-btn"
              aria-label="Playback settings"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((m) => !m);
              }}
            >
              <svg viewBox="0 0 24 24">{Icon.settings}</svg>
            </button>
            <div className={`x-menu${menuOpen ? " show" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="x-menu__title">Playback speed</div>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  className={`x-menu__item${speed === s ? " on" : ""}`}
                  onClick={() => {
                    const v = videoRef.current;
                    if (v) v.playbackRate = s;
                    setSpeed(s);
                    setMenuOpen(false);
                  }}
                >
                  {s === 1 ? "Normal" : `${s}×`}
                </button>
              ))}
              <button
                className="x-menu__item"
                onClick={() => {
                  setMenuOpen(false);
                  void enterPip();
                }}
              >
                Picture in picture
              </button>
            </div>
          </div>
          <button
            className="x-btn"
            aria-label="Fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              void toggleFullscreen();
            }}
          >
            <svg viewBox="0 0 24 24">{Icon.fullscreen}</svg>
          </button>
        </div>
      </div>

      {/* timeline */}
      <div className="x-timeline">
        <div
          ref={progressRef}
          className="x-seeker"
          onPointerDown={onProgressDown}
          onPointerMove={onProgressMove}
          onPointerUp={onProgressUp}
          onPointerLeave={onProgressLeave}
        >
          <div className="x-seeker__track">
            <div className="x-seeker__loaded" style={{ width: `${loadedPct}%` }} />
            <div className="x-seeker__played" style={{ width: `${playedPct}%` }} />
          </div>
          <div className="x-seeker__thumb" style={{ left: `${playedPct}%` }} />
          {scrub.show && (
            <div className="x-preview show" style={{ left: `calc(${scrub.pct * 100}% - 120px)` }}>
              <video ref={previewRef} src={src} muted playsInline preload="metadata" />
              <div className="x-preview__time">{formatTime(scrub.t)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="x-chip">{chip}</div>
    </div>
  );
}
