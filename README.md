# videytube

videytube adalah antarmuka streaming video minimalis berbahasa Indonesia yang memproxy situs upstream sepenuhnya di sisi server. Browser hanya berkomunikasi dengan Route Handler internal Next.js dan tidak pernah mengakses host upstream secara langsung. videytube tidak memiliki, menyimpan, atau mengklaim hak atas konten apa pun; ia hanya menyajikan cara menelusuri folder dan memutar video dari sumber pihak ketiga.

## Fitur

- Antarmuka minimalis berbahasa Indonesia: beranda, folder, tonton, pencarian, dan halaman legal.
- Semua akses upstream terjadi di server; klien hanya menerima path relay internal.
- HTML5 player (`playsInline`, `preload="metadata"`, tanpa autoplay, poster) dengan dukungan seek melalui relay `Range`.
- Resolusi playback bertahap: probe CDN langsung, fallback `stream.php`, validasi host allowlist, lalu relay dengan `Referer`/`User-Agent` yang benar.
- Cache TTL in-memory dengan in-flight deduplication untuk menekan beban ke upstream.
- Rate limiting fixed-window per IP dengan respons 429 dan header `Retry-After`.
- Host allowlist ketat: bukan open proxy dan tahan SSRF; input pengguna tidak pernah bisa memperkenalkan host upstream baru.
- Validasi input Zod di semua endpoint (id `^[A-Za-z0-9_-]{1,64}$`, halaman 1-500).
- Redaksi data sensitif pada log: parameter `t=`, deklarasi `embedToken`, dan bearer token.
- Pencarian lokal dengan debounce, disertai pemberitahuan jujur bahwa upstream tidak menyediakan endpoint pencarian.
- SEO tube-site untuk niche dewasa: `robots.txt` menutup `/api/` dan `/search`, folder/watch indexable dengan metadata dinamis, JSON-LD `WebSite` + `SearchAction`, meta `rating: adult`, sitemap dinamis dari katalog upstream, dan canonical per halaman.
- Status resolusi playback eksplisit: `ready | fallback | expired | forbidden | not-found | upstream-error`.

## Arsitektur

```
Browser (React, Next.js App Router)
   |
   |  fetch() same-origin, hanya ke /api/*
   v
Next.js Route Handlers  (src/app/api/**)
   |
   |  validasi Zod -> rate limit per-IP -> cache TTL (in-memory)
   v
Lapisan layanan server-only  (src/server/**)
   |-- security/allowlist.ts      host allowlist (anti SSRF)
   |-- security/rate-limit.ts     fixed window per-IP
   |-- security/redact.ts         redaksi token pada log
   |-- cache/memory-cache.ts      cache TTL + in-flight dedup
   |-- validation/schemas.ts      skema input
   v
Upstream adapter  (src/server/upstream/**)
   |-- upstream-client.ts       fetch + UA/Referer + timeout 15s
   |-- upstream-parser.ts       parsing Cheerio/regex + dekode embed token
   |-- upstream-resolver.ts     resolusi playback (probe CDN + fallback)
   v
Upstream hosts
   host upstream, CDN video, CDN thumbnail, dan keluarga host
   MP4 edge — semuanya dibatasi lewat allowlist ketat
```

Browser tidak pernah mengetahui host upstream, URL CDN mentah, maupun embed token. Setiap permintaan melewati validasi input, rate limit, dan cache sebelum mencapai adapter upstream, yang menambahkan header `User-Agent`/`Referer` realistis, timeout 15 detik, dan dedup permintaan serentak.

## Struktur folder

