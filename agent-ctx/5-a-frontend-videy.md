# Task 5-a — Frontend videytube 2 (upstream videy) — Work Record

## Status: COMPLETE (frontend scope)

## Files created (no existing files modified)

1. `src/components/videy/VideyVideoCard.tsx` — client card: Link to `videyWatchPath(id, sort)`, aspect-video thumb (lazy img, onError -> Film icon), hover play overlay identical to VideoCard, mm:ss duration badge (bottom-right, hidden when null/<=0), title line-clamp-2 (fallback id), "N tayangan" row via `Intl.NumberFormat("id-ID")` (hidden when null). Exports `VideyVideoSummary = VideyListData["videos"][number]`.
2. `src/components/videy/VideyVideoGrid.tsx` — same grid classes as VideoGrid, passes `sort` down to cards.
3. `src/components/videy/VideySortTabs.tsx` — client pills Terbaru/Trending/Lama from `VIDEY_SORTS`, hrefs via `videyHomePath(sort)` (so terbaru/page-1 omitted), `aria-current="true"` on active, active style `border-transparent bg-primary/15 text-primary`, min-h-11 touch targets.
4. `src/components/videy/VideyHomeView.tsx` — client: sort/page from `useSearchParams` (whitelist via VIDEY_SORTS + `parsePageNumber`), `useVideyVideos(page, sort, refreshNonce)`; header: overline "VIDEYTUBE 2" + h2 "Video viral terbaru dari sumber kedua." + tabs; 8x SkeletonCard video grid while loading; ErrorState (NOT_FOUND -> EmptyState) with retry bumping refreshNonce; EmptyState when empty; `VideyVideoGrid`; `Pagination` (props contract kept, onNavigate pushes `videyHomePath(sort, page)` scroll:true) + extra `p.text-xs` "Halaman X dari Y" when `totalPages != null` (existing Pagination has no totalPages prop).
5. `src/components/videy/VideyWatchView.tsx` — client cascade identical to WatchView: detail loading (SkeletonPlayer + "Menyiapkan halaman video..."), detail 404 -> EmptyState + router.back button, playback loading (SkeletonPlayer + aria-live), playback 404 -> EmptyState, status ready|fallback + playbackUrl -> shared `VideoPlayer` with `onRetry` bumping the shared refreshNonce (two-tier retry), other statuses -> PLAYBACK_MESSAGES map (copied ResolverStatus map). Metadata block: Badge outline "videytube 2", h1, Eye "N tayangan" + Clock "m:ss" row, disclaimer "Sumber kedua: konten disajikan dari penyedia pihak ketiga.", Link "Kembali ke daftar" -> `videyHomePath(sort)`. Breadcrumbs: Beranda -> videytube 2 -> title.
6. `src/app/v2/page.tsx` — server: generateMetadata (title "videytube 2", description, canonical `${siteUrl()}/v2`, OG/Twitter), server ItemList JSON-LD from `getProvider("videy").getDiscovery({page:1,sort:"terbaru"})` try/catch silent max 30 items (same pattern as HomeItemListJsonLd), Breadcrumbs, Suspense fallback skeleton grid -> VideyHomeView.
7. `src/app/v2/watch/[videoId]/page.tsx` — server: generateMetadata via `getProvider("videy").getVideoDetail` try/catch (title template, OG type video.other, absolute thumbnail images, OG videos -> `${siteUrl()}${videyVideoStreamPath(id)}`, video:duration), VideoObject JSON-LD (name/thumbnailUrl/description/isFamilyFriendly:false/inLanguage id-ID/uploadDate=fetchedAt/duration ISO-8601) + BreadcrumbList (Beranda -> videytube 2 -> title), Suspense fallback (breadcrumb pulse + SkeletonPlayer) wrapping JSON-LD + VideyWatchView.

## Verification

- `bunx tsc --noEmit`: ZERO errors in the 7 new files. Remaining tsc errors are all in pre-existing/out-of-scope files (see "Contract mismatches").
- Dev server smoke test: `/v2` and `/v2/watch/x` currently 500 ONLY because the backend provider chain is incomplete (`src/server/providers/videy/client.ts` missing). Proof it is not my regression: the pre-existing API route `/api/videy/videos?page=1` 500s with the identical "Module not found: Can't resolve './client'" error. My pages degrade gracefully (try/catch silent JSON-LD, ErrorState/EmptyState) once backend lands.
- No existing file touched; no console.log; Indonesian copy only; dark tokens only.

## Contract mismatches / notes for next agents

1. **BLOCKER (backend)**: `src/server/providers/videy/client.ts` does not exist but is imported by `providers/videy/index.ts` (`fetchInternalVideyDetail, fetchVideyList, getVideyCacheStats`) and `providers/videy/resolver.ts`. This breaks `/api/videy/*` routes AND any page importing the registry (including `/v2/*`). Backend agent must ship it.
2. `src/hooks/use-videy.ts` (pre-existing, not mine): tsc errors at lines 62/74 — `buildPath(..., null)` where the param type is `Record<string, string | null> | undefined`; passing `null` is invalid under strict TS. Backend/hook owner should change the call sites to `undefined` (or widen the param to accept null).
3. `Pagination` has no `totalPages` prop (contract `{page, hasNextPage, onNavigate, isLoading}`), so "Halaman X dari Y" is rendered as a separate `p.text-xs` under the nav in VideyHomeView, as instructed for the "else" case.
4. `VideySortTabs` takes `active` prop (no useSearchParams) — parent reads search params and passes the parsed sort; single source of truth.
5. Task text suggested wrapping Breadcrumbs in an extra `<nav aria-label="Breadcrumb">`; `Breadcrumbs` already renders exactly that nav, so I render it directly (avoids nested duplicate landmark).
6. `page.tsx` home maps `name: video.title` which can be null into the ItemList JSON-LD (pre-existing); my /v2 ItemList uses `video.title ?? video.id` (strict-safe).
7. Views=0 renders "0 tayangan" (only null/undefined hides), durations <=0 hide the badge — matches "hidden if null" intent while tolerating dirty upstream data.
