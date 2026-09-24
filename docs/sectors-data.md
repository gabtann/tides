# Sectors Data Documentation

## 1. Overview

Dokumen ini mendokumentasikan hasil **Technical Spike Sectors** untuk mengetahui data yang tersedia dari Sectors dan menentukan data yang dapat digunakan sebagai sumber input untuk TIDES.

Technical spike ini berfokus pada pertanyaan:

> **"Sebenarnya Sectors menyediakan data apa yang bisa dipakai TIDES?"**

Eksplorasi dilakukan terhadap beberapa saham Indonesia menggunakan **Sectors REST API v2** untuk memahami:

- data yang tersedia;
- endpoint yang dapat digunakan;
- parameter input;
- struktur response;
- field yang tersedia;
- HTTP status;
- error behavior;
- default behavior;
- keterbatasan API;
- dataset yang relevan untuk TIDES;
- potensi penggunaan data untuk signal engine.

Hasil dari technical spike ini akan menjadi dasar untuk tahap berikutnya:

```text
Sectors REST API
        ↓
Raw Sectors Data
        ↓
Data Mapping
        ↓
Normalizer
        ↓
TIDES Internal Data
        ↓
Historical Baseline
        ↓
Change Detection
        ↓
Signal Engine
```

---

# 2. Scope

Technical spike mencakup pengujian terhadap tiga saham:

| Ticker | Company | Sector | Industry |
|---|---|---|---|
| `BYAN.JK` | Bayan Resources Tbk | Energy | Coal |
| `CUAN.JK` | PT Petrindo Jaya Kreasi Tbk | Energy | Coal |
| `BBCA.JK` | PT Bank Central Asia Tbk. | Financials | Banks |

Data yang dieksplorasi meliputi:

1. Company Overview
2. Latest Price
3. Historical Price
4. Trading Volume
5. Market Capitalization
6. Valuation Metrics
7. Sector dan Industry
8. Peer Comparison
9. Quarterly Financials
10. Additional company metrics
11. Error behavior
12. Parameter/default behavior
13. Dataset inventory

---

# 3. Sectors API

Sectors menyediakan beberapa endpoint yang dapat digunakan untuk mengambil data pasar, perusahaan, valuation, peer comparison, dan financial data.

Endpoint yang berhasil diuji dalam technical spike:

| Data | Endpoint | Status |
|---|---|---|
| Company Overview | `/v2/company/report/{symbol}/?sections=overview` | Tested |
| Daily Historical Data | `/v2/daily/{symbol}/` | Tested |
| Valuation | `/v2/company/report/{symbol}/?sections=valuation` | Tested |
| Peers | `/v2/company/report/{symbol}/?sections=peers` | Tested |
| Quarterly Financials | `/v2/financials/quarterly/{symbol}/` | Tested |

---

# 4. Company Overview

## 4.1 Endpoint

```text
GET /v2/company/report/{symbol}/?sections=overview
```

Contoh:

```text
GET /v2/company/report/BBCA/?sections=overview
```

---

## 4.2 Input

| Parameter | Required | Description |
|---|---|---|
| `symbol` | Yes | Stock symbol tanpa `.JK` pada path API |
| `sections` | Yes | Section yang ingin diambil, dalam pengujian menggunakan `overview` |

Contoh:

```text
symbol=BYAN
sections=overview
```

---

## 4.3 Data yang Tersedia

Company Overview menyediakan informasi perusahaan dan kondisi pasar terkini.

Field yang ditemukan:

| Field | Description |
|---|---|
| `symbol` | Stock symbol |
| `company_name` | Nama perusahaan |
| `listing_board` | Board tempat perusahaan tercatat |
| `industry` | Industry perusahaan |
| `sub_industry` | Sub-industry perusahaan |
| `sector` | Sector perusahaan |
| `sub_sector` | Sub-sector perusahaan |
| `market_cap` | Market capitalization |
| `market_cap_rank` | Ranking berdasarkan market capitalization |
| `address` | Alamat perusahaan |
| `employee_num` | Jumlah karyawan |
| `employee_num_rank` | Ranking jumlah karyawan |
| `listing_date` | Tanggal listing |
| `website` | Website perusahaan |
| `phone` | Nomor telepon |
| `email` | Email perusahaan |
| `last_close_price` | Harga penutupan terakhir |
| `latest_close_date` | Tanggal harga penutupan terakhir |
| `daily_close_change` | Perubahan harga penutupan harian dalam bentuk desimal |
| `all_time_price` | Informasi range harga |
| `esg_score` | ESG score |
| `tags` | Tags/kondisi tertentu yang diberikan Sectors |
| `indices` | Index yang diikuti saham |
| `affiliates` | Informasi affiliate |

