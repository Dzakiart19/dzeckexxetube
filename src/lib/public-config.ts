/**
 * Client-safe public configuration. Only non-sensitive values belong here
 * (they are inlined into the browser bundle via NEXT_PUBLIC_* variables).
 */
export const PUBLIC_SITE_NAME = "videytube";

export const PUBLIC_ROOT_FOLDER_ID =
  process.env.NEXT_PUBLIC_ROOT_FOLDER_ID && /^[A-Za-z0-9_-]{1,64}$/.test(process.env.NEXT_PUBLIC_ROOT_FOLDER_ID)
    ? process.env.NEXT_PUBLIC_ROOT_FOLDER_ID
    : "your-root-folder-id";
