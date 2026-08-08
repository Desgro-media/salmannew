"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

export function ReelCard({ src, href }: { src: string; href: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function toggleMute(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMuted((m) => !m);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
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

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute reel" : "Mute reel"}
        className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition-colors duration-300 hover:bg-ink/80"
      >
        {muted ? <MutedIcon /> : <UnmutedIcon />}
      </button>
    </a>
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
