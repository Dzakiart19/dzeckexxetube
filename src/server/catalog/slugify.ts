import { db } from "@/lib/db";

/**
 * Deterministic, URL-safe slug generation for catalog entries.
 *
 * Slugs are stable across syncs (they derive from the entry name plus a short
 * hash of the upstream id) and unique within the catalog (a DB check plus a
 * numeric suffix resolves rare collisions).
 */

const SLUG_MAX_BASE = 44;
const HASH_LENGTH = 6;

/** Normalize a name into a lowercase kebab slug (ASCII only). */
function baseSlug(raw: string): string {
  const normalized = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX_BASE)
    .replace(/-$/g, "");
  return normalized;
}

/** Stable short hash (base36) of a string, used as a uniqueness suffix. */
function shortHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36).padStart(HASH_LENGTH, "0").slice(-HASH_LENGTH);
}

/**
 * Build the intended slug for an entry, then make it unique against the
 * database by appending -2, -3... when a collision exists.
 */
export async function uniqueSlug(
  kind: "folder" | "video",
  name: string,
  upstreamId: string,
): Promise<string> {
  const base = baseSlug(name) || kind;
  const intended = `${base}-${shortHash(`${kind}:${upstreamId}`)}`;

  let candidate = intended;
  let counter = 1;
  // Slugs never change once assigned, so a plain unique lookup is enough.
  for (;;) {
    const clash =
      kind === "folder"
        ? await db.folder.findUnique({ where: { slug: candidate }, select: { id: true } })
        : await db.video.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash) return candidate;
    counter += 1;
    candidate = `${intended}-${counter}`;
  }
}
