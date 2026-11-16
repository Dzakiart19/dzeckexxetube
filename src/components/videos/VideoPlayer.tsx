"use client";

import { AlertTriangle, Play, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoId: string;
  /** Internal relay URL (validated server-side). */
  src: string;
  poster: string | null;
  title: string;
  /** Bump server caches when the user retries after a media error. */
  onRetry: () => void;
}

/**
 * Accessible HTML5 player: native controls (keyboard operable), poster,
 * playsInline, metadata-only preload, no autoplay. Media errors surface an
 * in-player panel with a retry action instead of a broken element.
 */
export function VideoPlayer({ videoId, src, poster, title, onRetry }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);

  // Cache-bust the relay URL on retries so the browser re-fetches after the
  // server re-resolves a fresh upstream URL.
  const currentSrc = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}v=${attempt}`;

  const handleError = () => {
    const code = videoRef.current?.error?.code;
    // MediaErrorCode.MEDIA_ERR_SRC_NOT_SUPPORTED (4): the source cannot be played.
    setMediaError(
      code === 4
        ? "Format video tidak didukung oleh browser ini."
        : "Terjadi gangguan saat memuat video. Silakan coba lagi.",
    );
  };

  const handleRetry = () => {
    setMediaError(null);
    setStarted(false);
    setAttempt((value) => value + 1);
    onRetry();
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
      <video
        key={`${videoId}-${attempt}`}
        ref={videoRef}
        src={currentSrc}
        poster={poster ?? undefined}
        controls
        playsInline
        preload="metadata"
        onError={handleError}
        onPlaying={() => setStarted(true)}
        className="aspect-video w-full bg-black"
        aria-label={`Pemutar video: ${title}`}
      />

      {!started && !mediaError && (
        <button
          type="button"
          onClick={() => void videoRef.current?.play()}
          className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/25"
          aria-label={`Putar ${title}`}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105">
            <Play className="size-7 translate-x-0.5 fill-current" aria-hidden />
          </span>
        </button>
      )}

      {mediaError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
          <AlertTriangle className="size-8 text-destructive" aria-hidden />
          <p className="text-sm font-medium text-foreground">{mediaError}</p>
          <Button variant="outline" size="sm" className="min-h-11 gap-2 bg-transparent px-5" onClick={handleRetry}>
            <RotateCcw className="size-4" aria-hidden />
            Coba lagi
          </Button>
        </div>
      )}
    </div>
  );
}