---

## 4.4 Contoh Data Aktual

### BYAN

Hasil overview menunjukkan antara lain:

```text
symbol              = BYAN.JK
sector              = Energy
industry            = Coal
sub_industry        = Coal Production
market_cap_rank     = 5
esg_score           = 52.73
latest_close_date   = 2026-09-22
last_close_price    = 11850
```

### CUAN

Hasil overview terbaru:

```text
symbol              = CUAN.JK
company_name        = PT Petrindo Jaya Kreasi Tbk
sector              = Energy
industry            = Coal
sub_industry        = Coal Production
market_cap_rank     = 20
latest_close_date   = 2026-09-23
last_close_price    = 960
esg_score           = 54.64
```

### BBCA

Hasil overview terbaru:

```text
symbol              = BBCA.JK
company_name        = PT Bank Central Asia Tbk.
sector              = Financials
industry            = Banks
sub_industry        = Banks
market_cap_rank     = 1
latest_close_date   = 2026-09-23
last_close_price    = 6300
esg_score           = 21.71
```

---

## 4.5 TIDES Usage

Company Overview dapat digunakan sebagai sumber:

- company identity;
- company classification;
- latest price;
- market capitalization;
- market-cap ranking;
- sector;
- industry;
- company context.

Data yang paling relevan untuk tahap awal TIDES:

```text
symbol
company_name
last_close_price
latest_close_date
daily_close_change
market_cap
sector
sub_sector
industry
sub_industry
```

---

# 5. Daily Historical Data

## 5.1 Endpoint

```text
GET /v2/daily/{symbol}/
```

Contoh:

```text
GET /v2/daily/CUAN/?start=2026-06-24&end=2026-09-22
```

---

## 5.2 Input

| Parameter | Required | Description |
|---|---|---|
| `symbol` | Yes | Stock symbol |
| `start` | Optional | Start date dengan format `YYYY-MM-DD` |
| `end` | Optional | End date dengan format `YYYY-MM-DD` |

Contoh:

```text
symbol=CUAN
start=2026-06-24
end=2026-09-22
```

---

## 5.3 Response Fields

Setiap daily record yang diuji memiliki field:

| Field | Description |
|---|---|
| `symbol` | Stock symbol |
| `date` | Trading date |
| `close` | Closing price |
| `open` | Opening price |
| `high` | Highest price |
| `low` | Lowest price |
| `volume` | Trading volume |
| `market_cap` | Market capitalization pada tanggal tersebut |

---

## 5.4 Contoh Response

Contoh hasil pengujian CUAN:

```json
[
  {
    "symbol": "CUAN.JK",
    "date": "2025-01-02",
    "close": 1180,
    "open": 1118,
    "high": 1220,
    "low": 1118,
    "volume": 230169000,
    "market_cap": 132654302000000
  },
  {
    "symbol": "CUAN.JK",
    "date": "2025-01-03",
    "close": 1200,
    "open": 1205,
    "high": 1215,
    "low": 1162,
    "volume": 117490000,
    "market_cap": 134902680000000
  }
]
```

---

## 5.5 Hasil Pengujian Date Range

Beberapa rentang waktu diuji untuk mengetahui behavior endpoint.

### 1 Day

```text
start = 2026-09-22
end   = 2026-09-22
```

Hasil:

```text
HTTP 200
1 record
```

---

### 7 Days

```text
start = 2026-09-15
end   = 2026-09-22
```

Hasil:

```text
HTTP 200
6 trading-day records
```

---

### 30 Days

```text
start = 2026-08-23
end   = 2026-09-22
```

Hasil:

```text
HTTP 200
21 trading-day records
```

---

### Approximately 90 Days

```text
start = 2026-06-24
end   = 2026-09-22
```

Hasil:

```text
HTTP 200
63 trading-day records
```

Data yang dikembalikan:

```text
2026-06-24 sampai 2026-09-22
```

---

### Request Lebih dari 90 Hari

Request:

```text
start = 2026-01-01
end   = 2026-09-22
```

Hasil:

```text
HTTP 200
63 records
```

Namun response hanya mencakup:

```text
2026-06-24 sampai 2026-09-22
```

Artinya API tidak mengembalikan seluruh periode yang diminta.

**Kesimpulan:**

Terdapat pembatasan pada jumlah/periode data yang dikembalikan, tetapi exact maximum date range belum dapat ditentukan secara pasti dari pengujian ini.

---

## 5.6 TIDES Usage

Daily historical data merupakan salah satu sumber data utama untuk TIDES.