```
.
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── page.tsx                        # Beranda: hero, pencarian, folder root
│   │   ├── layout.tsx                      # Layout global
│   │   ├── error.tsx / not-found.tsx       # Error boundary dan 404
│   │   ├── robots.ts / sitemap.ts          # SEO: hanya beranda + halaman legal
│   │   ├── folder/[folderId]/page.tsx      # Breadcrumb, grid, paginasi
│   │   ├── watch/[videoId]/page.tsx        # Player HTML5, metadata, rekomendasi
│   │   ├── search/page.tsx                 # Pencarian lokal (debounce)
│   │   ├── terms/ privacy/ copyright/ contact/  # Halaman legal
│   │   └── api/                            # Route Handlers internal
│   │       ├── folders/root/route.ts
│   │       ├── folders/[folderId]/route.ts
│   │       ├── videos/[videoId]/route.ts
│   │       ├── videos/[videoId]/playback/route.ts
│   │       ├── videos/[videoId]/stream/route.ts   # relay video (Range)
│   │       └── health/route.ts
│   ├── server/                             # Lapisan khusus server (tidak dikirim ke klien)
│   │   ├── upstream/
│   │   │   ├── upstream-client.ts        # Fetch upstream: UA/Referer, timeout, cache, dedup
│   │   │   ├── upstream-parser.ts        # Parsing folder/video + ekstraksi embed token
│   │   │   └── upstream-resolver.ts      # Resolusi playback: probe CDN + fallback
│   │   ├── security/
│   │   │   ├── allowlist.ts                # Host allowlist (https, tanpa kredensial/port)
│   │   │   ├── rate-limit.ts               # Fixed window per-IP
│   │   │   └── redact.ts                   # Redaksi token pada log
│   │   ├── cache/memory-cache.ts           # Cache TTL in-memory
│   │   └── validation/schemas.ts           # Skema Zod untuk input
│   ├── components/                         # home/, folders/, videos/, search/, layout/, ui/
│   ├── lib/                                # config, http, logger, urls, api-client, errors
│   ├── hooks/                              # use-streaming, use-toast, use-mobile
├── public/                                 # Aset statis (logo, robots.txt)
├── Dockerfile                              # Build multi-stage (node:22-alpine + pnpm)
├── docker-compose.yml                      # Deployment satu perintah
└── .env.example                            # Referensi variabel lingkungan
```

## Memulai

Prasyarat: bun 1.x (utama) atau Node.js 20+ dengan pnpm, atau Docker.

### Opsi A: bun

```bash
bun install
bun run dev
```

Buka http://localhost:3000.

### Opsi B: pnpm

```bash
pnpm install
pnpm dev
```

Buka http://localhost:3000.

### Kualitas kode dan produksi

```bash
bun run lint          # ESLint
bunx tsc --noEmit     # Pemeriksaan tipe TypeScript
bun run build         # Build produksi (output standalone) + salin static/public
bun run start         # Menjalankan hasil build standalone
```

Catatan: skrip `dev` berjalan di port 3000 (`next dev -p 3000`). Skrip `db:*` (Prisma) ada di `package.json` tetapi tidak dipakai aplikasi; cache dan rate limit berjalan in-memory tanpa Redis atau Postgres.

## Variabel lingkungan

Semua variabel dirangkum dari `.env.example`. Tanpa file `.env`, aplikasi tetap berjalan dengan default di bawah.

