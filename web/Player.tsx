import { useCallback, useEffect, useRef, useState } from "react";
import "./player.css";

const SEEK_STEP = 10;
const HIDE_CONTROLS_DELAY = 2800;
const SWIPE_THRESHOLD = 15;
const VB_SENSITIVITY = 0.005;
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
    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  hostLabel?: string;
}

export default function Player({ src, poster, title, hostLabel = "faphouse2.com" }: PlayerProps) {
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
  const [showUI, setShowUI] = useState(false);
  const [isFs, setIsFs] = useState(false);

  // scrub preview
  const [scrub, setScrub] = useState<{ show: boolean; pct: number; t: number }>({
    show: false,
    pct: 0,
    t: 0,
  });
  const dragging = useRef(false);
  const wasPlayingBeforeDrag = useRef(false);

  // gesture feedback
  const [seekPulse, setSeekPulse] = useState<{ side: "left" | "right"; key: number } | null>(null);
  const [dragSeek, setDragSeek] = useState<string | null>(null);
  const [vb, setVb] = useState<{ side: "left" | "right"; value: number } | null>(null);
  const brightness = useRef(1);

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
    setShowUI(false);
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
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("progress", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
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

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
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
      /* fallback handled via fullscreenchange / class */
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
    if (pv && pv.src === videoRef.current?.src) {
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
    const v = videoRef.current;
    if (v && wasPlayingBeforeDrag.current) void v.play().catch(() => {});
    revealUI();
  };

  const onProgressLeave = () => {
    if (!dragging.current) setScrub((s) => ({ ...s, show: false }));
  };

  // ── touch gestures (ported from ui.html) ──
  const touch = useRef<{
    startX: number;
    startY: number;
    time: number;
    tracking: "left" | "right" | "seek" | null;
    initialTime: number;
    initialVb: number;
  } | null>(null);
  const lastTap = useRef<{ t: number; x: number }>({ t: 0, x: 0 });

  const onTouchStart = (e: React.TouchEvent) => {
    const v = videoRef.current;
    if (!v || !hasStream()) return;
    if ((e.target as HTMLElement).closest("button, .progress, .menu")) return;
    const t = e.touches[0];
    touch.current = {
      startX: t.clientX,
      startY: t.clientY,
      time: Date.now(),
      tracking: null,
      initialTime: v.currentTime,
      initialVb: t.clientX < window.innerWidth / 2 ? brightness.current : v.volume,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const st = touch.current;
    const v = videoRef.current;
    if (!st || !v) return;
    const t = e.touches[0];
    const dx = t.clientX - st.startX;
    const dy = t.clientY - st.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (!st.tracking) {
      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;
      if (absDy > absDx * 1.5) {
        st.tracking = st.startX < window.innerWidth / 2 ? "left" : "right";
      } else if (absDx > absDy * 1.2) {
        st.tracking = "seek";
      } else return;
    }
    if (st.tracking === "left" || st.tracking === "right") {
      const next = clamp(st.initialVb - dy * VB_SENSITIVITY, 0, 1);
      if (st.tracking === "left") {
        brightness.current = 0.3 + next * 0.7;
        v.style.filter = `brightness(${brightness.current})`;
      } else {
        v.volume = next;
        v.muted = false;
        setMuted(false);
      }
      setVb({ side: st.tracking, value: next });
    } else if (st.tracking === "seek") {
      const swipeSeconds = (dx / window.innerWidth) * 180;
      const t2 = clamp(st.initialTime + swipeSeconds, 0, v.duration || 0);
      v.currentTime = t2;
      setCurrentTime(t2);
      setDragSeek(`${formatTime(t2)} / ${formatTime(v.duration || 0)}`);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const st = touch.current;
    if (!st) return;
    const dt = Date.now() - st.time;
    const moved = st.tracking !== null;
    if (st.tracking === "seek") setDragSeek(null);
    const fadeVb = () => window.setTimeout(() => setVb(null), 500);
    if (moved) fadeVb();
    else if (dt < 300) {
      const x = e.changedTouches[0].clientX;
      const w = window.innerWidth;
      // double-tap seek
      if (lastTap.current.t && Date.now() - lastTap.current.t < 280 && Math.abs(x - lastTap.current.x) < 60) {
        if (x < w * 0.5) seekBy(-SEEK_STEP);
        else seekBy(SEEK_STEP);
        lastTap.current = { t: 0, x: 0 };
      } else {
        lastTap.current = { t: Date.now(), x };
        // single tap: toggle controls
        setShowUI((s) => !s);
        scheduleHide();
      }
    }
    touch.current = null;
  };

  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, .progress, .menu")) return;
    if (!hasStream()) return;
    revealUI();
    togglePlay();
  };

  const dur = duration || 0;
  const playedPct = dur > 0 ? (currentTime / dur) * 100 : 0;
  const loadedPct = dur > 0 ? clamp((bufferedEnd / dur) * 100, 0, 100) : 0;

  return (
    <div
      ref={stageRef}
      className={`player-stage${isFs ? " web-fs" : ""}`}
      onClick={onStageClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <video
        ref={videoRef}
        className="main-video"
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        muted={muted}
        loop
      />

      {/* hidden scrub-preview video (seeks the same mp4) */}
      <div className={`scrub-preview${scrub.show ? " show" : ""}`} style={{ left: `${scrub.pct * 100}%` }}>
        <div className="scrub-preview-box">
          <video ref={previewRef} src={src} muted playsInline preload="metadata" />
        </div>
        <div className="scrub-line" />
        <div className="time-display" style={{ marginTop: 4, padding: 0 }}>
          {formatTime(scrub.t)}
        </div>
      </div>

      {waiting && (
        <div className="spinner-wrap show">
          <div className="spinner" />
        </div>
      )}

      {/* glass center play (visible when paused) */}
      <button
        className={`center-play${playing ? " hidden-play" : " visible"}`}
        aria-label="Play"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        <svg viewBox="0 0 24 24">{Icon.play}</svg>
      </button>

      {/* gesture feedback */}
      {seekPulse && (
        <div key={seekPulse.key} className={`seek-feedback ${seekPulse.side} show`}>
          {seekPulse.side === "left" ? (
            <>
              <svg viewBox="0 0 24 24">{Icon.rewind}</svg>
              <span>10s</span>
            </>
          ) : (
            <>
              <span>10s</span>
              <svg viewBox="0 0 24 24">{Icon.forward}</svg>
            </>
          )}
        </div>
      )}
      {dragSeek && <div className="drag-seek-overlay show">{dragSeek}</div>}
      {vb && (
        <div className={`vb-overlay ${vb.side} show`}>
          <div className="vb-icon">
            <svg viewBox="0 0 24 24">{vb.side === "right" ? Icon.volume : Icon.settings}</svg>
          </div>
          <div className="vb-bar-container">
            <div className="vb-fill" style={{ height: `${vb.value * 100}%` }} />
          </div>
        </div>
      )}

      {/* control overlays */}
      <div className={`player-ui${showUI ? " show" : ""}`}>
        <div className="ui-top">
          <div className="ui-title" title={title}>
            {title}
            <small>PREVIEW · FULL ON {hostLabel.toUpperCase()}</small>
          </div>
          <div className="ui-top-right">
            <div className="menu-wrapper">
              <button
                className="ui-icon-btn"
                aria-label="Settings"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((m) => !m);
                }}
              >
                <svg viewBox="0 0 24 24">{Icon.settings}</svg>
              </button>
              <div className={`menu${menuOpen ? " show" : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className="menu-section">Playback Speed</div>
                {SPEEDS.map((s) => (
                  <div
                    key={s}
                    className={`menu-item${speed === s ? " active" : ""}`}
                    onClick={() => {
                      const v = videoRef.current;
                      if (v) v.playbackRate = s;
                      setSpeed(s);
                      setMenuOpen(false);
                    }}
                  >
                    {s === 1 ? "Normal" : `${s}x`}
                  </div>
                ))}
              </div>
            </div>
            <button className="ui-icon-btn" aria-label="Fullscreen" onClick={(e) => { e.stopPropagation(); void toggleFullscreen(); }}>
              <svg viewBox="0 0 24 24">{Icon.fullscreen}</svg>
            </button>
          </div>
        </div>

        <div className="ui-bottom">
          <div
            ref={progressRef}
            className="progress"
            onPointerDown={onProgressDown}
            onPointerMove={onProgressMove}
            onPointerUp={onProgressUp}
            onPointerLeave={onProgressLeave}
          >
            <div className="progress-track">
              <div className="progress-loaded" style={{ width: `${loadedPct}%` }} />
              <div className="progress-played" style={{ width: `${playedPct}%` }} />
              <div className="progress-thumb" style={{ left: `${playedPct}%` }} />
            </div>
          </div>
          <div className="controls">
            <button className="ctrl-btn" aria-label="Play/Pause" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              <svg viewBox="0 0 24 24">{playing ? Icon.pause : Icon.play}</svg>
            </button>
            <button className="ctrl-btn" aria-label="Rewind 10s" onClick={(e) => { e.stopPropagation(); seekBy(-SEEK_STEP); }}>
              <svg viewBox="0 0 24 24">{Icon.rewind}</svg>
            </button>
            <button className="ctrl-btn" aria-label="Forward 10s" onClick={(e) => { e.stopPropagation(); seekBy(SEEK_STEP); }}>
              <svg viewBox="0 0 24 24">{Icon.forward}</svg>
            </button>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="sep">/</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="ctrl-spacer" />
            <button className="ctrl-btn" aria-label="Mute" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
              <svg viewBox="0 0 24 24">{muted ? Icon.muted : Icon.volume}</svg>
            </button>
            <button className="ctrl-btn" aria-label="Picture in picture" onClick={(e) => { e.stopPropagation(); void enterPip(); }}>
              <svg viewBox="0 0 24 24">{Icon.pip}</svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