Potential usage:

```text
Historical Price
       ↓
Historical Baseline
       ↓
Current Price
       ↓
Change Detection
       ↓
Potential Signal
```

Field utama:

- `date`
- `close`
- `open`
- `high`
- `low`
- `volume`
- `market_cap`

---

# 6. Valuation Data

## 6.1 Endpoint

```text
GET /v2/company/report/{symbol}/?sections=valuation
```

Contoh:

```text
GET /v2/company/report/CUAN/?sections=valuation
```

---

## 6.2 Input

```text
symbol=CUAN
sections=valuation
```

---

## 6.3 Data yang Tersedia

Field yang ditemukan:

| Field | Description |
|---|---|
| `last_close_price` | Latest closing price |
| `latest_close_date` | Date of latest close |
| `daily_close_change` | Daily price change |
| `forward_pe` | Forward P/E |
| `intrinsic_value` | Intrinsic value |
| `historical_valuation` | Historical valuation by period |
| `pb` | Price-to-Book |
| `pe` | Price-to-Earnings |
| `ps` | Price-to-Sales |
| `pcf` | Price-to-Cash-Flow |
| `peg` | PEG ratio |
| `enterprise_to_ebitda` | EV/EBITDA |
| `enterprise_to_revenue` | EV/Revenue |
| `pb_peer_avg` | Peer average P/B |
| `pe_peer_avg` | Peer average P/E |
| `ps_peer_avg` | Peer average P/S |

---

## 6.4 Historical Valuation

Historical valuation tersedia untuk beberapa periode.

Hasil pengujian:

| Stock | Available Period |
|---|---|
| BYAN | 2022–2026 |
| CUAN | 2023–2026 |
| BBCA | 2022–2026 |

Karena periode dapat berbeda antar perusahaan, normalizer tidak boleh mengasumsikan bahwa semua ticker memiliki periode historical valuation yang sama.

---

## 6.5 Additional Valuation Data

### BYAN

```text
intrinsic_value = 10292
forward_pe      = null
```

### CUAN

```text
intrinsic_value = -1544
forward_pe      = null
```

### BBCA

```text
intrinsic_value = 13694
forward_pe      = 13.0575357663439
```

`forward_pe` dapat memiliki nilai `null`, sehingga normalizer dan signal engine harus menangani missing value.

---

## 6.6 TIDES Usage

Valuation data dapat digunakan untuk:

- historical valuation comparison;
- relative valuation;
- comparison terhadap peer average;
- potential valuation signal.

Contoh:

```text
Company P/E
     +
Peer Average P/E
     +
Historical P/E
     ↓
Relative Valuation Analysis
```

---

# 7. Peer Comparison

## 7.1 Endpoint

```text
GET /v2/company/report/{symbol}/?sections=peers
```

Contoh:

```text
GET /v2/company/report/BYAN/?sections=peers
```

---

## 7.2 Peer Data

Data peer yang ditemukan meliputi:

| Field | Description |
|---|---|
| `symbol` | Peer stock symbol |
| `company_name` | Peer company |
| `group` | Peer group |
| `sector` | Sector |
| `sub_sector` | Sub-sector |
| `industry` | Industry |
| `sub_industry` | Sub-industry |
| `market_cap` | Market capitalization |
| `pb_mrq` | P/B |
| `pe_ttm` | P/E |
| `net_income` | Net income |
| `total_assets` | Total assets |
| `total_equity` | Total equity |
| `pretax_income` | Pre-tax income |
| `total_revenue` | Total revenue |
| `employee_num` | Number of employees |
| `operating_expense` | Operating expense |
| `yearly_mcap_chg` | Yearly market-cap change |
| `point_summaries` | Additional comparison information |

---

## 7.3 Peer Example

Untuk BYAN, peer data yang ditemukan mencakup:

```text
DSSA.JK
CUAN.JK
AADI.JK
ADRO.JK
BUMI.JK
ADMR.JK
GEMS.JK
PTBA.JK
ITMG.JK
```

Untuk BBCA, peer data mencakup beberapa perusahaan perbankan seperti:

```text
BBRI
BMRI
BBNI
BNLI
BRIS
MEGA
BNGA
BDMN
NISP
```

Peer list berasal dari response Sectors dan tidak boleh di-hardcode ke dalam aplikasi.

---

## 7.4 TIDES Usage

Peer data dapat digunakan untuk:

- peer comparison;
- relative valuation;
- sector/industry comparison;
- peer divergence;
- comparative signal.

Contoh:

```text
Company Metrics
      +
Peer Metrics
      ↓
Relative Comparison
      ↓
Potential Divergence
```

