import { getProvider } from "@/server/providers/registry";
import { serveVideoRelay } from "@/server/relay";

export const dynamic = "force-dynamic";

/** videy playback relay (delegates to the shared platform-agnostic relay). */
export async function GET(request: Request, context: { params: Promise<{ videoId: string }> }) {
  return serveVideoRelay(request, context, getProvider("videy"), "videy-stream");
}
