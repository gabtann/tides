# TIDES Internal Data Schema

> Dokumen ini mendokumentasikan konvensi format data internal TIDES, contract field hasil normalisasi, dan kode error Sectors integration.
> Diperbarui: 2026-09-26.

---

## 1. Aturan Format Ticker Internal TIDES

| Aturan | Keterangan |
|---|---|
| **Tanpa suffix `.JK`** | TIDES menyimpan dan memproses ticker tanpa `.JK` (mis. `BBCA`, bukan `BBCA.JK`) |
| **Selalu uppercase** | Semua ticker dikonversi ke huruf kapital |
| **Sumber konversi** | Semua normalisasi WAJIB dilakukan via `utils/ticker.js` |
| **Dilarang inline strip** | File lain dilarang menulis `.replace('.JK', '')` secara langsung |

### Fungsi di `backend/src/utils/ticker.js`

| Fungsi | Tujuan | Contoh Input | Contoh Output |
|---|---|---|---|
| `normalizeTicker(ticker)` | Konversi ke format internal TIDES (penyimpanan & pemrosesan) | `"BBCA.JK"`, `"bbca"`, `null` | `"BBCA"`, `"BBCA"`, `null` |
| `toSectorsSymbol(ticker)` | Konversi ke format path URL Sectors API | `"BBCA.JK"`, `"bbca"` | `"BBCA"`, `"BBCA"` |

`toSectorsSymbol` sengaja dipisah dari `normalizeTicker` agar jika aturan path Sectors berubah di masa depan (misal perlu suffix `.JK` di URL), cukup ubah `toSectorsSymbol` tanpa mengubah konvensi penyimpanan internal.

---

## 2. Field Contract: `normalizeOverview`

Sumber: `backend/src/services/sectors-normalizer.service.js` → fungsi `normalizeOverview(raw)`.

Raw input berasal dari Sectors endpoint `GET /v2/company/report/{symbol}/?sections=overview`.

| Field Internal TIDES | Tipe | Field Sumber (Raw Sectors) | Catatan |
|---|---|---|---|
| `ticker` | `string \| null` | `raw.symbol` | Dikonversi via `normalizeTicker()` — selalu tanpa `.JK`, uppercase |
| `company_name` | `string \| null` | `raw.company_name` | Di root object, bukan di `raw.overview` |
| `price` | `number \| null` | `raw.overview.last_close_price` | Harga penutupan terakhir |
| `price_date` | `string \| null` | `raw.overview.latest_close_date` | Format `YYYY-MM-DD` |
| `daily_price_change` | `number \| null` | `raw.overview.daily_close_change` | Dalam bentuk desimal (mis. 0.02 = +2%) |
| `market_cap` | `number \| null` | `raw.overview.market_cap` | Dalam satuan Rupiah |
| `sector` | `string \| null` | `raw.overview.sector` | Mis. `"Energy"`, `"Financials"` |
| `sub_sector` | `string \| null` | `raw.overview.sub_sector` | Sub-sektor perusahaan |
| `industry` | `string \| null` | `raw.overview.industry` | Mis. `"Coal"`, `"Banks"` |
| `sub_industry` | `string \| null` | `raw.overview.sub_industry` | Sub-industri perusahaan |
| `ninety_day_high` | `number \| null` | `raw.overview.all_time_price['90_d_high']` | Object berkunci tanggal dinamis — diambil via `extractDatedValue()` |
| `ninety_day_low` | `number \| null` | `raw.overview.all_time_price['90_d_low']` | Object berkunci tanggal dinamis — diambil via `extractDatedValue()` |

> **Catatan struktural:** Mayoritas field overview ada di `raw.overview.*`, **bukan** di root. Pengecualian: `symbol` dan `company_name` ada di root object.

---

## 3. Field Contract: `normalizeDailyHistory`

Sumber: `backend/src/services/sectors-normalizer.service.js` → fungsi `normalizeDailyHistory(rawArray)`.

Raw input berasal dari Sectors endpoint `GET /v2/daily/{symbol}/`. Response adalah array.

