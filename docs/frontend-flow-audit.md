# Frontend Flow Audit (CP2)

Tanggal: 28–29-09-2026 · Branch: `feature/frontend` (sama dengan `main` @ `cea0dec`)
Cakupan: audit alur UI, API, mock, dan state. Tidak ada kode aplikasi yang diubah di CP2.

## Ringkasan

- Mode mock: alur 6 layar bisa dilalui penuh.
- Mode backend: alur berhenti di Research Queue karena scan 5 ticker menghasilkan 0 signal (data pasar 28-09-2026).
- Watchlist dan Scan sudah memakai backend asli. Investigation, Challenge, dan Evidence Brief masih mock.
- Endpoint challenge belum ada. Endpoint `/api/agent/investigate` ada, tetapi agent belum dikonfigurasi dan bentuk responsnya belum cocok dengan frontend.
- Demo berisiko gagal bila frontend tidak berjalan di port 5173 (CORS) atau bila hasil scan mock masih tersimpan di browser.

## Tabel Utama

| FLOW | STATUS | MOCK? | MISSING? | ACTION CP3 |
|---|---|---|---|---|
| Watchlist | Berjalan dengan backend | Tidak | Header API key (K13); watchlist hilang saat backend restart (K23) | Frontend kirim `x-api-key` bila `TIDES_API_KEY` diaktifkan; backend simpan watchlist permanen |
| Scan | Berjalan dengan backend (4,85 detik untuk 5 ticker) | Tidak | `priority` dan waktu per signal dari backend (K18, K19) | Backend kirim `priority`; frontend hapus aturan sementara |
| Research Queue | Berjalan, tetapi kosong dengan data 28-09-2026 | Tidak | Data demo yang pasti memicu signal (K22); hasil scan mock terbawa ke mode backend (K32) | Tim putuskan strategi data demo; frontend pisahkan penyimpanan scan per mode |
| Signal Detail | Berjalan di mode mock; tidak tercapai di mode backend | Tidak | Bergantung pada Research Queue (K22) | Ikut strategi data demo |
| Investigation | Tampil, data templat sama untuk semua ticker | Ya (K14) | Endpoint investigate untuk frontend; loading per blok dan keterangan blok kosong (K24) | Sambungkan ke `/api/agent/investigate` setelah kontrak disepakati; frontend tambah loading per blok |
| Challenge Signal | Tampil, data templat | Ya (K14) | Endpoint challenge (K17) | Backend buat endpoint challenge |
| Evidence Brief | Tampil, data templat | Ya (K14) | Kontrak evidence belum cocok (K15); agent belum dikonfigurasi (K16) | Sepakati bentuk `EvidenceBrief`, lalu sambungkan; frontend tambah loading/error bila layar ini mendapat endpoint sendiri |
| Setup demo (lintas layar) | Butuh langkah manual developer | Default mock (K21) | CORS hanya port 5173 (K31); pesan error salah arah (K30); backend keluar diam-diam saat port bentrok (K29) | Frontend kunci port Vite dan perbaiki teks error; backend cek error saat `listen` |

## Task 1 — Test Flow

Diuji manual dua kali: mode mock (`VITE_USE_MOCK=true`) dan mode backend (`VITE_USE_MOCK=false`, backend di port 4000).

### Mode mock

| # | Aksi | Hasil |
|---|---|---|
| M1 | Buka `/` | OK |
| M2 | Tambah BBRI, TLKM, UNVR | OK |
| M3 | Tambah ZZZZ | OK, ditolak "ZZZZ is not listed on IDX." (khusus mock) |
| M4 | Scan Watchlist |  OK, BBRI (HIGH) dan TLKM (MEDIUM); UNVR  tanpa signal |
| M5 | Buka kartu BBRI | OK, Signal Detail |
| M6 | Investigate | OK, 4 blok + tombol Challenge signal |
| M7 | Challenge signal | OK, Initial signal, TIDES challenge, Signal strength |
| M8 | View evidence |  OK, 4 bagian + strength + priority + disclaimer |
| M9 | Refresh (F5) di Evidence Brief | OK, tampil "isn't ready" + link Go to challenge |
| M10 | Go to challenge | OK, challenge berjalan lagi |
| M11 | Kembali ke Queue | OK, hasil scan masih tersimpan |

