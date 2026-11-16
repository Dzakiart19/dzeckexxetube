# videytube

videytube adalah platform penemuan dan katalog video dewasa (18+) yang legal, aman, dan bertanggung jawab. Konten berasal dari sumber pihak ketiga yang terverifikasi dan mengizinkan penautan; videytube tidak menyimpan, mendistribusikan, atau mengklaim kepemilikan file video apa pun. Seluruh entri katalog wajib melewati pemeriksaan sumber dan moderasi otomatis sebelum tampil publik.

## Fitur utama

- **Age gate 18+** — konfirmasi usia wajib sebelum konten dewasa tampil; preferensi disimpan di cookie HttpOnly tanpa data pribadi. Sebelum gate: tidak ada thumbnail eksplisit, tidak ada judul eksplisit, tidak ada nama folder.
- **Katalog termoderasi (SQLite + Prisma)** — Source, Category, Folder, Video dengan status `PENDING | APPROVED | REJECTED | UNDER_REVIEW | REMOVED`; hanya `APPROVED` pada sumber `verified + ACTIVE` yang pernah dirender.
- **Moderasi otomatis** — blocklist keras (indikasi minor, non-konsensual, konten bocor/voyeur, tema inses, leetspeak-aware `k0nt0l`/`colm*k`), kategori netral non-vulgar, dan log moderasi untuk setiap keputusan.
- **Kanal pelaporan lengkap** — tombol Report di setiap video (konten disembunyikan otomatis saat dilaporkan), formulir Copyright/DMCA (penghapusan langsung), formulir kontak; semua menghasilkan kode referensi + `ModerationLog`.
- **SEO bertanggung jawab** — metadata unik + canonical + OpenGraph + Twitter Card per halaman, JSON-LD `BreadcrumbList` dan `VideoObject` (hanya bila metadata benar), sitemap hanya untuk konten termoderasi, `noindex` untuk pencarian, robots.txt menutup `/api/` `/search` `/report` `/copyright`.
- **Analytics anonim** — page view, search, play, error, report, takedown — tanpa IP tersimpan, tanpa identifier, tanpa URL sensitif.
- **Relay playback internal** — resolusi upstream (probe CDN + fallback), host allowlist ketat (anti-SSRF/open-proxy), dukungan `Range`, token upstream tidak pernah keluar dari server. Gate moderasi menolak id upstream yang tidak terdaftar di katalog.
- **UI gelap profesional** — navy gelap + teal (bukan merah khas platform video besar), mobile-first, aksesibel, skeleton/empty state yang tidak menggantung.

## Struktur halaman

`/` · `/explore` · `/category/[slug]` · `/folder/[slug]` · `/watch/[slug]` · `/search?q=` · `/sources` · `/report` · `/copyright` · `/adult-content-policy` · `/community-guidelines` · `/privacy` · `/terms` · `/contact` · 404 kustom.

## Arsitektur

```
Browser (React, Next.js App Router)
   |
   |  fetch() same-origin hanya ke /api/* dan path relay
   v
Next.js Route Handlers  (src/app/api/**)
   |
   |  Zod -> rate limit per-IP -> gate moderasi (DB)
   v
Lapisan server-only (src/server/**)
   |-- catalog/sync.ts         sinkronisasi katalog terbatas + moderasi
   |-- catalog/queries.ts      semua query read (filter status APPROVED)
   |-- moderation/moderation.ts  blocklist + kategorisasi + deskripsi katalog
   |-- security/allowlist.ts   host allowlist (anti SSRF)
   |-- security/age-gate.ts    cookie HttpOnly 18+
   v
Upstream adapter (src/server/upstream/**) + SQLite (db/custom.db)
```

Sync berjalan terbatas (bounded) dan sopan: tidak ada pengindeksan massal; hanya sumber terverifikasi yang diambil pada interval terkendali (`POST /api/admin/sync` dengan `ADMIN_SYNC_KEY`, atau `bun run scripts/seed.ts`).

## Memulai

```bash
bun install
bun run db:push        # sinkronkan skema Prisma ke SQLite
bun run scripts/seed.ts  # sinkronisasi + moderasi katalog awal
bun run dev            # http://localhost:3000
```

Kualitas kode: `bun run lint`, `bunx tsc --noEmit`.

## Variabel lingkungan (ringkas)

| Variabel | Keterangan |
|---|---|
| `UPSTREAM_*`, `VIDEO_CDN_BASE_URL`, `IMAGE_CDN_BASE_URL`, `PLAYBACK_HOST_PATTERNS` | Konfigurasi sumber + allowlist. |
| `DATABASE_URL` | SQLite, mis. `file:/absolute/path/db/custom.db`. |
| `ADMIN_SYNC_KEY` | Kunci `POST /api/admin/sync`; kosong = endpoint nonaktif. |
| `NEXT_PUBLIC_SITE_URL` | Basis URL kanonik/sitemap (set `https://videytube.asia` saat domain aktif). |

## Catatan legal

- Larangan mutlak: konten anak di bawah umur, non-konsensual, revenge porn, deepfake tanpa persetujuan, rekaman tersembunyi, konten bocor, pelanggaran hak cipta.
- Disclaimer bukan pengganti izin: sumber wajib mengizinkan penautan sebelum diverifikasi.
- Ganti email placeholder (`legal@videytube.example`) dengan kontak asli sebelum produksi.
- Domain produksi `https://videytube.asia` direncanakan; jangan aktifkan sebelum HTTPS, canonical, sitemap, robots, dan Search Console selesai.
