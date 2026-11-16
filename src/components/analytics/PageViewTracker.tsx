"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics-client";

interface PageViewTrackerProps {
  /** Coarse route kind, e.g. "home" | "explore" | "folder" | "watch". */
  pathKind: string;
  videoSlug?: string;
}

/**
 * Records one anonymous page-view event per mount. No identifiers, no
 * query strings — the coarse route kind is enough for aggregate counts.
 */
export function PageViewTracker({ pathKind, videoSlug }: PageViewTrackerProps) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent({ type: "PAGE_VIEW", path: pathKind, ...(videoSlug ? { videoSlug } : {}) });
  }, [pathKind, videoSlug]);
  return null;
}