Kesimpulan: alur 6 layar bisa dilalui penuh.

### Mode backend

| # | Aksi | Hasil |
|---|---|---|
| B1 | Buka `/` | OK, `GET /api/watchlist` 200 tanpa API key (auth backend tidak aktif) |
| B2 | Tambah BBRI, BBCA, TLKM, GOTO, ASII | OK |
| B3 | Scan | OK, 4,85 detik untuk 5 ticker |
| B4 | Response `POST /api/scan` |  `symbols_scanned: 5`, `signals_detected: 0`, `queue: []`, `errors: []` |
| B5 | Research Queue | "No significant changes across your watchlist.", tanpa kotak error (K22) |
| B6 | Buka kartu signal | Tidak bisa dilalui, Queue kosong (K22) |
| B7–B8 | Buka `/investigate/BBRI` langsung → Challenge → Evidence | Ketiga layar tampil, tetapi satu-satunya request ke backend adalah `watchlist`; data dari mock (K14) |
| B9 | Backend dimatikan, refresh `/` | OK, pesan error + tombol Retry |
| B10 | Backend dinyalakan lagi, Retry | Watchlist kosong kembali (K23) |

Kesimpulan: dengan data pasar 28-09-2026, alur berhenti di Research Queue. Investigation, Challenge, dan Evidence Brief belum memakai backend.

Bukti tambahan: `/investigate/GOTO` dan `/investigate/ASII` menampilkan angka yang identik, hanya ticker yang berbeda (data templat mock).

## Task 2 — Audit API

File utama: `frontend/src/services/httpTidesApi.ts`. Semua nomor baris per commit `cea0dec`.

### A. Endpoint

| Method `TidesApi` | Endpoint backend | Status | Baris |
|---|---|---|---|
| `getWatchlist` | `GET /api/watchlist` | REAL | 122–125 |
| `addTicker` | `POST /api/watchlist` | REAL | 127–132 |
| `removeTicker` | `DELETE /api/watchlist/:symbol` | REAL (404 dianggap sukses) | 134–142 |
| `scanWatchlist` | `POST /api/scan` | REAL + mapping | 144–146 |
| `investigate` | tidak ada panggilan ke backend | MOCK (K14) | 148 |
| `challenge` | tidak ada panggilan ke backend | MOCK (K14) | 149 |
| — | `POST /api/agent/investigate` (ada di backend) | Belum dipakai frontend (K14, K15) | — |
| — | `GET /api/signals` (ada di backend) | Belum dipakai frontend (sengaja) | — |

### B. Nilai hardcoded di `httpTidesApi.ts`

| Nilai | Baris | Catatan | K |
|---|---|---|---|
| Fallback `BASE_URL` = `http://localhost:4000/api` | 8 | Dipakai bila `.env` tidak ada | K19 |
| `NETWORK_ERROR_MESSAGE` | 10 | Teks tetap; juga dipakai untuk respons non-JSON | K30 |
| `headers` hanya `Content-Type`, tanpa `x-api-key` | 31 | Semua request 401 bila backend mengaktifkan `TIDES_API_KEY` | K13 |
| Respons non-JSON memakai `NETWORK_ERROR_MESSAGE` | 38 | Server terjangkau tetapi pesan menyebut "could not be reached" | K30 |
| `SIGNAL_PRIORITY` + aturan "≥2 signal = HIGH" | 66–71, 89–93 | Backend tidak mengirim `priority` | K18 |
| `describeSignal()` | 73–86 | Kalimat reason disusun frontend dari `type` + `magnitude` | K19 |
| `detectedAt: raw.scanned_at` | 107 | Backend tidak mengirim waktu per signal | K19 |
| `notYetInBackend = createMockTidesApi()` | 119 | Sumber mock untuk investigate dan challenge | K14 |

