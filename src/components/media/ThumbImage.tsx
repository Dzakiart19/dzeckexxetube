"use client";

import { Film } from "lucide-react";
import { useState } from "react";

interface ThumbImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

/**
 * Relay thumbnail with graceful fallback. The src passed here is always an
 * internal /api/thumb path; raw upstream URLs never reach the browser.
 */
export function ThumbImage({ src, alt, className, eager = false }: ThumbImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-secondary/60 ${className ?? ""}`} aria-hidden>
        <Film className="size-8 text-muted-foreground/60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] ${className ?? ""}`}
    />
  );
}