---

# 8. Quarterly Financials

## 8.1 Endpoint

```text
GET /v2/financials/quarterly/{symbol}/
```

Contoh:

```text
GET /v2/financials/quarterly/CUAN/?report_date=2024-09-30
```

---

## 8.2 Input

| Parameter | Required | Description |
|---|---|---|
| `symbol` | Yes | Stock symbol |
| `report_date` | Optional | Reporting date dengan format `YYYY-MM-DD` |

Contoh:

```text
symbol=CUAN
report_date=2024-09-30
```

---

## 8.3 Data yang Ditemukan

Quarterly financial response menyediakan berbagai financial metrics.

Field yang ditemukan mencakup:

- `revenue`
- `operating_pnl`
- `earnings_before_tax`
- `earnings`
- `gross_profit`
- `ebit`
- `ebitda`
- `total_assets`
- `total_liabilities`
- `total_equity`
- `total_debt`
- `operating_cash_flow`
- `capital_expenditure`
- `free_cash_flow`

Untuk perusahaan perbankan seperti BBCA juga ditemukan metrics seperti:

- `interest_income`
- `interest_expense`
- `net_interest_income`
- `gross_loan`
- `net_loan`
- `total_deposit`

---

## 8.4 Example CUAN

Pengujian:

```text
symbol      = CUAN
report_date = 2024-09-30
```

Hasil:

```text
HTTP 200
1 record
```

Beberapa metrics:

```text
revenue              = 3579526704000
operating_pnl        = 417383784000
earnings_before_tax  = 102009984000
earnings              = 13144992000
gross_profit         = 654478248000
ebit                 = 312829608000
ebitda               = 349272432000
total_assets         = 19653307728000
total_liabilities    = 14722618200000
total_equity         = 4930689528000
total_debt           = 9844251192000
operating_cash_flow  = -471614448000
capital_expenditure  = 221541576000
free_cash_flow       = -693156024000
```

---

## 8.5 Missing `report_date`

Request tanpa `report_date` juga berhasil.

```text
GET /v2/financials/quarterly/CUAN/
```

Hasil pengujian:

```text
HTTP 200
```

dan API mengembalikan quarter terbaru yang tersedia.

Pada pengujian CUAN, data terbaru yang dikembalikan memiliki:

```text
date = 2026-06-30
```

---

## 8.6 TIDES Usage

Quarterly financial data dapat digunakan untuk:

- revenue change;
- earnings change;
- EBITDA change;
- cash-flow analysis;
- free-cash-flow analysis;
- fundamental change detection.

Potential flow:

```text
Previous Quarter
       +
Current Quarter
       ↓
Financial Change
       ↓
Fundamental Analysis
       ↓
Potential Signal
```

---

# 9. Additional Data

Selain data utama, beberapa field tambahan ditemukan selama eksplorasi.

## 9.1 Market Cap Rank

Field:

```text
market_cap_rank
```

Contoh:

| Stock | Rank |
|---|---:|
| BYAN | 5 |
| CUAN | 20 |
| BBCA | 1 |

Field ini dapat digunakan sebagai market-cap context.

---

## 9.2 Employee Rank

Field:

```text
employee_num_rank
```

Contoh CUAN:

```text
employee_num_rank = 155
```

Field tersedia tetapi belum ditetapkan sebagai core TIDES signal.

---

## 9.3 90-Day High / Low

Field:

```text
all_time_price.90_d_high
all_time_price.90_d_low
```

Contoh:

### BYAN

```text
90-day high = 18650
90-day low  = 10075
```

### CUAN

```text
90-day high = 1040
90-day low  = 525
```

### BBCA

```text
90-day high = 6850
90-day low  = 5550
```

Data ini dapat digunakan untuk melihat posisi harga terhadap 90-day range.

---

## 9.4 ESG Score

Field:

```text
esg_score
```

Hasil pengujian:

| Stock | ESG Score |
|---|---:|
| BYAN | 52.73 |
| CUAN | 54.64 |
| BBCA | 21.71 |

Data tersedia tetapi belum ditetapkan sebagai core signal.

---

## 9.5 Tags

Field:

```text
tags
```

Contoh BYAN:

```text
90-d-low
insider-1-month-sell
last-volume-above-10d-volume-average
public-float-under-25
top-30-yoy-earning-growth
```

Contoh CUAN:

```text
public-float-under-25
single-entity-holding-70
top-90d-transaction-value
top-90d-transaction-volume
```

Tags dapat digunakan sebagai additional context jika dibutuhkan pada tahap signal engine.

---

## 9.6 Intrinsic Value

Field:

```text
intrinsic_value
```

Hasil pengujian:

| Stock | Intrinsic Value |
|---|---:|
| BYAN | 10292 |
| CUAN | -1544 |
| BBCA | 13694 |

Field dapat digunakan sebagai salah satu input valuation analysis.

---

# 10. Error Behavior

## 10.1 Invalid Company Ticker

Request:

```text
GET /v2/company/report/XXXX/?sections=overview
```

Response:

```text
HTTP 404
```

```json
{
  "error": "Given stock symbol does not exist."
}
```

---

## 10.2 Invalid Daily Ticker

Invalid ticker pada Daily API juga menghasilkan:

```text
HTTP 404
```

dengan pesan bahwa stock symbol tidak ditemukan.

---

## 10.3 Invalid Date

Request:

```text
start=2026-99-99
```

Response:

```text
HTTP 400
```

```json
{
  "error": "Use a valid date format of YYYY-MM-DD."
}
```

---

## 10.4 Non-Date Input

Request:

```text
start=abc
end=xyz
```

Response:

```text
HTTP 400
```

dengan pesan:

```text
Use a valid date format of YYYY-MM-DD.
```

---

## 10.5 Start Date After End Date

Request:

```text
start=2026-09-22
end=2026-09-01
```

Response:

```text
HTTP 400
```

```json
{
  "error": "Start date cannot be after end date."
}
```

---

## 10.6 Invalid API Key

Request dengan API key yang tidak valid menghasilkan:

```text
HTTP 401
```

Response:

```json
{
  "error": "TOKEN_NOT_VALID",
  "message": "Given token not valid for any token type"
}
```

---

## 10.7 Invalid Sections

Request:

```text
sections=abc
```

Response:

```text
HTTP 400
```

```text
Invalid sections provided: abc.
```

---

## 10.8 Empty Sections

Request:

```text
sections=
```

Response:

```text
HTTP 400
```

```text
Invalid sections provided: .
```

---

## 10.9 Quarterly Invalid Date

Request:

```text
report_date=2024-99-99
```

Response:

```text
HTTP 400
```

```text
Use a valid report_date format of YYYY-MM-DD.
```

---

## 10.10 Quarterly Non-Date

Request:

```text
report_date=abc
```

Response:

```text
HTTP 400
```

dengan pesan validasi tanggal.

---

## 10.11 Quarterly Invalid Ticker

Request menggunakan ticker yang tidak valid pada quarterly endpoint menghasilkan:

```text
HTTP 404
```

dengan error:

```text
Invalid stock symbol and/or data for the specified report_date does not exist.
```

---

# 11. Optional Parameters and Default Behavior

Beberapa parameter pada API bersifat optional.

## Daily API

### Missing Start

Request:

```text
GET /v2/daily/CUAN/?end=2026-09-22
```

Hasil:

```text
HTTP 200
21 records
2026-08-24 sampai 2026-09-22
```

---

### Missing End

Request:

```text
GET /v2/daily/CUAN/?start=2026-09-01
```

Hasil:

```text
HTTP 200
17 records
2026-09-01 sampai 2026-09-23
```

---

### No Date Parameters

Request:

```text
GET /v2/daily/CUAN/
```

Hasil:

```text
HTTP 200
21 records
2026-08-26 sampai 2026-09-23
```

Default window ini teramati pada saat pengujian, tetapi aturan lengkap mengenai default window belum ditentukan.

---

## Quarterly API

Tanpa `report_date`:

```text
GET /v2/financials/quarterly/CUAN/
```

Hasil:

```text
HTTP 200
```

dan API mengembalikan quarter terbaru yang tersedia.

---

# 12. Rate Limit Behavior

Repeated valid requests dilakukan untuk menguji kemungkinan rate limit.

Hasil pengujian:

```text
HTTP 200
```

Tidak ada response:

```text
HTTP 429 Too Many Requests
```

yang berhasil dipicu selama pengujian.

Namun:

> Numeric rate limit belum diketahui.

Oleh karena itu, implementation TIDES tidak boleh mengasumsikan batas request tertentu sebelum ada dokumentasi atau pengujian lebih lanjut.

---

# 13. Dataset Inventory

Selain endpoint API yang diuji secara langsung, Sectors menyediakan beberapa dataset/section lain.