### C. File lain yang memengaruhi data di layar

| File | Baris | Isi | K |
|---|---|---|---|
| `src/services/index.ts` | 5 | Mode mock adalah default; mode backend hanya bila `VITE_USE_MOCK` persis `'false'` | K21 |
| `src/services/mockTidesApi.ts` | 10 | Watchlist mock di localStorage `tides.mock.watchlist` | K21 |
| `src/services/mockTidesApi.ts` | 13 | `ZZZZ` dan `XXXX` ditolak (hanya di mock) | K21 |
| `src/services/mockTidesApi.ts` | 33 | `KNOWN_SIGNALS`: signal tetap untuk BBRI, GOTO, TLKM, ASII, BBCA, UNVR | K21 |
| `src/services/mockTidesApi.ts` | 57 | Delay palsu 0,5–1,5 detik | K21 |
| `src/services/mockTidesApi.ts` | 99–118 | `investigate`: angka tetap untuk semua ticker | K14, K21 |
| `src/services/mockTidesApi.ts` | 120–139 | `challenge` + brief: teks tetap; `signalStrength` dan `evidenceStrength` selalu MODERATE; `researchPriority` mengikuti `mockSignalFor(ticker)` (baris 135) | K14, K21 |
| `src/context/persistence.ts` | 6 | Key `tides.scan` sama untuk mode mock dan backend | K32 |
| `src/utils/companyNames.ts` | seluruh file | Tabel statis nama perusahaan | K20 |

Ringkasan: 4 method REAL, 2 method MOCK, 2 endpoint backend belum dipakai.

## Task 3 — Mapping Backend → Frontend → UI

Asal data: REAL = dari backend, FRONTEND = dibuat frontend, MOCK = dari `mockTidesApi`.

### Watchlist

| Backend field | Frontend field | UI component | Asal |
|---|---|---|---|
| `data.watchlist[].symbol` | `WatchlistItem.ticker` | `WatchlistScreen` (daftar ticker) | REAL |
| `data.watchlist[].added_at` | `WatchlistItem.addedAt` | Tidak ditampilkan | REAL |
| `error.message` | `Error.message` | `ErrorState`, pesan error form | REAL |

### Scan dan Research Queue

| Backend field | Frontend field | UI component | Asal |
|---|---|---|---|
| `scanned_at` | `ScanResult.scannedAt` | `ResearchQueueScreen` ("Scanned …") | REAL |
| `queue[].ticker` | `Signal.ticker` | `SignalCard`, `SignalDetailScreen` | REAL |
| `queue[].type` + `magnitude` | `Signal.reason` | `SignalCard`, `SignalDetailScreen` | FRONTEND dari data REAL (K19) |
| Tidak ada | `Signal.priority` | `PriorityBadge`, warna kartu, grup Queue | FRONTEND (K18) |
| Tidak ada (memakai `scanned_at`) | `Signal.detectedAt` | `SignalCard` ("12m ago") | FRONTEND (K19) |
| Tidak ada | Nama perusahaan | `SignalCard`, `SignalDetailScreen` | FRONTEND, tabel statis (K20) |
| `errors[].symbol` | `ScanError.ticker` | Kotak "could not be scanned" | REAL |
| `errors[].message` | `ScanError.message` | Kotak "could not be scanned" | REAL, disamarkan backend (K25) |

Field backend yang dikirim tetapi belum dipakai: `symbols_scanned`, `signals_detected`, `queue[].direction`, `queue[].raw_value`, `queue[].currentContext`, `queue[].availableTools`, `errors[].code`.

### Investigation

| Backend field | Frontend field | UI component | Asal |
|---|---|---|---|
| Tidak ada endpoint yang dipakai | `InvestigationResult` (4 blok: `label`, `summary`, `dataPoints`) | `InvestigationScreen` → `ContextBlockCard` | MOCK (K14) |

