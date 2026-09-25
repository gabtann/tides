# TIDES Frontend

Frontend untuk TIDES, AI research agent yang memindai watchlist saham Indonesia memakai data Sectors (Sectors 2026 Hackathon, Track 1). TIDES menyajikan prioritas riset dan evidence brief, bukan rekomendasi beli/jual atau prediksi harga.

Stack: React 18, TypeScript, Vite, Tailwind CSS 4, React Router 7, Vitest + React Testing Library.

## Menjalankan

Butuh Node.js 22.12 atau lebih baru (syarat Vitest 5; Vite 8 sendiri butuh 20.19+).

```bash
cd frontend
npm install
cp .env.example .env   # opsional, default sudah memakai mock
npm run dev
```

Buka URL yang muncul di terminal (biasanya http://localhost:5173).

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server dengan hot reload |
| `npm test` | Jalankan semua test sekali |
| `npm run test:watch` | Test otomatis jalan ulang saat file disimpan |
| `npm run lint` | Lint dengan oxlint |
| `npm run build` | Type-check (`tsc`) lalu build produksi ke `dist/` |
| `npm run preview` | Sajikan hasil build secara lokal |

Sebelum commit: `npm run lint`, `npm test`, dan `npm run build` harus lolos.

## Konfigurasi

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `false` untuk memakai backend asli lewat `httpTidesApi` |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Alamat backend saat mock dimatikan |

Dengan mock, watchlist disimpan di localStorage browser (`tides.mock.watchlist`), jadi tetap ada setelah refresh. Ticker `ZZZZ` dan `XXXX` sengaja ditolak mock untuk mensimulasikan penolakan dari backend.

## Struktur

```
src/
  screens/     lima layar: Watchlist, ResearchQueue, Investigation, ChallengeSignal, EvidenceBrief
  components/  komponen UI yang dipakai ulang
  types/       kontrak tipe data dengan backend
  services/    TidesApi (interface), mock, dan implementasi HTTP
  context/     state aplikasi (reducer, provider, cache hasil scan)
  hooks/       useWatchlist, useScan
  utils/       fungsi murni: validasi ticker, pengelompokan prioritas, storage aman
  test/        setup dan helper test
```

Komponen hanya bergantung ke `TidesApi` dan tipe di `src/types`, tidak ke bentuk data mentah Sectors. Integrasi backend cukup mengisi `src/services/httpTidesApi.ts`. Detail kontrak ada di `Architecture.md`.

## Status

- Selesai: Watchlist dan Research Queue, berjalan end-to-end dengan mock.
- Belum: isi layar Investigation, Challenge Signal, dan Evidence Brief (masih stub), `httpTidesApi`, dan sesi anonim.
