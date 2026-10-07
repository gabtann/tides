Berikut adalah laporan audit implementasi frontend saat ini beserta rencana perubahan detail untuk **CP4.5 — Frontend Integration**. Sesuai instruksi Anda, **belum ada kode yang diubah**, laporan ini diajukan terlebih dahulu untuk di-review.

---

# Laporan Audit & Rencana Implementasi CP4.5

## 1. Audit Implementasi Frontend Saat Ini

### A. [frontend/src/types/evidenceBrief.ts](file:///d:/A/hakaton/tides/frontend/src/types/evidenceBrief.ts)
* **Kondisi Saat Ini:**
  Tipe `EvidenceBrief` hanya mendefinisikan 10 field CP3 (`ticker`, `signal`, `observed`, `compared`, `interpreted`, `unknown`, `evidenceStrength`, `researchPriority`, `generatedAt`, `limitation`).
* **Temuan Audit:**
  Belum ada definisi untuk 4 field baru dari CP4: `signalType`, `challenge`, `challengeStatus`, dan `confidence`.
* **Kebutuhan Perubahan:**
  Menambahkan tipe data baru (`ChallengeStatus`, `ChallengeData`) dan memasukkannya ke `EvidenceBrief` sebagai **field opsional (`?`)** agar backward-compatible 100% dengan CP3.

---

### B. [frontend/src/services/tidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/tidesApi.ts)
* **Kondisi Saat Ini:**
  Method sudah terdefinisi:
  ```typescript
  getEvidenceBrief(ticker: Ticker): Promise<EvidenceBrief>
  ```
* **Temuan Audit:**
  Tanda tangan method ini sudah mengembalikan `Promise<EvidenceBrief>`.
* **Kebutuhan Perubahan:**
  **TIDAK ADA PERUBAHAN SIGNATURE.** Karena interface mengembalikan `EvidenceBrief`, perubahan otomatis terakomodasi secara *additive* tanpa melanggar Target 5 (*"Jangan membuat endpoint baru"*) & Target 7 (*"Perubahan minimal/additive"*).

---

### C. [frontend/src/services/httpTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/httpTidesApi.ts)
* **Kondisi Saat Ini:**
  Baris 142 masih meminjam mock:
  ```typescript
  getEvidenceBrief: (ticker) => notYetInBackend.getEvidenceBrief(ticker),
  ```
* **Temuan Audit:**
  Backend sekarang sudah memiliki `POST /api/agent/investigate` yang mengembalikan objek payload hasil investigasi dan challenge.
* **Kebutuhan Perubahan:**
  1. Pada `httpTidesApi.ts`: Hubungkan `getEvidenceBrief(ticker)` ke endpoint riil:
     ```typescript
     async getEvidenceBrief(ticker) {
       return await request<EvidenceBrief>('/agent/investigate', {
         method: 'POST',
         body: JSON.stringify({ ticker }),
       })
     }
     ```
  2. Pada [mockTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/mockTidesApi.ts): Tambahkan mock data 4 field challenge baru agar pengujian unit test dan mode mock (`VITE_USE_MOCK=true`) juga mendukung simulasi CP4.5.

---

### D. [frontend/src/screens/EvidenceBrief/EvidenceBriefScreen.tsx](file:///d:/A/hakaton/tides/frontend/src/screens/EvidenceBrief/EvidenceBriefScreen.tsx)
* **Kondisi Saat Ini:**
  Komponen `BriefContent` hanya me-render:
  1. `Signal`
  2. 4 Section CP3 (`Observed`, `Compared`, `Interpreted`, `Unknown`)
  3. `Evidence strength` & `Research priority`
  4. `Limitation`
  5. Disclaimer & `GeneratedAt`
* **Temuan Audit:**
  Belum ada komponen visual untuk menampilkan temuan Challenge Signal (`challengeStatus`, `confidence`, serta kuadran `supporting`, `contradicting`, `alternativeExplanations`, `unknown`).
* **Kebutuhan Perubahan:**
  Tambahkan blok visual **Challenge Signal** di antara *Signal* dan *Observed*. Blok ini bersifat **kondisional**:
  - **Jika `brief.challenge` ADA:** Tampilkan status badge (`SUPPORTED`, `WEAKENED`, dll), confidence, dan 4 kuadran poin peluru.
  - **Jika `brief.challenge` TIDAK ADA:** Blok ini tidak dirender, dan UI menampilkan Evidence Brief CP3 secara normal (Target 4 terpenuhi).