### Challenge Signal

| Backend field | Frontend field | UI component | Asal |
|---|---|---|---|
| Tidak ada endpoint (K17) | `ChallengeResult.initialSignal` | `ChallengeSignalScreen` | MOCK |
| Tidak ada endpoint (K17) | `ChallengeResult.challengeFinding` | `ChallengeSignalScreen` | MOCK |
| Tidak ada endpoint (K17) | `ChallengeResult.signalStrength` | `StrengthIndicator` | MOCK |

### Evidence Brief — perbandingan kontrak (K15)

Backend: `backend/src/services/evidence.service.js` (respons `POST /api/agent/investigate`). Frontend: `frontend/src/types/evidenceBrief.ts`.

| Backend field | Frontend field | UI component | Cocok? |
|---|---|---|---|
| `ticker` (bisa `null`) | `ticker: string` | Judul `EvidenceBriefScreen` | Hampir; frontend tidak menerima `null` |
| `observed` (default `[]`) | `observed: string` | Bagian Observed | Tidak; array vs teks |
| `compared` (default `[]`) | `compared: string` | Bagian Compared | Tidak; array vs teks |
| `interpreted` (default `[]`) | `interpreted: string` | Bagian Interpreted | Tidak; array vs teks |
| `unknown` (default `[]`) | `unknown: string` | Bagian Unknown | Tidak; array vs teks |
| `evidenceStrength` (default `'Weak'`) | `'STRONG' \| 'MODERATE' \| 'WEAK'` | `StrengthIndicator` | Tidak; huruf besar/kecil berbeda |
| Tidak ada | `researchPriority` | `PriorityBadge` | Tidak ada di backend |
| Tidak ada | `generatedAt` | Teks "Generated …" | Tidak ada di backend |
| `signal` | Tidak ada | — | Tidak dipakai frontend |
| `limitation` | Tidak ada | — | Tidak dipakai frontend |

Catatan: `ChallengeResult.signalStrength` tampil di layar Challenge, sedangkan `ChallengeResult.brief.evidenceStrength` tampil di layar Evidence Brief. Keduanya memakai komponen `StrengthIndicator`.

### Nama tipe signal (K27)

| Sumber | Nama tipe pergerakan harga |
|---|---|
| `backend/src/services/signal-engine.service.js:22` | `PRICE_CHANGE` |
| `frontend/src/services/httpTidesApi.ts:54, 67, 75` | `PRICE_CHANGE` |
| `docs/agent-input-schema.md:15, 56` | `PRICE_MOVEMENT` |

Keputusan: acuan adalah backend (`PRICE_CHANGE`). Frontend sudah sesuai. `docs/agent-input-schema.md` perlu disamakan oleh Agent Lead.

## Task 4 — Missing State

Label: ADA = state tersedia; SEBAGIAN = ada tetapi belum sesuai PRD; BELUM ADA = temuan; TIDAK RELEVAN = layar tidak memanggil API sehingga state tersebut tidak diperlukan.

| Layar | Idle | Loading | Success | Error | Empty |
|---|---|---|---|---|---|
| Watchlist | ADA (tampil sebagai Loading) | ADA | ADA | ADA (Retry) | ADA (HeroSection) |
| Research Queue | ADA ("No scan yet" + link) | ADA ("Scanning …") | ADA | ADA ("Retry scan") | ADA ("No significant changes" dan "Your watchlist is empty") |
| Signal Detail | TIDAK RELEVAN | TIDAK RELEVAN | ADA | TIDAK RELEVAN | ADA ("This signal isn't loaded") |
| Investigation | ADA (tampil sebagai Loading, lalu mulai otomatis) | SEBAGIAN: satu loading untuk semua blok (K24) | ADA | ADA (Retry) | BELUM ADA: blok tanpa `dataPoints` tampil kosong (K24) |
| Challenge Signal | ADA (tampil sebagai Loading, lalu mulai otomatis) | ADA | ADA | ADA (Retry) | TIDAK RELEVAN |
| Evidence Brief | TIDAK RELEVAN | TIDAK RELEVAN | ADA | TIDAK RELEVAN | ADA ("isn't ready" + link ke Challenge) |