| Field Internal TIDES | Tipe | Field Sumber (Raw Sectors) | Catatan |
|---|---|---|---|
| `ticker` | `string \| null` | `r.symbol` | Dikonversi via `normalizeTicker()` — selalu tanpa `.JK`, uppercase |
| `date` | `string \| null` | `r.date` | Format `YYYY-MM-DD` |
| `open` | `number \| null` | `r.open` | Harga pembukaan |
| `high` | `number \| null` | `r.high` | Harga tertinggi hari itu |
| `low` | `number \| null` | `r.low` | Harga terendah hari itu |
| `close` | `number \| null` | `r.close` | Harga penutupan |
| `volume` | `number \| null` | `r.volume` | Volume perdagangan |
| `market_cap` | `number \| null` | `r.market_cap` | Market cap pada tanggal tersebut |

> **Catatan:** Jika input bukan array, fungsi mengembalikan `[]` (array kosong) tanpa crash.

---

## 4. Field Contract: `normalizePeers`

Sumber: `backend/src/services/sectors-normalizer.service.js` → fungsi `normalizePeers(raw, queryTicker)`.

Raw input berasal dari Sectors endpoint `GET /v2/company/report/{symbol}/?sections=peers`.
Path ke data: `raw.peers[0].peers_data.companies[]`.

| Field Internal TIDES | Tipe | Field Sumber (Raw Sectors) | Catatan |
|---|---|---|---|
| `ticker` | `string \| null` | `p.symbol` | Dikonversi via `normalizeTicker()` — selalu tanpa `.JK`, uppercase |
| `market_cap` | `number \| null` | `p.market_cap` | Market capitalization peer |
| `pb` | `number \| null` | `p.pb_mrq` | Price-to-Book (Most Recent Quarter) |
| `pe` | `number \| null` | `p.pe_ttm` | Price-to-Earnings (Trailing Twelve Months) |
| `yearly_mcap_change` | `number \| null` | `p.yearly_mcap_chg` | Perubahan market cap tahunan |

> **Self-Peer Filter (otomatis):**
> Sectors API kadang menyertakan perusahaan itu sendiri sebagai salah satu entry dalam list peer-nya.
> `normalizePeers` secara otomatis memfilter entry yang `ticker`-nya sama dengan `normalizeTicker(queryTicker)`.
> Caller wajib meneruskan parameter `queryTicker` (ticker yang sedang di-query) agar filter ini berfungsi.

---

## 5. Kode Error Sectors Integration

Semua error dilempar dari `backend/src/integration/sectors.client.js` → fungsi internal `sectorsFetch()`.

| `err.code` | `err.status` | Kapan Terjadi |
|---|---|---|
| `SECTORS_TIMEOUT` | `504` | Request ke Sectors melebihi 8000ms (8 detik) — dibatalkan via `AbortController` |
| `NOT_FOUND` | `404` | Sectors mengembalikan HTTP 404 — symbol tidak ditemukan |
| `SECTORS_BAD_REQUEST` | `400` | Sectors mengembalikan HTTP 400 — request tidak valid (mis. parameter salah) |
| `SECTORS_AUTH_FAILED` | `502` | Sectors mengembalikan HTTP 401 — API key tidak valid atau kedaluwarsa |
| `SECTORS_RATE_LIMITED` | `429` | Sectors mengembalikan HTTP 429 — rate limit tercapai |
| `SECTORS_SERVER_ERROR` | `502` | Sectors mengembalikan HTTP 500+ — error di sisi Sectors |
| `SECTORS_UNREACHABLE` | `502` | Gagal connect total (DNS fail, connection refused, dll.) — bukan timeout |
| `SECTORS_UNKNOWN_ERROR` | `502` | Sectors mengembalikan status HTTP lain yang tidak terduga |

> **Format error di `errors[]` (dari `scan.service.js`):**
> ```json
> { "symbol": "BBCA", "message": "...", "code": "SECTORS_TIMEOUT" }
> ```

---

## 6. Catatan Implementasi

- **Watchlist** menyimpan ticker tanpa `.JK` (mis. `BBCA`). Format ini sudah sesuai dengan format internal TIDES.
- **`scan.service.js`** menormalisasi ticker dari watchlist via `normalizeTicker()` sebelum memanggil API maupun normalizer, untuk memastikan konsistensi meski ada edge case.
- **`sectors.client.js`** memanggil `toSectorsSymbol()` secara internal di tiap fungsi export — caller tidak perlu memikirkan format URL Sectors.
- Semua nilai field yang tidak tersedia atau `undefined` dinormalisasi ke `null` (bukan `undefined`).
