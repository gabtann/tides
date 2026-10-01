# AUDIT CP3: FRONTEND EVIDENCE BRIEF & INTEGRASI (30-09-2026)

**Branch:** `feature/frontend` (main @ `8895f41`)  
**Peninjau:** Member 4 — Frontend / Product  
**Fokus Tugas:** UI hasil investigation / Evidence Brief (`signal`, `observed`, `compared`, `interpreted`, `unknown`, `evidence strength`, `limitation`, `loading/error`) dengan struktur mengikuti Evidence Brief contract.

---

## 1. Ringkasan Eksekutif

1. **Implementasi UI Evidence Brief (EB-P1 s.d. EB-P6) Selesai 100%:** Layar Evidence Brief mandiri (`/evidence/:ticker`) telah dibangun lengkap dengan auto-start, indikator loading, error recovery dengan tombol *Retry*, 5 section bukti dalam bentuk daftar poin (`<ul>`), indikator *Evidence Strength* (UPPERCASE), badge *Research Priority*, catatan *Limitation*, dan teks disclaimer.
2. **Kesesuaian Kontrak Backend:** Tipe `EvidenceBrief` di frontend telah diselaraskan penuh dengan kontrak backend (`string[]` untuk section, nullable `signal` dan `limitation`, `generatedAt` ISO string).
3. **Regresi Backend Scan Teratasi (K41):** Mapping `httpTidesApi.ts` telah diperbarui untuk mendukung perubahan skema sinyal backend terbaru (`PRICE_MOVEMENT`, `VOLUME_MOVEMENT`, `HISTORICAL_DEVIATION`, `priority`, dan pembacaan `magnitude` dari objek `details`).
4. **Hasil Verifikasi Penuh (EB-P7):**
   - **Automated Check:** Typecheck ✅ (0 error), OxLint ✅ (0 warning, 0 error), Vitest ✅ (**18 file, 152 lulus**), Vite Build ✅ (sukses).
   - **Browser Verification:** Mode Mock (V1–V4) dan Mode Backend (V5–V7) teruji langsung dan cocok 100% dengan respons JSON backend.

---

## 2. Status Temuan Audit (K) — Khusus Frontend

Melanjutkan temuan dari audit sebelumnya (K1–K32):

