/**
 * Anonymous event tracking (client side). Fire-and-forget: failures are
 * swallowed so analytics can never break the user experience. Only coarse
 * route kinds and slugs are sent — never URLs with query parameters, never
 * identifiers.
 */
export interface TrackPayload {
  type: "PAGE_VIEW" | "SEARCH" | "VIDEO_PLAY" | "VIDEO_ERROR" | "REPORT_SUBMIT" | "TAKEDOWN_SUBMIT";
  path?: string;
  query?: string;
  videoSlug?: string;
}

export function trackEvent(payload: TrackPayload): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never affect the page.
  }
}