| Variabel | Default | Deskripsi |
|---|---|---|
| `UPSTREAM_BASE_URL` | `https://upstream.example` | Basis URL situs upstream yang diproxy. |
| `UPSTREAM_ROOT_FOLDER_ID` | `your-root-folder-id` | Id folder root sebagai titik masuk konten. |
| `UPSTREAM_TIMEOUT_MS` | `15000` | Timeout setiap permintaan upstream (ms). |
| `UPSTREAM_USER_AGENT` | UA Chrome 124 (Windows) | User-Agent realistis yang dikirim pada setiap permintaan upstream. |
| `UPSTREAM_REFERER` | `https://upstream.example/` | Referer untuk permintaan upstream; wajib bagi host MP4 edge. |
| `VIDEO_CDN_BASE_URL` | `https://video-cdn.example` | Basis kandidat CDN video langsung. |
| `IMAGE_CDN_BASE_URL` | `https://image-cdn.example/image` | Basis URL thumbnail. |
| `CACHE_TTL_FOLDER_SECONDS` | `600` | TTL cache daftar folder (detik). |
| `CACHE_TTL_VIDEO_SECONDS` | `180` | TTL cache metadata video (detik). |
| `CACHE_TTL_PLAYBACK_SECONDS` | `120` | TTL cache hasil resolusi playback (detik). |
| `RATE_LIMIT_PER_MINUTE` | `60` | Batas permintaan/menit/IP untuk folder, video, playback. |
| `RATE_LIMIT_STREAM_PER_MINUTE` | `240` | Batas permintaan/menit/IP untuk relay stream. |
| `LOG_LEVEL` | `info` | Tingkat log: `debug`, `info`, `warn`, `error`. |
| `NEXT_PUBLIC_ROOT_FOLDER_ID` | `your-root-folder-id` | Folder root yang di-inline ke bundle klien. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL publik situs (dipakai robots, sitemap, URL kanonik). |
| `REDIS_URL` | (kosong) | Opsional; tidak diimplementasikan. Cache tetap in-memory. |
| `DATABASE_URL` | (kosong) | Opsional; tidak diimplementasikan. Hanya untuk skala multi-instansi. |

Nilai `NEXT_PUBLIC_*` di-inline saat build. Jika berbeda dari default, set variabel tersebut sebelum menjalankan `build`.

## Dokumentasi API

Semua respons memakai amplop (envelope) seragam dengan pesan berbahasa Indonesia.

| Endpoint | Deskripsi |
|---|---|
| `GET /api/folders/root?page=1` | Daftar subfolder dan video pada folder root. |
| `GET /api/folders/{folderId}?page=1` | Daftar subfolder dan video pada folder tertentu. |
| `GET /api/videos/{videoId}` | Metadata video (judul, durasi, thumbnail, rekomendasi). |
| `GET /api/videos/{videoId}/playback?refresh=1` | Resolusi playback; `refresh=1` melewati cache server. |
| `GET /api/videos/{videoId}/stream` | Relay video internal; mendukung header `Range` untuk seek. |
| `GET /api/health` | Pemeriksaan kesehatan aplikasi. |

Contoh amplop sukses:

```json
{
  "success": true,
  "data": {
    "...": "..."
  }
}
```

Contoh amplop gagal:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Video tidak ditemukan."
  }
}
```

Kode status HTTP:

| Kode | Artinya |
|---|---|
| `200` | Permintaan berhasil. |
| `400` | Input tidak valid (id atau `page` di luar batas). |
| `404` | Folder atau video tidak ditemukan. |
| `429` | Rate limit terlampaui; respons menyertakan header `Retry-After`. |
| `502` / `503` / `504` | Kegagalan upstream (bad gateway, tidak tersedia, timeout). |
| `500` | Kesalahan internal yang tidak terduga. |

## Strategi playback

1. Resolver membentuk kandidat CDN langsung `https://video-cdn.example/{rf}` dan memeriksanya dengan permintaan `Range` kecil (`bytes=0-0`).
2. CDN langsung biasanya menjawab `403`, sehingga resolver memanggil endpoint fallback upstream (`/stream.php` dengan bucket, id, dan token tersemat sebagai query).
3. Parser mengekstrak kandidat URL dari elemen `<source>` dan `<video src>`; atribut `type` tidak dipercaya.
4. Setiap kandidat URL wajib lolos host allowlist: hanya `https`, tanpa kredensial, tanpa port non-standar, dan hanya host CDN video/thumbnail upstream serta keluarga host MP4 edge yang divalidasi dari endpoint fallback.
5. Klien hanya menerima path relay internal `/api/videos/{videoId}/stream`. Relay meneruskan header `Range` ke URL upstream tervalidasi dan menyertakan `Referer`/`User-Agent` yang benar, karena host MP4 edge menolak permintaan tanpa `Referer: https://upstream.example/` (jawaban 403). Raw URL dan embed token tidak pernah keluar dari server.
6. Jika upstream mengembalikan `403`/`404` di tengah sesi (URL bertanda tangan kedaluwarsa), resolver dijalankan ulang dengan satu kali percobaan ulang.
7. Status resolusi yang mungkin: `ready`, `fallback`, `expired`, `forbidden`, `not-found`, `upstream-error`.

