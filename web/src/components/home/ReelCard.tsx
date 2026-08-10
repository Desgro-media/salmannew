"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

export function ReelCard({
  src,
  href,
  active,
  onActivate,
}: {
  src: string;
  href: string;
  /** Only the active card streams and decodes — see ReelRow. */
  active: boolean;
  onActivate: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Playback is the product of two conditions rather than the observer firing
  // play() directly: a card only runs when it is both on screen and the one
  // the row has picked, so scrolling past never leaves a video decoding.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active && inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, inView]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function toggleMute(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMuted((m) => !m);
  }

  function activate(e: MouseEvent) {
    if (active) return;
    // First interaction selects the reel instead of following the link, so a
    // tap on a paused card plays it rather than jumping straight to Instagram.
    e.preventDefault();
    onActivate();
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={activate}
      className="group relative block aspect-[9/16] overflow-hidden rounded-[28px] bg-ink"
    >
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent"
      />

      {!active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-paper/40 bg-ink/40">
            <PlayIcon />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/70">
            Play
          </span>
        </span>
      )}

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute reel" : "Mute reel"}
        className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/75 text-paper transition-colors duration-300 hover:bg-ink/90"
      >
        {muted ? <MutedIcon /> : <UnmutedIcon />}
      </button>
    </a>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function UnmutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