| Kode | Temuan | Status per 30-09-2026 | Lokasi / Catatan |
|---|---|---|---|
| **K33** | Tipe frontend belum sesuai kontrak Evidence Brief | ✅ **TERSELESAIKAN** | [evidenceBrief.ts](file:///d:/A/hakaton/tides/frontend/src/types/evidenceBrief.ts): section diubah ke `string[]`, ditambah `signal`, `limitation`, `generatedAt`, `researchPriority`. |
| **K34** | Layar hanya menampilkan paragraf mentah tanpa poin | ✅ **TERSELESAIKAN** | [EvidenceBriefScreen.tsx](file:///d:/A/hakaton/tides/frontend/src/screens/EvidenceBrief/EvidenceBriefScreen.tsx): setiap section dirender sebagai list `<ul>` dengan bullet points rapi. |
| **K35** | Section kosong (`[]`) tampil tanpa kejelasan | ✅ **TERSELESAIKAN** | [EvidenceBriefScreen.tsx](file:///d:/A/hakaton/tides/frontend/src/screens/EvidenceBrief/EvidenceBriefScreen.tsx): menampilkan fallback eksplisit *"No evidence available for this section."* sesuai prinsip kontrak *"Missing evidence must remain explicit"*. |
| **K36** | Evidence Brief tidak memiliki state loading & error mandiri | ✅ **TERSELESAIKAN** | [useEvidenceBrief.ts](file:///d:/A/hakaton/tides/frontend/src/hooks/useEvidenceBrief.ts) & [appReducer.ts](file:///d:/A/hakaton/tides/frontend/src/context/appReducer.ts): hook dan reducer mandiri dengan status `idle`, `loading`, `success`, `error`, dan tombol *Retry*. |
| **K37** | Sumber brief bercampur dengan hasil challenge | ✅ **TERSELESAIKAN** | [tidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/tidesApi.ts): ditambahkan method mandiri `getEvidenceBrief(ticker)`. `brief` dilepas dari `ChallengeResult`. |
| **K38** | Mock data brief belum mengikuti struktur kontrak baru | ✅ **TERSELESAIKAN** | [mockTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/mockTidesApi.ts): fungsi `mockEvidenceBrief()` menyediakan mock data berstruktur kontrak penuh (termasuk kasus minim data pada UNVR). |
| **K39** | Endpoint agent backend belum menghasilkan Evidence Brief | ⚠️ **TERTANGANI (MOCK)** | [httpTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/httpTidesApi.ts): fallback transparan ke `notYetInBackend.getEvidenceBrief(ticker)` sehingga demo aman tanpa error 404/500. |
| **K40** | Format huruf `evidenceStrength` (Strong vs STRONG) | ✅ **TERSELESAIKAN** | [evidenceBrief.ts](file:///d:/A/hakaton/tides/frontend/src/types/evidenceBrief.ts): diselaraskan menjadi `'STRONG' \| 'MODERATE' \| 'WEAK'`. |
| **K41** | Perubahan bentuk respon scan di backend menyebabkan kartu rusak | ✅ **TERSELESAIKAN** | [httpTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/httpTidesApi.ts): pemetaan `describeSignal()` dan `priorityFor()` diperbarui membaca `details` dan `priority` dari backend. |

---

## 3. Hasil Pengujian & Verifikasi (EB-P7)

### A. Automated Checks
- **TypeScript:** `npx tsc --noEmit` ➔ **0 errors**
- **OxLint:** `npx oxlint` ➔ **0 warnings, 0 errors** (69 files checked)
- **Vitest:** `npx vitest --run` ➔ **18 test files passed (18/18), 152 tests passed (152/152)**
- **Vite Build:** `npm run build` ➔ **Sukses dalam 1.37s** (`dist/` 211.83 kB JS)

### B. Browser Flow Verification

| ID | Skenario Pengujian | Hasil Pengamatan Nyata | Status |
|---|---|---|---|
| **V1** | Buka `/evidence/BBRI` (Mock Mode) | Muncul teks *"Building the evidence brief for BBRI…"*, disusul tampilan 5 blok bukti (Signal, Observed, Compared, Interpreted, Unknown), indikator Strength (MODERATE), Priority (HIGH), Limitation, disclaimer, serta tombol navigasi. | ✅ **Lulus** |
| **V2** | Buka `/evidence/UNVR` (Minim Data) | Signal menampilkan *"No signal description was provided."*, section Observed/Compared/Interpreted menampilkan fallback eksplisit *"No evidence available for this section."*, Strength WEAK. | ✅ **Lulus** |
| **V3** | Refresh (F5) di `/evidence/BBRI` | Halaman melakukan reload mulus, menampilkan loading sejenak lalu memuat brief kembali. Tidak ada error *"isn't ready"*. | ✅ **Lulus** |
| **V4** | Alur Lengkap: Watchlist ➔ Scan ➔ Signal Detail ➔ Investigate ➔ Challenge ➔ Evidence Brief | Seluruh 6 layar terlewati tanpa hambatan, state berpindah mulus. | ✅ **Lulus** |
| **V5** | Scan Data Riil di Mode Backend (`VITE_USE_MOCK=false`) | Muncul sinyal riil tersusun rapi:<br>• **GOTO:** `Price fell 13.51% in one day · Volume at 34.28x average · Near 90-day low (0% of range)` (Priority: **HIGH**)<br>• **TLKM:** `Volume at 2.83x average · Near 90-day low (3.85% of range)` (Priority: **MEDIUM**)<br>• **UNVR:** `Near 90-day low (4.26% of range)` (Priority: **MEDIUM**) | ✅ **Lulus** |
| **V6** | Verifikasi DevTools Network vs UI | Respon JSON `POST /api/scan` (`symbols_scanned: 5`, `signals_detected: 6`) diverifikasi cocok 100% dengan nilai kartu di layar (pengelompokan multi-sinyal per ticker berhasil). | ✅ **Lulus** |
| **V7** | Buka `/evidence/BBRI` di Mode Backend | Brief tampil stabil via fallback hybrid; tab Network tidak melempar error 404/500 ke backend. | ✅ **Lulus** |

---

## 4. Evaluasi Apa yang Masih Kurang (Khusus Folder Frontend)

Berikut adalah daftar item penyempurnaan yang masih tersisa di dalam folder `frontend/` (untuk fase polish berikutnya / CP3 Actions):

### 1. K31 — Vite Port Locking
- **Kondisi:** Dev server Vite dapat berpindah ke port 5174 jika port 5173 terpakai. Backend Express mengonfigurasi CORS hanya untuk `http://localhost:5173`.
- **Rekomendasi Frontend:** Tambahkan konfigurasi `server: { port: 5173, strictPort: true }` pada [vite.config.ts](file:///d:/A/hakaton/tides/frontend/vite.config.ts).

### 2. K13 — Penanganan Header API Key
- **Kondisi:** `httpTidesApi.ts` saat ini belum menyertakan header `x-api-key`. Jika backend mengaktifkan `TIDES_API_KEY`, seluruh request frontend akan menerima 401 Unauthorized.
- **Rekomendasi Frontend:** Perbarui fungsi `request()` di [httpTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/httpTidesApi.ts) agar menyisipkan header `x-api-key` jika environment variable `VITE_API_KEY` terdefinisi.

### 3. K32 — Pemisahan Storage Cache Mock vs Backend
- **Kondisi:** Hasil scan disimpan pada key tunggal `tides.scan` di LocalStorage. Saat berganti dari mode mock ke mode backend, hasil scan lama masih terbawa hingga di-clear manual.
- **Rekomendasi Frontend:** Bedakan key penyimpanan menjadi `tides.scan.mock` dan `tides.scan.live` pada [persistence.ts](file:///d:/A/hakaton/tides/frontend/src/context/persistence.ts).

### 4. K24 — Granular Loading per Blok di Investigation Screen
- **Kondisi:** Layar `/investigate/:ticker` saat ini menggunakan satu loading state global untuk 4 blok konteks. PRD menyarankan loading independen per blok jika data konteks didapat secara asynchronous.

### 5. Defensive Parsing untuk Data AI Agent Asli
- **Kondisi:** `EvidenceBriefScreen.tsx` melakukan `.map()` pada array section. Jika agent backend di masa depan mengembalikan string tunggal akibat ketidaksempurnaan format LLM, layar berisiko crash.
- **Rekomendasi Frontend:** Bungkus section dengan proteksi defensif: `(Array.isArray(items) ? items : [items]).map(...)`.

---

## 5. Pertanyaan & Dependensi untuk Tim Backend / Agent

1. **Jadwal Live Endpoint Evidence Brief:** Kapan `POST /api/agent/investigate` akan mengembalikan objek `EvidenceBrief` final sehingga frontend dapat melepas `notYetInBackend`?
2. **Latensi AI Agent:** Estimasi waktu eksekusi LLM agent per ticker (apakah perlu animasi progress streaming / SSE atau cukup polling loading state)?
3. **Endpoint Challenge:** Kapan route `POST /api/challenge` tersedia di backend Express?