## Keamanan dan privasi

- **Host allowlist.** Setiap URL upstream tervalidasi sebelum dipakai: https saja, tanpa kredensial, tanpa port non-standar, dan hanya host yang diizinkan. Aplikasi bukan open proxy dan tahan SSRF; input pengguna tidak pernah bisa memperkenalkan host baru.
- **Rate limiting.** Fixed-window per IP: `RATE_LIMIT_PER_MINUTE` untuk folder/video/playback dan `RATE_LIMIT_STREAM_PER_MINUTE` untuk relay stream; pelanggaran dijawab dengan 429 + `Retry-After`.
- **Validasi input.** Zod pada semua endpoint: id harus cocok `^[A-Za-z0-9_-]{1,64}$`, halaman dibatasi 1-500.
- **Penanganan token.** Embed token hanya berada di memori server; tidak pernah muncul di sumber klien, UI, atau URL halaman.
- **Redaksi log.** Parameter `t=`, deklarasi `embedToken`, dan bearer token disamarkan sebelum ditulis ke log.
- **Tanpa akses upstream dari klien.** Browser hanya menghubungi Route Handler internal; tidak ada crawling otomatis karena data hanya diambil saat pengguna meminta.

## Batasan upstream

- Markup upstream dapat berubah kapan saja; parser dibuat toleran tetapi mungkin perlu diperbarui.
- URL playback bertanda tangan dapat kedaluwarsa; ditangani dengan re-resolve dan satu kali retry.
- CDN langsung sering menolak permintaan (403); jalur fallback `stream.php` adalah jalur utama.
- Bukti paginasi bersifat heuristik: tombol "berikutnya" dinonaktifkan bila tidak ada bukti halaman lanjutan.
- Pencarian hanya lokal atas data folder root yang sudah dimuat; upstream tidak menyediakan endpoint pencarian.
- Thumbnail dimuat langsung oleh browser dari `i.upstream.com` (bukan lewat relay).
- Ketersediaan konten sepenuhnya bergantung pada pihak ketiga; tidak ada jaminan.

## Catatan legal

- Gunakan hanya untuk konten yang Anda miliki izinnya atau yang sah untuk disajikan.
- Tidak ada bypass login, paywall, atau DRM.
- Tidak ada fitur unduh.
- Pemilik situs bertanggung jawab atas halaman Terms, Privacy, dan DMCA; ganti email placeholder `legal@videytube.example` dengan kontak asli sebelum dipublikasikan.
- videytube tidak memiliki, menyimpan, atau mendistribusikan konten apa pun.

## Deployment (Vercel)

Project terhubung ke Vercel melalui GitHub (auto-deploy):

- Repo: `Dzakiart19/dzeckexxetube` (branch `main` = production).
- Setiap push ke `main` otomatis memicu build dan deploy produksi ke `https://videytube.vercel.app`.
- `vercel.json` mengunci perintah build (`next build`) dan install (`bun install`).
- Environment variables produksi diatur di dashboard Vercel (project **videytube**, scope production).

## Docker

Build dan jalankan dengan Docker:

```bash
docker build -t videytube .
docker run --rm -p 3000:3000 --env-file .env.example videytube
```

Atau dengan Docker Compose:

```bash
docker compose up --build
```

Catatan port:

- Di dalam container, server standalone selalu mendengarkan di port 3000 (`ENV PORT=3000`).
- Port di sisi host dapat diubah lewat variabel `PORT`, misalnya `PORT=8080 docker compose up` memetakan `8080 -> 3000`.
- Compose sudah menyertakan variabel `UPSTREAM_*`, `CACHE_*`, dan `RATE_LIMIT_*` dengan default yang masuk akal; Redis dan Postgres tidak diperlukan karena cache dan rate limit berjalan in-memory.
