"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  src: string;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    audio.playbackRate = next;
    setSpeed(next);
  }, [speed]);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2"
      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
        style={{ background: "var(--db-accent)", color: "#fff", border: "none", cursor: "pointer" }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>

      {/* Time */}
      <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--db-text-muted)", minWidth: "3rem" }}>
        {fmt(currentTime)}
      </span>

      {/* Scrubber */}
      <div className="relative flex-1 h-1.5 rounded-full" style={{ background: "var(--db-border)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: "var(--db-accent)", width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Seek"
        />
      </div>

      {/* Duration */}
      <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--db-text-muted)", minWidth: "3rem" }}>
        {fmt(duration)}
      </span>

      {/* Speed */}
      <button
        onClick={cycleSpeed}
        className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium transition-colors"
        style={{
          background: speed === 1 ? "transparent" : "var(--db-accent)",
          color: speed === 1 ? "var(--db-text-muted)" : "#fff",
          border: speed === 1 ? "1px solid var(--db-border)" : "none",
          cursor: "pointer",
        }}
        aria-label={`Playback speed ${speed}x`}
      >
        {speed}x
      </button>
    </div>
  );
}
