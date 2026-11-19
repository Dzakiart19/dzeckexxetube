import { streamrizzProvider } from "./streamrizz";
import { videyProvider } from "./videy";
import type { PlatformId, UpstreamProvider } from "./types";

/**
 * Platform registry. Adding a platform means implementing UpstreamProvider
 * and registering it here — API routes, relay, and SEO surfaces stay generic.
 */
const PROVIDERS: Record<PlatformId, UpstreamProvider> = {
  streamrizz: streamrizzProvider,
  videy: videyProvider,
};

export function getProvider(platform: PlatformId): UpstreamProvider {
  return PROVIDERS[platform];
}

export function isPlatformId(value: string): value is PlatformId {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}

export type { PlatformId, UpstreamProvider } from "./types";
