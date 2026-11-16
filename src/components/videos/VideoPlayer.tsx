"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-client";

interface VideoPlayerProps {
  videoId: string;
  /** Anonymous catalog slug used for aggregate play/error counters. */
  videoSlug: string;
  /** Internal relay URL (validated server-side). */
  src: string;
  /** True when the relay serves an HLS playlist (hls.js playback). */
  isHls?: boolean;
  poster: string | null;
  title: string;
  /** Bump server caches when the user retries after a media error. */
  onRetry: () => void;
}

/**
 * Accessible player: native HTML5 controls for progressive MP4, hls.js for
 * HLS playlists. Poster, playsInline, metadata-only preload, no autoplay
 * with sound. Media errors surface an in-player panel with a retry action;
 * play/error events are tracked anonymously (aggregate counters only).
 */
export function VideoPlayer({ videoId, videoSlug, src, isHls = false, poster, title, onRetry }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playTracked = useRef(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);

  // Cache-bust the relay URL on retries so the browser re-fetches after the
  // server re-resolves a fresh upstream URL.
  const currentSrc = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}v=${attempt}`;

  // HLS playback via hls.js. The relay URL always points at our own API, so
  // no upstream identity is ever exposed to the client.
  useEffect(() => {
    if (!isHls) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let hlsPlayer: any = null;

    const setup = async () => {
      try {
        const hlsModule = await import("hls.js");
        const Hls = hlsModule.default;
        if (cancelled) return;
        if (Hls.isSupported()) {
          hlsPlayer = new Hls({
            // No autoplay-with-sound support needed; keep buffering modest.
            maxBufferLength: 30,
            enableWorker: true,
          });
          hlsPlayer.loadSource(currentSrc);
          hlsPlayer.attachMedia(video);
          hlsPlayer.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean }) => {
            if (data?.fatal) {
              trackEvent({ type: "VIDEO_ERROR", videoSlug });
              setMediaError("Sumber tidak dapat diputar saat ini. Video mungkin telah dihapus atau dipindahkan dari sumber.");
            }
          });
        } else if (!video.canPlayType("application/vnd.apple.mpegurl")) {
          setMediaError("Format video tidak didukung oleh browser ini.");
        }
      } catch {
        setMediaError("Pemutar video tidak dapat dimuat.");
      }
    };

    void setup();
    return () => {
      cancelled = true;
      if (hlsPlayer) hlsPlayer.destroy();
    };
  }, [currentSrc, isHls, videoSlug]);

  const handleError = () => {
    const code = videoRef.current?.error?.code;
    trackEvent({ type: "VIDEO_ERROR", videoSlug });
    setMediaError(
      code === 4
        ? "Format video tidak didukung oleh browser ini."
        : "Sumber tidak dapat diputar saat ini. Video mungkin telah dihapus atau dipindahkan dari sumber.",
    );
  };

  const handlePlay = () => {
    setStarted(true);
    if (!playTracked.current) {
      playTracked.current = true;
      trackEvent({ type: "VIDEO_PLAY", videoSlug });
    }
  };

  const handleRetry = () => {
    setMediaError(null);
    setStarted(false);
    playTracked.current = false;
    setAttempt((value) => value + 1);
    onRetry();
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
      <video
        key={`${videoId}-${attempt}`}
        ref={videoRef}
        src={isHls ? undefined : currentSrc}
        poster={poster ?? undefined}
        controls
        playsInline
        preload="metadata"
        onError={isHls ? undefined : handleError}
        onPlaying={handlePlay}
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
          <span className="flex size-16 items-center justify-center rounded-full border border-primary/50 bg-black/55 text-primary transition-transform duration-200 hover:scale-105">
            <svg viewBox="0 0 24 24" className="size-7 translate-x-0.5 fill-current" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5z" />
            </svg>
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