---

## 2. Pemenuhan Target CP4.5

| Target | Kriteria | Cara Pemenuhan di Rencana Ini |
|---|---|---|
| **Target 1** | Type frontend menerima 4 field Challenge | `signalType?`, `challenge?`, `challengeStatus?`, `confidence?` ditambahkan ke `EvidenceBrief`. |
| **Target 2** | Response `/api/agent/investigate` membawa Challenge tanpa merusak CP3 | Semua field baru berstatus opsional (`?`), unwrap envelope `{ success: true, data }` tetap konsisten. |
| **Target 3** | UI menampilkan Challenge Signal secara jelas | Desain kartu challenge berstruktur 4 kuadran dengan badge status visual dan confidence. |
| **Target 4** | Jika Challenge fields absen, CP3 tampil normal | Pengecekan guard `if (brief.challenge) { ... }` pada render UI. |
| **Target 5** | Jangan membuat endpoint baru | Menggunakan `POST /api/agent/investigate` yang sudah ada di backend. |
| **Target 6** | Jangan mengubah logic Backend/Agent | Nol perubahan di luar folder `frontend/`. |
| **Target 7** | Perubahan minimal / additive | Hanya menyentuh 3 file frontend inti + 1 mock fallback. |

---

## 3. Rencana Perubahan Kode (File per File)

### File 1: [frontend/src/types/evidenceBrief.ts](file:///d:/A/hakaton/tides/frontend/src/types/evidenceBrief.ts)
Tambahkan deklarasi tipe *additive*:
```typescript
export type ChallengeStatus = 'SUPPORTED' | 'WEAKENED' | 'CONTRADICTED' | 'INCONCLUSIVE'

export interface ChallengeDetails {
  supporting: string[]
  contradicting: string[]
  alternativeExplanations: string[]
  unknown: string[]
}

export interface EvidenceBrief {
  ticker: Ticker | null
  signal: string | null
  observed: string[]
  compared: string[]
  interpreted: string[]
  unknown: string[]
  evidenceStrength: EvidenceStrength
  researchPriority: ResearchPriority
  generatedAt: string
  limitation: string | null

  // ➕ CP4.5 Additive Fields (Optional agar CP3 tidak pecah)
  signalType?: string
  challenge?: ChallengeDetails
  challengeStatus?: ChallengeStatus
  confidence?: string
}
```

---

### File 2: [frontend/src/services/httpTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/httpTidesApi.ts)
Ubah baris 142 dari delegasi mock ke endpoint live `/agent/investigate`:
```typescript
  async getEvidenceBrief(ticker) {
    return await request<EvidenceBrief>('/agent/investigate', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    })
  },
```

---

### File 3: [frontend/src/screens/EvidenceBrief/EvidenceBriefScreen.tsx](file:///d:/A/hakaton/tides/frontend/src/screens/EvidenceBrief/EvidenceBriefScreen.tsx)
Tambahkan sub-komponen `ChallengeSection` yang hanya dirender bila `brief.challenge` tersedia:
* **Badge Status:**
  - `SUPPORTED` ➔ Hijau / Brand
  - `WEAKENED` ➔ Kuning / Amber
  - `CONTRADICTED` ➔ Merah / Rose
  - `INCONCLUSIVE` ➔ Muted / Abu-abu
* **4 Kuadran (List Bullet Points):**
  1. *Supporting Evidence* (`challenge.supporting`)
  2. *Contradicting Evidence* (`challenge.contradicting`)
  3. *Alternative Explanations* (`challenge.alternativeExplanations`)
  4. *Challenge Unknowns* (`challenge.unknown`)
* **Fallback Elemen Kosong:** Mengikuti prinsip TIDES, jika salah satu array kosong (`[]`), tampilkan *"None identified"* alih-alih kartu kosong.

---

### File 4: [frontend/src/services/mockTidesApi.ts](file:///d:/A/hakaton/tides/frontend/src/services/mockTidesApi.ts)
Perbarui helper `mockEvidenceBrief()` untuk menyertakan contoh `challenge`, `challengeStatus: 'SUPPORTED'`, `confidence: 'MODERATE'`, dan `signalType: 'PRICE_MOVEMENT'` agar unit test dan mode mock tetap hijau.

---

Mohon review rencana di atas. Jika Anda dan Project Leader menyetujui, saya akan langsung mulai mengimplementasikannya secara rapi dan memastikan seluruh test (`tsc`, `oxlint`, `vitest`) tetap 100% hijau.