| Dataset | Status | Keterangan |
|---|---|---|
| Company Overview | Core | Company profile, classification, latest price, market cap |
| Daily Historical Data | Core | Historical price, volume, market cap |
| Valuation Metrics | Core | P/B, P/E, P/S, P/CF, PEG, EV multiples |
| Peers & Comparison | Core | Peer companies dan financial comparison |
| Quarterly Financials | Core | Quarterly fundamental metrics |
| Future Forecast | Optional | Tersedia sebagai dataset, tetapi perlu validasi lebih lanjut |
| Dividend History | Optional | Dividend-related information |
| Institutional Transactions | Optional | Institutional transaction information |
| Major Shareholders | Optional | Ownership information |
| Shareholder Composition | Optional | Shareholder composition |
| Executives Shareholdings | Optional | Executive ownership information |
| Key Executives | Not Priority | Management information |
| Full Dataset JSON | Not Tested | Akses/export Full Dataset JSON tidak tersedia pada pengujian |

---

# 14. Core Data for TIDES

Berdasarkan technical spike, data yang diprioritaskan untuk tahap awal TIDES adalah:

## 14.1 Market Data

```text
last_close_price
latest_close_date
close
open
high
low
volume
market_cap
daily_close_change
```

Digunakan untuk:

- price movement;
- historical baseline;
- volume movement;
- market context.

---

## 14.2 Company Classification

```text
symbol
company_name
sector
sub_sector
industry
sub_industry
```

Digunakan untuk:

- company identification;
- sector classification;
- industry classification;
- peer grouping.

---

## 14.3 Valuation Data

```text
pb
pe
ps
pcf
peg
forward_pe
intrinsic_value
enterprise_to_ebitda
enterprise_to_revenue
```

Digunakan untuk:

- historical valuation;
- relative valuation;
- peer comparison.

---

## 14.4 Peer Data

```text
peer symbol
peer company
market_cap
pb_mrq
pe_ttm
net_income
total_revenue
total_assets
total_equity
```

Digunakan untuk:

- relative comparison;
- peer divergence;
- sector/industry comparison.

---

## 14.5 Fundamental Data

```text
revenue
earnings
ebit
ebitda
operating_pnl
total_assets
total_liabilities
total_equity
total_debt
operating_cash_flow
capital_expenditure
free_cash_flow
```

Digunakan untuk:

- fundamental change;
- financial trend;
- earnings analysis;
- cash-flow analysis.

---

# 15. Potential Signal Inputs

Technical spike ini belum menentukan threshold atau aturan signal final.

Threshold harus ditentukan setelah data sudah masuk ke normalizer dan historical baseline tersedia.

Data Sectors dapat menjadi input untuk beberapa kategori signal.

---

## 15.1 Price Movement

Input:

```text
close
daily_close_change
historical close
```

Flow:

```text
Historical Close
       ↓
Historical Baseline
       ↓
Current Close
       ↓
Calculate Change
       ↓
Potential Price Signal
```

---

## 15.2 Volume Movement

Input:

```text
volume
```

Flow:

```text
Historical Volume
       ↓
Volume Baseline
       ↓
Current Volume
       ↓
Volume Change
       ↓
Potential Volume Signal
```

---

## 15.3 Historical Price Deviation

Input:

```text
historical close
latest price
90-day high
90-day low
```

Flow:

```text
Historical Price
       ↓
Calculate Range/Baseline
       ↓
Compare Current Price
       ↓
Detect Deviation
       ↓
Potential Signal
```

---

## 15.4 Peer Divergence

Input:

```text
Company P/E
Peer Average P/E

Company P/B
Peer Average P/B

Company Financial Metrics
Peer Financial Metrics
```

Flow:

```text
Company Data
      +
Peer Data
      ↓
Relative Comparison
      ↓
Detect Divergence
      ↓
Potential Peer Signal
```

---

## 15.5 Fundamental Change

Input:

```text
revenue
earnings
EBITDA
operating cash flow
free cash flow
assets
liabilities
equity
```

Flow:

```text
Previous Financial Period
          +
Current Financial Period
          ↓
Financial Change
          ↓
Fundamental Analysis
          ↓
Potential Fundamental Signal
```

---

# 16. Data Mapping to TIDES

Tahap berikutnya membutuhkan mapping dari raw Sectors response ke internal TIDES format.

Initial mapping:

| Sectors Field | TIDES Concept | Potential Usage |
|---|---|---|
| `symbol` | `ticker` | Stock identity |
| `company_name` | `company_name` | Company identity |
| `last_close_price` | `current_price` | Current market state |
| `latest_close_date` | `price_date` | Data timestamp |
| `close` | `close_price` | Historical price |
| `open` | `open_price` | Historical market data |
| `high` | `high_price` | Historical market data |
| `low` | `low_price` | Historical market data |
| `volume` | `volume` | Volume analysis |
| `market_cap` | `market_cap` | Market context |
| `daily_close_change` | `daily_price_change` | Price movement |
| `sector` | `sector` | Classification |
| `sub_sector` | `sub_sector` | Classification |
| `industry` | `industry` | Classification |
| `sub_industry` | `sub_industry` | Classification |
| `pb` | `price_to_book` | Valuation |
| `pe` | `price_to_earnings` | Valuation |
| `ps` | `price_to_sales` | Valuation |
| `pcf` | `price_to_cash_flow` | Valuation |
| `peg` | `peg_ratio` | Valuation |
| `forward_pe` | `forward_pe` | Forward valuation |
| `intrinsic_value` | `intrinsic_value` | Valuation |
| `pb_peer_avg` | `peer_avg_pb` | Relative valuation |
| `pe_peer_avg` | `peer_avg_pe` | Relative valuation |
| `ps_peer_avg` | `peer_avg_ps` | Relative valuation |
| `revenue` | `revenue` | Fundamental |
| `earnings` | `earnings` | Fundamental |
| `ebit` | `ebit` | Fundamental |
| `ebitda` | `ebitda` | Fundamental |
| `operating_cash_flow` | `operating_cash_flow` | Cash flow |
| `capital_expenditure` | `capital_expenditure` | Cash flow |
| `free_cash_flow` | `free_cash_flow` | Cash flow |

This mapping is an initial mapping and may be adjusted during implementation based on the actual TIDES internal schema.

---

# 17. Normalization Requirement

Raw Sectors data sebaiknya tidak langsung digunakan oleh signal engine.

Diperlukan layer normalisasi:

```text
Sectors API
     ↓
Sectors Raw Response
     ↓
Normalizer
     ↓
TIDES Internal Schema
     ↓
Signal Engine
```

Tujuan normalizer:

1. Menyamakan nama field.
2. Menyamakan format ticker.
3. Menangani `null`.
4. Menyamakan tipe data.
5. Menyimpan tanggal dalam format yang konsisten.
6. Memisahkan current data dan historical data.
7. Menghindari ketergantungan signal engine terhadap struktur response Sectors.

---

## 17.1 Example Internal Schema

Contoh struktur internal TIDES:

```json
{
  "ticker": "BBCA.JK",
  "company_name": "PT Bank Central Asia Tbk.",
  "price": 6300,
  "price_date": "2026-09-23",
  "sector": "Financials",
  "industry": "Banks",
  "market_cap": 768866486850000,
  "daily_price_change": 0.0161290322580645
}
```

Historical data dapat dipisahkan:

```json
{
  "ticker": "BBCA.JK",
  "date": "2026-09-22",
  "open": 6200,
  "high": 6300,
  "low": 6150,
  "close": 6200,
  "volume": 0,
  "market_cap": 0
}
```

Angka historical pada contoh struktur di atas hanya menunjukkan format schema. Nilai aktual harus berasal dari response Sectors yang sedang diproses.

---

# 18. Data Quality Considerations

Beberapa hal perlu diperhatikan pada implementation.

## 18.1 Missing Values

Beberapa field dapat bernilai `null`.

Contoh:

```text
forward_pe = null
```

Normalizer harus mempertahankan informasi missing value dan tidak menggantinya dengan angka sembarang.

---

## 18.2 Different Historical Periods

Historical valuation tidak selalu memiliki periode yang sama untuk setiap perusahaan.

Contoh:

```text
BYAN → 2022–2026
CUAN → 2023–2026
BBCA → 2022–2026
```

Karena itu, TIDES tidak boleh mengasumsikan semua ticker mempunyai jumlah historical period yang sama.

---

## 18.3 Trading Days

Daily endpoint mengembalikan data berdasarkan tanggal perdagangan.

Dengan demikian:

```text
calendar days ≠ trading-day records
```

Contohnya, periode sekitar 90 hari menghasilkan 63 trading-day records.

---

## 18.4 API Date Range

Request dengan date range yang terlalu panjang tidak menghasilkan error, tetapi response tidak mencakup seluruh periode yang diminta.

Karena itu, implementation sebaiknya menggunakan date range yang terkontrol dan tidak mengasumsikan bahwa semua requested dates selalu tersedia dalam satu response.

---

## 18.5 Latest Data

Latest data dapat berubah ketika API diperbarui.

Contoh hasil pengujian:

```text
CUAN latest close:
2026-09-23 → 960

BBCA latest close:
2026-09-23 → 6300
```

Dokumentasi ini mencatat hasil pengujian pada saat technical spike dilakukan dan bukan sebagai nilai harga permanen.

---

# 19. Limitations

Berdasarkan pengujian yang dilakukan, terdapat beberapa hal yang belum dapat dipastikan:

### 19.1 Exact Daily API Maximum Range

Pengujian menunjukkan bahwa request yang lebih panjang dari sekitar 90 hari hanya mengembalikan 63 records pada periode yang diuji.

Namun exact maximum date range belum ditentukan.

---

### 19.2 Exact Rate Limit

Repeated requests tidak menghasilkan HTTP 429.

Namun numeric rate limit belum diketahui.

---

### 19.3 Future Forecast

Future Forecast tersedia sebagai dataset/section, tetapi belum divalidasi secara menyeluruh sebagai sumber data utama.

Karena itu belum dimasukkan sebagai core TIDES data.

---

### 19.4 Full Dataset JSON

Full Dataset JSON tersedia sebagai opsi pada Sectors UI, tetapi tidak dapat diuji dalam technical spike ini.

Export yang tersedia untuk pengujian berupa dataset CSV.

---

### 19.5 Signal Threshold

Technical spike hanya mengidentifikasi data yang tersedia.

Belum ditentukan:

- threshold price movement;
- threshold volume movement;
- threshold peer divergence;
- threshold fundamental change;
- scoring;
- ranking;
- signal severity.

Hal tersebut merupakan bagian dari tahap signal-engine design.

---

# 20. Recommended Core Data

Berdasarkan hasil eksplorasi, prioritas data untuk tahap awal TIDES:

### Priority 1 — Market Data

```text
latest price
historical price
volume
market cap
daily price change
```

### Priority 2 — Company Classification

```text
ticker
company
sector
sub-sector
industry
sub-industry
```

### Priority 3 — Valuation

```text
P/B
P/E
P/S
P/CF
PEG
Forward P/E
Intrinsic Value
```

### Priority 4 — Peer Comparison

```text
peer companies
peer P/B
peer P/E
peer financial metrics
```

### Priority 5 — Fundamental

```text
revenue
earnings
EBIT
EBITDA
operating cash flow
free cash flow
assets
liabilities
equity
debt
```

---

# 21. Technical Spike Conclusion

Hasil technical spike menunjukkan bahwa Sectors menyediakan beberapa kelompok data yang relevan untuk digunakan sebagai raw data source TIDES.

Data yang berhasil diuji secara langsung meliputi:

```text
Company Overview
        +
Daily Historical Data
        +
Valuation
        +
Peer Comparison
        +
Quarterly Financials
```

Data tersebut mencakup:

```text
Market Data
    ├── Current Price
    ├── Historical Price
    ├── Open
    ├── High
    ├── Low
    ├── Volume
    └── Market Cap

Company Data
    ├── Company Name
    ├── Sector
    ├── Sub-sector
    ├── Industry
    └── Sub-industry

Valuation
    ├── P/B
    ├── P/E
    ├── P/S
    ├── P/CF
    ├── PEG
    ├── Forward P/E
    └── Intrinsic Value

Peer Data
    ├── Peer Companies
    ├── Peer Valuation
    └── Peer Financial Metrics

Fundamental Data
    ├── Revenue
    ├── Earnings
    ├── EBIT
    ├── EBITDA
    ├── Assets
    ├── Liabilities
    ├── Equity
    ├── Debt
    ├── Operating Cash Flow
    └── Free Cash Flow
```

Sectors dapat digunakan sebagai raw data source untuk tahap selanjutnya dalam TIDES.

Namun, raw data dari Sectors sebaiknya tidak langsung digunakan oleh signal engine. Data perlu melewati proses normalisasi terlebih dahulu.

Final architecture yang direkomendasikan:

```text
                    Sectors
                       │
                       ▼
              Sectors REST API
                       │
                       ▼
                 Raw Response
                       │
                       ▼
                  Normalizer
                       │
                       ▼
              TIDES Internal Data
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
     Historical Baseline    Current Data
             │                   │
             └─────────┬─────────┘
                       ▼
                Change Detection
                       │
                       ▼
                 Signal Engine
                       │
                       ▼
                TIDES Signals
```

Tahap berikutnya setelah technical spike adalah:

1. Menetapkan internal schema TIDES.
2. Membuat mapping Sectors → TIDES.
3. Mengimplementasikan Sectors client.
4. Mengimplementasikan normalizer.
5. Menyiapkan historical baseline.
6. Mengimplementasikan change detection.
7. Menentukan signal logic dan threshold berdasarkan data aktual.

Technical spike ini tidak menetapkan bahwa suatu saham merupakan sinyal positif atau negatif. Tujuannya hanya mendokumentasikan data yang tersedia dan bagaimana data tersebut dapat menjadi input untuk proses analisis TIDES.