Catatan:
- Signal Detail dan Evidence Brief hanya membaca data yang sudah ada di memori aplikasi (hasil scan dan hasil challenge), sehingga tidak memiliki Loading atau Error. Ini berbeda dari contoh di tugas CP2 dan disengaja. Bila Evidence Brief kelak mendapat endpoint sendiri, Loading dan Error perlu ditambahkan (frontend, CP3).
- Error Investigation dan Challenge tidak dapat dipicu di browser karena mock tidak pernah gagal. Buktinya ada di unit test: `InvestigationScreen.test.tsx` (test "recovers from a failed investigation with Retry") dan `ChallengeSignalScreen.test.tsx` (test "shows the message from the backend and recovers with Retry").
- Research Queue juga menampilkan error parsial: kotak "could not be scanned" untuk ticker yang gagal, sementara ticker lain tetap tampil.

### Pesan error lintas layar

| Kasus | Yang tampil | Status | K |
|---|---|---|---|
| Backend mengembalikan envelope error | Pesan dari backend | ADA | — |
| Rate limit (429) | "Too many requests" | ADA, tanpa info kapan boleh mencoba lagi | K26 |
| Backend mati | "The TIDES service could not be reached. Please check your internet connection…" | SEBAGIAN: menyebut internet, padahal backend yang mati | K30 |
| Respons non-JSON (misalnya route tidak ada) | "The TIDES service could not be reached…" | SEBAGIAN: server terjangkau, tetapi pesan menyebut tidak terjangkau | K30 |
| Error dari Sectors atau agent | "An error occurred while communicating with external services" | SEBAGIAN: penyebab asli disamarkan backend | K25 |

Bukti pengecekan: C1 (Signal Detail kosong), C2 (error scan saat backend mati), C3 (61 request ke `/api/signals`: 60× `200`, lalu `429` `{"success":false,"error":{"code":"RATE_LIMITED","message":"Too many requests"}}`).

## Task 5 — Audit Demo Flow

| Kebutuhan | Bagian demo | Detail | K |
|---|---|---|---|
| Mock | Investigation, Challenge, Evidence Brief | Data templat, sama untuk semua ticker | K14, K21 |
| Mock | Alur 6 layar | Hanya bisa dilalui penuh di mode mock | K21, K22 |
| Data manual | Research Queue (mode backend) | Butuh ticker yang memicu signal di hari demo; 28-09-2026: 0 dari 5 ticker | K22 |
| Data manual | Nama perusahaan | Hanya ticker di tabel statis | K20 |
| Data manual | Priority | Dihitung aturan frontend, bukan backend | K18 |
| Intervensi developer | Persiapan | Menjalankan backend dan frontend, mengisi `backend/.env`, mengatur `VITE_USE_MOCK` (default mock) | K21 |
| Intervensi developer | Auth | `TIDES_API_KEY` harus kosong; bila diisi, semua request frontend 401 | K13 |
| Intervensi developer | Watchlist | Harus diisi ulang setiap backend restart | K23 |
| Intervensi developer | Start backend | Bila port 4000 terpakai, backend mencetak "running" lalu keluar diam-diam | K29 |
| Intervensi developer | Port frontend | Frontend harus berjalan di port 5173; port lain diblokir CORS | K31 |
| Intervensi developer | Pindah mode | Hasil scan mock tetap tampil di mode backend sampai `tides.scan` dihapus | K32 |
| Intervensi developer | Refresh | Refresh di tengah Investigation–Evidence membuat alur harus diulang | K28 |
| Endpoint belum tersedia | Challenge | `POST /api/challenge` → `Cannot POST /api/challenge` | K17 |
| Endpoint belum siap | Agent | `POST /api/agent/investigate` → `AGENT_NOT_CONFIGURED` | K16 |
| Kontrak belum cocok | Evidence Brief | Bentuk respons agent berbeda dari `EvidenceBrief` (lihat Task 3) | K15 |

