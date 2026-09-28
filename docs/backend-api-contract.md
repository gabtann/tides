# Backend API Contract — TIDES

> **Version:** CP2 (Checkpoint 2)
> **Last Updated:** 2026-09-28
> **Status:** SIAP dengan Catatan (Agent service belum aktif)
> **Base URL:** `http://localhost:4000/api`

---

## Daftar Isi

1. [Arsitektur dan Lapisan](#arsitektur-dan-lapisan)
2. [Autentikasi dan Rate Limit](#autentikasi-dan-rate-limit)
3. [Envelope Respons Standar](#envelope-respons-standar)
4. [Spesifikasi Endpoint](#spesifikasi-endpoint)
5. [Scan Output — Kontrak untuk Agent](#scan-output--kontrak-untuk-agent)
6. [Evidence Brief — Kontrak Respons Agent](#evidence-brief--kontrak-respons-agent)
7. [Error Contract](#error-contract)
8. [Catatan Implementasi dan Batasan Saat Ini](#catatan-implementasi-dan-batasan-saat-ini)

---

## Arsitektur dan Lapisan

```
Frontend  -->  Backend (Express)  -->  Sectors API   (external)
                                  -->  Agent Service (external, opsional)
```

| Lapisan | File Utama | Keterangan |
|---|---|---|
| Router | `src/routes/index.js` | Mount di `/api`, apply `requireApiKey` global |
| Controllers | `src/api/*.controller.js` | Input -> Service -> JSON response |
| Services | `src/services/*.service.js` | Business logic, tidak punya akses req/res |
| Integration | `src/integration/*.client.js` | HTTP client ke layanan eksternal |
| Middleware | `src/middleware/` | auth, rate-limit, validation, error-handler |

---

## Autentikasi dan Rate Limit

### Header Autentikasi

Backend menggunakan `requireApiKey` middleware yang dipasang **secara global** setelah `/health`.
Semua endpoint (kecuali `/health`) memerlukan autentikasi.

**Cara mengirim API key (salah satu):**

```
x-api-key: <your-key>
Authorization: Bearer <your-key>
```

**Jika `TIDES_API_KEY` di `.env` dikosongkan:** Server berjalan tanpa autentikasi
(dengan warning di console). Cocok untuk dev lokal.

**Error 401:**
```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Missing API Key" } }
```

### Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| `POST /scan` | 10 req | per menit per IP |
| Semua endpoint lainnya | 60 req | per menit per IP |

**Error 429:**
```json
{ "success": false, "error": { "code": "RATE_LIMITED", "message": "Too many requests" } }
```

---

## Envelope Respons Standar

**Sukses:**
```json
{
  "success": true,
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

> **Security Note:** Pesan error dari `SECTORS_*` code dan HTTP 5xx di-mask menjadi
> `"An error occurred while communicating with external services"` untuk mencegah
> information disclosure. Detail penuh hanya tercetak di server console.

---

## Spesifikasi Endpoint

### `GET /api/health`

Health check server. Tidak memerlukan autentikasi.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Tidak perlu |
| **Rate Limit** | Tidak ada |

**Response 200:**
```json
{ "success": true, "data": { "status": "ok" } }
```

---

### `GET /api/watchlist`

Mendapatkan seluruh simbol yang ada di watchlist.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | requireApiKey |
| **Rate Limit** | 60 req/menit |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "watchlist": [
      { "symbol": "BBCA", "added_at": "2026-09-26T18:23:56.727Z" }
    ]
  }
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `data.watchlist` | `WatchlistEntry[]` | Array bisa kosong jika belum ada entry |
| `WatchlistEntry.symbol` | `string` | Ticker uppercase tanpa `.JK` |
| `WatchlistEntry.added_at` | `string (ISO 8601)` | Waktu penambahan |

---

### `POST /api/watchlist`

Menambahkan satu simbol ke watchlist.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | requireApiKey |
| **Rate Limit** | 60 req/menit |
| **Middleware** | `requireFields(['symbol'])` |
| **Content-Type** | `application/json` |

**Request Body:**
```json
{ "symbol": "BBCA" }
```

| Field | Tipe | Validasi |
|---|---|---|
| `symbol` | `string` | Wajib. Format `[A-Za-z0-9]{1,10}` dengan opsional `.JK`/`.jk` suffix. Disimpan uppercase tanpa suffix. |

**Response 201:**
```json
{
  "success": true,
  "data": { "symbol": "BBCA", "added_at": "2026-09-26T18:23:56.727Z" }
}
```

**Error Codes:**

| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Field `symbol` tidak ada, bukan string, atau format tidak valid |
| `DUPLICATE_ENTRY` | 400 | Simbol sudah ada di watchlist |
| `LIMIT_REACHED` | 400 | Watchlist sudah mencapai 50 simbol |

---

### `DELETE /api/watchlist/:symbol`

Menghapus satu simbol dari watchlist.

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | requireApiKey |
| **Rate Limit** | 60 req/menit |

**Path Parameter:**

| Parameter | Keterangan |
|---|---|
| `:symbol` | Menerima format dengan atau tanpa suffix `.JK`/`.jk`. Contoh: `BBCA`, `BBCA.JK`, `bbca.jk` — semua valid dan menghapus `BBCA`. |

**Response 200:**
```json
{
  "success": true,
  "data": { "removed": "BBCA" }
}
```

> PENTING: Field yang dikembalikan adalah `removed` (bukan `deleted`).

**Error Codes:**

| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Format ticker tidak valid (gagal normalizeTicker) |
| `NOT_FOUND` | 404 | Simbol tidak ada di watchlist |

---

### `POST /api/scan`

Menjalankan scan engine untuk seluruh simbol di watchlist.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | requireApiKey |
| **Rate Limit** | **10 req/menit** |
| **Request Body** | Tidak diperlukan |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "scanned_at": "2026-09-26T18:23:57.209Z",
    "symbols_scanned": 2,
    "signals_detected": 3,
    "queue": [
      {
        "ticker": "BBCA",
        "type": "PRICE_CHANGE",
        "direction": "UP",
        "magnitude": "6.20%",
        "raw_value": 0.062,
        "currentContext": {
          "currentPrice": 8500,
          "dailyChange": 0.062,
          "latestDate": "2026-09-26",
          "sector": "Financials",
          "industry": "Banks"
        },
        "availableTools": ["getOverview", "getHistorical", "getPeers", "getValuation", "getFundamentals"]
      }
    ],
    "errors": [
      { "symbol": "BBRI", "message": "An error occurred while communicating with external services", "code": "SECTORS_TIMEOUT" }
    ]
  }
}
```

| Field | Keterangan |
|---|---|
| `scanned_at` | ISO timestamp waktu scan dimulai |
| `symbols_scanned` | Jumlah simbol di watchlist saat scan |
| `signals_detected` | Jumlah total signal terdeteksi |
| `queue` | Array AgentSignal — input siap untuk Agent (lihat bagian 5) |
| `errors` | Per-simbol errors; scan tetap dilanjutkan meski ada error parsial |

---

### `GET /api/signals`

Mengembalikan antrian signal dari hasil scan **terakhir** tanpa menjalankan scan baru.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | requireApiKey |
| **Rate Limit** | 60 req/menit |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "ticker": "BBCA",
        "type": "PRICE_CHANGE",
        "direction": "UP",
        "magnitude": "6.20%",
        "currentContext": { "currentPrice": 8500 },
        "availableTools": ["getOverview"]
      }
    ]
  }
}
```

> Mengembalikan `signals: []` jika server baru dijalankan dan POST /scan belum dipanggil.
> Data bersifat **in-memory** — restart server mengosongkan cache scan.

---

### `POST /api/agent/investigate`

Mengirimkan signal ke AI Agent untuk investigasi mendalam dan mengembalikan Evidence Brief.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | requireApiKey |
| **Rate Limit** | 60 req/menit |
| **Timeout Agent** | 15 detik |
| **Content-Type** | `application/json` |
| **Prasyarat** | `AGENT_BASE_URL` wajib diatur di `.env` |

**Request Body — Payload Minimal:**
```json
{ "ticker": "BBCA" }
```

**Request Body — Payload Lengkap (deterministik, direkomendasikan):**
```json
{
  "ticker": "BBCA",
  "signal": {
    "type": "PRICE_CHANGE",
    "direction": "UP",
    "magnitude": "6.20%",
    "allSignals": [
      { "type": "PRICE_CHANGE", "direction": "UP", "magnitude": "6.20%" }
    ]
  },
  "currentContext": {
    "currentPrice": 8500,
    "dailyChange": 0.062,
    "latestDate": "2026-09-26",
    "sector": "Financials",
    "industry": "Banks"
  },
  "availableTools": ["getOverview", "getHistorical", "getPeers", "getValuation", "getFundamentals"]
}
```

**Auto-Enrichment Logic:**
Jika payload hanya berisi `ticker`, controller mengisi `signal`, `currentContext`,
dan `availableTools` dari hasil scan terakhir (`getLastSignals()`).
Jika tidak ada scan sebelumnya, payload dikirim apa adanya ke Agent.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ticker": "BBCA",
    "signal": "Price moved 6.20% in one day",
    "observed": ["BBCA rose 6.20% on 2026-09-26"],
    "compared": ["Sector peers rose 1.1% on average"],
    "interpreted": ["Movement appears specific to BBCA"],
    "unknown": ["Cause of volume spike not confirmed"],
    "evidenceStrength": "MODERATE",
    "researchPriority": "MEDIUM",
    "generatedAt": "2026-09-26T18:23:57.209Z",
    "limitation": null
  }
}
```

**Error Codes:**

| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input tidak valid (body, ticker) |
| `AGENT_NOT_CONFIGURED` | 500 | `AGENT_BASE_URL` kosong di `.env` |
| `AGENT_TIMEOUT` | 504 | Request ke Agent melebihi 15 detik |
| `AGENT_REQUEST_FAILED` | 502 | Agent merespons HTTP error |

---

## Scan Output — Kontrak untuk Agent

Setiap elemen di `data.queue` dari `POST /scan` adalah **AgentSignal** siap kirim ke Agent.

### Skema AgentSignal

```typescript
interface AgentSignal {
  ticker: string;              // Uppercase, tanpa .JK
  type: 'PRICE_CHANGE' | 'VOLUME_SPIKE' | 'NEAR_90D_HIGH' | 'NEAR_90D_LOW';
  direction?: 'UP' | 'DOWN';  // Hanya untuk PRICE_CHANGE
  magnitude: string;           // "6.20%", "2.3x average", "97.1% of 90d range"
  raw_value: number;
  currentContext: {
    currentPrice: number;
    dailyChange: number;       // Desimal: 0.062 = 6.2%
    latestDate: string;        // YYYY-MM-DD
    sector: string | null;
    industry: string | null;
  };
  availableTools: string[];
}
```

### Matriks Kelengkapan Field (Task 2)

| Field Dibutuhkan Agent | Status | Nama di queue[] | Catatan |
|---|---|---|---|
| `ticker` | TERSEDIA | `ticker` | Uppercase tanpa .JK |
| `signal` (tipe sinyal) | TERSEDIA | `type` + `direction` + `magnitude` | Object terstruktur; auto-enrich mengemas ke `signal: { type, direction, magnitude, allSignals }` |
| `priority` | TIDAK DI SCAN OUTPUT | (tidak ada) | Tidak dihasilkan di scan stage. Dipetakan dari `evidenceStrength` di EvidenceBrief setelah Agent merespons. |
| `currentContext` | TERSEDIA | `currentContext` | Berisi `currentPrice`, `dailyChange`, `latestDate`, `sector`, `industry` |
| `availableTools` | TERSEDIA | `availableTools` | 5 tools hardcoded |

**Catatan `priority`:** Priority baru dapat ditentukan setelah investigasi Agent selesai, bukan sebelumnya.
`researchPriority` dikembalikan dalam EvidenceBrief dan dipetakan dari `evidenceStrength`.

---

## Evidence Brief — Kontrak Respons Agent

`buildEvidenceBrief()` di `evidence.service.js` menormalisasi output Agent menjadi EvidenceBrief.

### Skema EvidenceBrief

```typescript
interface EvidenceBrief {
  ticker: string | null;
  signal: string | null;            // Deskripsi narasi sinyal dari Agent
  observed: string[];               // Fakta langsung dari data
  compared: string[];               // Perbandingan historis/peer
  interpreted: string[];            // Interpretasi yang didukung bukti
  unknown: string[];                // Hal yang tidak dapat dikonfirmasi
  evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK';  // Selalu UPPERCASE
  researchPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  generatedAt: string;              // ISO 8601
  limitation: string | null;
}
```

### Normalisasi dan Fallback

| Field | Normalisasi | Fallback |
|---|---|---|
| `evidenceStrength` | `.toUpperCase()`, validasi ke enum | `'WEAK'` |
| `researchPriority` | `.toUpperCase()`, validasi ke enum | STRONG->HIGH, MODERATE->MEDIUM, WEAK->LOW |
| `generatedAt` | Pass-through | `new Date().toISOString()` |
| `observed/compared/interpreted/unknown` | String tunggal dibungkus `[string]`, undefined menjadi `[]` | `[]` |
| `limitation` | Pass-through | `null` |

---

## Error Contract

### Tabel Pemetaan Error (Task 4)

| Skenario | HTTP | error.code | Pesan ke Frontend | Ditangani Di |
|---|---|---|---|---|
| Sectors unavailable (API mati/unreachable) | 502 | `SECTORS_UNREACHABLE` | masked | `sectors.client.js` |
| Sectors rate-limited | 429 | `SECTORS_RATE_LIMITED` | masked | `sectors.client.js` |
| Sectors timeout (>8 detik) | 504 | `SECTORS_TIMEOUT` | masked | `sectors.client.js` + AbortController |
| Sectors auth failed | 502 | `SECTORS_AUTH_FAILED` | masked | `sectors.client.js` |
| Sectors server error 500 | 502 | `SECTORS_SERVER_ERROR` | masked | `sectors.client.js` |
| Agent unavailable (AGENT_BASE_URL kosong) | 500 | `AGENT_NOT_CONFIGURED` | masked | `agent.client.js` |
| Agent HTTP error (4xx/5xx dari Agent) | 502 | `AGENT_REQUEST_FAILED` | masked | `agent.client.js` |
| Agent timeout (>15 detik) | 504 | `AGENT_TIMEOUT` | masked | `agent.client.js` + AbortController |
| Input tidak valid (format, tipe) | 400 | `VALIDATION_ERROR` | Pesan spesifik (tidak di-mask) | service layer, agent.controller.js |
| Data tidak ditemukan | 404 | `NOT_FOUND` | `"Symbol 'X' not found"` | `watchlist.service.js` |
| Duplicate entry | 400 | `DUPLICATE_ENTRY` | `"Symbol 'X' already in watchlist"` | `watchlist.service.js` |
| Watchlist penuh | 400 | `LIMIT_REACHED` | `"Watchlist is full"` | `watchlist.store.js` |
| Rate limit Backend | 429 | `RATE_LIMITED` | `"Too many requests"` | `rate-limit.js` |
| Autentikasi gagal | 401 | `UNAUTHORIZED` | `"Missing/Invalid API Key"` | `auth.js` |

### Masking Policy

`error-handler.js` secara otomatis me-mask pesan untuk:
1. Error dengan `code` diawali `SECTORS_`
2. Error dengan `status >= 500` (termasuk semua error Agent)

Detail penuh dicetak ke `console.error` di server.

---

## Catatan Implementasi dan Batasan Saat Ini

### Siap

1. Semua 6 endpoint sudah terdaftar dan dapat diakses.
2. Auth dan rate-limit sudah terimplementasi di semua endpoint yang dilindungi.
3. Error masking mencegah information disclosure ke client.
4. `normalizeTicker` digunakan konsisten di `add` dan `remove` watchlist serta `investigate` controller.
5. EvidenceBrief contract terdefinisi lengkap dengan normalisasi dan fallback.
6. Auto-enrichment di controller memungkinkan Frontend memanggil `investigate` dengan payload minimal.

### Siap dengan Catatan

1. **`GET /signals` tidak ada Frontend consumer saat ini.** Endpoint berjalan dengan benar
   tapi Frontend belum mengimplementasi method-nya. Endpoint sudah terdokumentasi dan siap digunakan.
2. **Agent service belum aktif.** `POST /agent/investigate` akan selalu return `AGENT_NOT_CONFIGURED`
   sampai `AGENT_BASE_URL` diisi. Kontrak (request/response) sudah fully defined.
3. **Scan data bersifat in-memory.** Restart server mengosongkan cache `lastScanResult`.
4. **`detectPeerDivergence` dinonaktifkan** secara sengaja karena mismatch satuan waktu
   (daily vs yearly). Ada TODO di `signal-engine.service.js`.

### Direkomendasikan (Bukan Blocker)

1. Tambahkan `next_scan_available_at` di response `POST /scan` agar Frontend bisa
   menghitung kapan scan berikutnya dapat dilakukan.
2. Pertimbangkan HTTP 503 (bukan 500) untuk `AGENT_NOT_CONFIGURED` — semantik lebih tepat.
