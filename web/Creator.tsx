import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCreator, type CreatorProfile, type ProfileRef, type Video } from "./api";
import { CardSkeletons, CreatorTile, ErrorBox, VideoCard } from "./components";

export default function CreatorPage({
  slug,
  kind = "creator",
  onSelect,
  onSelectCreator,
  onBack,
}: {
  slug: string;
  kind?: "creator" | "pornstar" | "studio";
  onSelect: (v: Video) => void;
  onSelectCreator: (c: ProfileRef) => void;
  onBack: () => void;
}) {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [done, setDone] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  // mirrors the grid length so "did we reach upstream's count?" is answerable
  // without a stale closure
  const countRef = useRef(0);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setMore(true);
      else {
        setLoading(true);
        setError(null);
        setDone(false);
      }
      try {
        const data = await fetchCreator(slug, nextPage, kind);
        if (!append) setProfile(data);
        const incoming = data.videos ?? [];
        const fresh = append ? incoming.filter((v) => !seenIds.current.has(v.id)) : incoming;
        if (append) for (const v of fresh) seenIds.current.add(v.id);
        else seenIds.current = new Set(fresh.map((v) => v.id));

        const known = data.total ?? (append ? undefined : fresh.length);
        if (known !== undefined) setTotal(known);
        const count = (append ? countRef.current : 0) + fresh.length;
        countRef.current = count;
        setVideos((prev) => (append ? [...prev, ...fresh] : fresh));
        // upstream's own catalogue size is the stop line: the grid shows exactly
        // as many videos as the profile has, then ends (no error, no endless scroll)
        setDone(
          !!data.end ||
            fresh.length === 0 ||
            (typeof known === "number" && known > 0 && count >= known),
        );
        setMoreError(null);
        setPage(nextPage);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // a failure while appending must never wipe out the videos already there
        if (append) setMoreError(message);
        else {
          setError(message);
          setVideos([]);
          countRef.current = 0;
        }
      } finally {
        setLoading(false);
        setMore(false);
      }
    },
    [slug, kind],
  );

  useEffect(() => {
    setProfile(null);
    setVideos([]);
    setDone(false);
    setMoreError(null);
    setTotal(undefined);
    countRef.current = 0;
    void load(1, false);
  }, [load]);

  const hasMore = !loading && !done && !moreError && videos.length > 0;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || more) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !more) void load(page + 1, true);
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, more, page, load]);

  if (loading && !profile) {
    return (
      <div className="container">
        <div className="creator-head">
          <span className="creator-head__avatar skeleton" />
          <div className="creator-head__text">
            <div className="skeleton skeleton-line" style={{ width: 220, margin: 0 }} />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        </div>
        <div className="grid" style={{ marginTop: 24 }}>
          <CardSkeletons count={12} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container">
        <ErrorBox message={error || "Creator not found"} onRetry={() => void load(1, false)} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="creator-head">
        <span className="creator-head__avatar">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span>{profile.name.slice(0, 1).toUpperCase()}</span>
          )}
        </span>
        <div className="creator-head__text">
          <h1 className="creator-head__name">{profile.name}</h1>
          <div className="creator-head__meta">
            {profile.kind === "studio" ? "Studio" : profile.kind === "pornstar" ? "Pornstar" : "Creator"}
            {typeof profile.videoCount === "number" && ` · ${profile.videoCount.toLocaleString()} videos`}
            {typeof profile.photoCount === "number" && profile.photoCount > 0 && ` · ${profile.photoCount} photos`}
          </div>
          {profile.alsoKnownAs && (
            <div className="creator-head__aka">Also known as {profile.alsoKnownAs}</div>
          )}
          {profile.description && <p className="creator-head__desc">{profile.description}</p>}
        </div>
        <div className="creator-head__actions">
          <a className="btn btn--glass" href={profile.url} target="_blank" rel="noopener noreferrer nofollow">
            Open on faphouse2.com
          </a>
          <button className="btn btn--glass" onClick={onBack}>
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid" style={{ marginTop: 24 }}>
          <CardSkeletons count={12} />
        </div>
      ) : videos.length === 0 ? (
        <div className="status-box">
          <div className="big">🎬</div>
          <div>No videos listed for this creator right now.</div>
        </div>
      ) : (
        <div className="grid">
          {videos.map((v) => (
            <VideoCard key={v.id} v={v} onSelect={onSelect} onSelectCreator={onSelectCreator} />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="infinite-sentinel" ref={sentinel}>
          {more ? (
            <>
              <span className="spinner" />
              Loading more…
            </>
          ) : (
            "Scroll for more"
          )}
        </div>
      ) : (
        !loading &&
        videos.length > 0 && (
          <div className="list-end">
            {moreError ? (
              <button className="btn btn--glass" onClick={() => void load(page + 1, true)}>
                Couldn’t load more — tap to retry
              </button>
            ) : (
              <>That’s all{' '}{(total ?? videos.length).toLocaleString()} videos</>
            )}
          </div>
        )
      )}

      {profile.related.length > 0 && (
        <div className="creator-related">
          <div className="creator-related__head">
            {profile.kind === "studio" ? "Related performers" : "Related creators"}
          </div>
          <div className="creator-related__rail row-scroller no-scrollbar">
            {profile.related.map((c) => (
              <CreatorTile key={`${c.kind}/${c.slug}`} c={c} onSelect={onSelectCreator} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
