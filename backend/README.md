# TIDES Backend

TIDES (Trend Indicator & Daily Equity Scanner) Backend adalah layanan berbasis Node.js/Express yang bertugas mengambil data pasar dari Sectors API, menyimpannya di Watchlist *in-memory*, menganalisis tren, dan memberikan sinyal teknikal (seperti Golden Cross) untuk frontend.

---

## 1. Deskripsi & Cara Menjalankan

### Persyaratan Sistem
- Node.js versi 18+ atau yang lebih baru.

### Cara Setup
1. Masuk ke direktori `backend` dan jalankan instalasi dependensi:
   ```bash
   cd backend
   npm install
   ```
2. Gandakan file `.env.example` menjadi `.env` lalu sesuaikan dengan kunci API Anda:
   ```bash
   cp .env.example .env
   ```
3. Menjalankan server dalam mode *development* (otomatis me-restart bila ada perubahan):
   ```bash
   npm run dev
   ```
   Server akan berjalan secara default di `http://localhost:4000`.
4. Menjalankan verifikasi dan unit testing keamanan secara mandiri:
   ```bash
   npm test
   ```

---

## 2. Arsitektur & Peta File Singkat

- `src/utils/ticker.js`: *Satu-satunya sumber kebenaran* untuk normalisasi ticker, memastikan penghapusan suffix `.JK` dan format *uppercase*.
- `src/integration/sectors.client.js`: *Wrapper HTTP client* ke Sectors API yang dilengkapi mitigasi DoS (timeout 8000ms), keamanan SSRF (validasi parameter), dan pemetaan kode error secara rapi.
- `src/services/sectors-normalizer.service.js`: Bertanggung jawab menormalkan format JSON mentah beraneka ragam dari Sectors menjadi format struktural internal yang bersih (lihat Skema Internal TIDES).
- `src/services/signal-engine.service.js`: Engine yang memproses algoritma sinyal teknikal per aset berdasarkan historical data dan peers (cth. *Golden Cross*, indikator sentimen).
- `src/services/scan.service.js`: Mengorkestrasi pemanggilan API ke Sectors untuk seluruh watchlist dengan *error boundary* yang terisolasi per iterasi, memastikan kesalahan satu aset tidak membatalkan pemindaian aset lainnya.

---

## 3. Kontrak Keamanan & Integrasi Client (PENTING UNTUK FRONTEND)

Backend ini dilindungi dengan fitur *Security Hardening* standar:
- **CORS Allowlist**: API hanya dapat diakses melalui host spesifik yang diatur dalam variabel `CORS_ORIGIN`. Nilai bawaan untuk pengujian frontend lokal adalah `http://localhost:3000` dan `http://localhost:5173`.
- **Autentikasi Header**: Jika variabel `TIDES_API_KEY` aktif pada `.env`, setiap request **wajib** mencantumkan header pengesahan berupa `x-api-key: <key>` atau `Authorization: Bearer <key>`. Jika kosong (401 Unauthorized), frontend akan ditolak. (Dalam lingkungan lokal / test di mana key ini kosong, *auth* akan *bypass* secara otomatis dengan satu log *warning* di server).
- **Proteksi DoS (Rate Limit)**: Terdapat batas maksimum *request* pada API:
  - `POST /api/scan`: Maksimal 10 req / menit per IP (Error `429 Too Many Requests`).
  - `POST /api/watchlist`: Maksimal 60 req / menit per IP (Error `429 Too Many Requests`).
- **Batas Watchlist**: Ukuran memori watchlist sangat diawasi dan dibatasi maksimal hingga **50 simbol aset**. Upaya melampauinya menghasilkan error `400 Bad Request`.

---

## 4. Spesifikasi Endpoint API Lengkap

Semua request yang memiliki _body_ harus mengirim data dalam format `application/json` murni. Array dan tipe tak valid akan di-*reject*.

### `GET /api/health`
Mengecek status nyala server.
- **Request**: `GET /api/health`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { "status": "ok" }
  }
  ```

### `GET /api/watchlist`
Mendapatkan daftar simbol yang dipantau sistem saat ini.
- **Request**: `GET /api/watchlist`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      { "symbol": "BBCA", "added_at": "2026-09-26T18:23:56.727Z" }
    ]
  }
  ```

### `POST /api/watchlist`
Menambahkan simbol ke dalam watchlist.
- **Request**: `POST /api/watchlist`
  ```json
  {
    "symbol": "BBCA"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": { "symbol": "BBCA", "added_at": "2026-09-26T18:23:56.727Z" }
  }
  ```

### `DELETE /api/watchlist/:symbol`
Menghapus simbol dari watchlist.
- **Request**: `DELETE /api/watchlist/BBCA`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { "deleted": "BBCA" }
  }
  ```

### `POST /api/scan`
Menjalankan *engine scan* pada seluruh simbol di watchlist dan mengembalikan hasil sinyalnya secara masif.
- **Request**: `POST /api/scan`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "scanned_at": "2026-09-26T18:23:57.209Z",
      "symbols_scanned": 1,
      "signals_detected": 0,
      "queue": [],
      "errors": []
    }
  }
  ```

---

## 5. Tabel Kode Error & Validasi

Berikut adalah kode error spesifik yang mungkin dimunculkan dalam respons objek JSON `{ "success": false, "error": { "code": "...", "message": "..." } }`:

| Kode Error `code` | Status HTTP | Deskripsi / Penyebab |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Field wajib tidak ada, berupa *array*, spasi kosong, atau gagal verifikasi path SSRF. |
| `LIMIT_REACHED` | 400 | Ukuran Watchlist melampaui batas maksimal (50). |
| `RATE_LIMITED` | 429 | Jumlah pemanggilan per menit dilampaui (bawaan Node.js *Map limiter*). |
| `DUPLICATE_ENTRY` | 400 | Ticker yang akan ditambahkan sudah ada pada *watchlist*. |
| `NOT_FOUND` | 404 | Saat simbol yang akan dihapus tidak ada, ATAU Sectors HTTP 404. |
| `SECTORS_BAD_REQUEST`| 400 | Sectors API HTTP 400 (salah format simbol). |
| `SECTORS_TIMEOUT` | 504 | *AbortController* terpicu karena request Sectors melebihi 8000ms. |
| `SECTORS_AUTH_FAILED` | 502 | Sectors API key tidak valid / kedaluwarsa. |
| `SECTORS_RATE_LIMITED`| 429 | Rate limit Sectors API tercapai. |
| `SECTORS_SERVER_ERROR`| 502 | Sectors API HTTP 500 (Gagal Server). |
| `SECTORS_UNREACHABLE` | 502 | Gagal _DNS lookup_ atau koneksi jaringan ke Sectors. |
| `SECTORS_UNKNOWN_ERROR`| 502 | Respons tidak dapat dipahami. |

*(**Catatan Keamanan:** Detail pesan error mentah dari `SECTORS_...` atau status HTTP di atas `500` telah di-masking untuk mencegah Information Disclosure. Klien hanya akan membaca: "An error occurred while communicating with external services", namun detail lengkap tetap tercetak di console backend.)*

---

## 6. Tautan ke Dokumen Terkait
- [Spesifikasi Skema Internal Data TIDES (Sectors Mapping)](../docs/tides-internal-schema.md)
- [Laporan Audit Backend TIDES (QA & Security)](../docs/backend-audit-report.md)