### Persiapan demo (sebelum CP3 selesai)

1. Tutup dev server lain agar frontend berjalan di `http://localhost:5173` (K31).
2. Jalankan backend sekali saja dan pastikan tidak muncul `[nodemon] clean exit` (K29).
3. Pastikan `TIDES_API_KEY` di backend kosong (K13).
4. Sebelum demo mode backend, hapus `tides.scan` di DevTools → Application → Local Storage (K32).
5. Isi ulang watchlist setelah backend restart (K23).
6. Jangan refresh di tengah Investigation, Challenge, atau Evidence Brief (K28).
7. Untuk menampilkan alur penuh, gunakan mode mock (K14, K22).

## Daftar Temuan

| K | Temuan | Dikerjakan oleh (CP3) |
|---|---|---|
| K13 | Frontend tidak mengirim header API key | Frontend |
| K14 | Investigation, Challenge, dan Evidence Brief masih mock | Frontend + Backend |
| K15 | Kontrak evidence backend berbeda dari frontend | Frontend + Backend (sepakati dulu) |
| K16 | Agent belum dikonfigurasi (`AGENT_NOT_CONFIGURED`) | Backend / Agent |
| K17 | Endpoint challenge belum ada | Backend |
| K18 | `priority` tidak dikirim backend; frontend memakai aturan sementara | Backend, lalu frontend |
| K19 | `detectedAt` memakai `scanned_at`; reason disusun frontend; fallback `BASE_URL` | Backend (opsional) |
| K20 | Nama perusahaan dari tabel statis | Frontend / Backend |
| K21 | Perilaku khusus mock dan mode mock sebagai default | Catat saja |
| K22 | Research Queue kosong dengan data asli | Tim (strategi data demo) |
| K23 | Watchlist backend hilang saat restart | Backend |
| K24 | Investigation: satu loading untuk semua blok; blok kosong tanpa keterangan | Frontend |
| K25 | Pesan error Sectors dan agent disamarkan backend | Backend |
| K26 | 429 tanpa info kapan boleh mencoba lagi | Backend + Frontend |
| K27 | Nama tipe signal di `agent-input-schema.md` berbeda dari backend; acuan: backend | Agent Lead (dokumen) |
| K28 | Refresh di tengah alur membuat alur harus diulang | Catat saja |
| K29 | Backend keluar diam-diam saat port bentrok | Backend |
| K30 | Pesan error salah arah (respons non-JSON, backend mati) | Frontend |
| K31 | CORS hanya mengizinkan port 5173 | Frontend (kunci port Vite) |
| K32 | Hasil scan mock terbawa ke mode backend | Frontend |

## Pertanyaan untuk Tim Lain

Backend Lead:
1. Apakah backend akan mengirim `priority` dan waktu per signal (K18, K19)?
2. Kapan endpoint challenge tersedia, dan apa bentuk responsnya (K17)?
3. Apa bentuk final evidence brief: array atau teks per bagian, huruf `evidenceStrength`, serta `researchPriority` dan `generatedAt` (K15)?
4. Apakah watchlist akan disimpan permanen (K23)?
5. Apakah `TIDES_API_KEY` akan diaktifkan saat demo, dan nilainya dibagikan bagaimana (K13)?
6. Bisakah error saat `listen` ditangani agar port bentrok terlihat (K29)?

Agent Lead:
7. Kapan `AGENT_BASE_URL` siap dan bentuk respons agent final (K15, K16)?
8. Mohon samakan `signal.type` di `docs/agent-input-schema.md` dengan backend: `PRICE_CHANGE`, `VOLUME_SPIKE`, `NEAR_90D_HIGH`, `NEAR_90D_LOW` (K27).

Tim:
9. Strategi data demo: ticker yang sedang bergerak, snapshot hasil scan asli, atau mode mock (K22)?

