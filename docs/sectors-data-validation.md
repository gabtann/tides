# Sectors Data Validation

## 1. Overview Validation

| Field | Available | Nullable | Internal Field | Validation | Catatan |
|---|---|---|---|---|---|
| `symbol` | ✅ | Not observed | `ticker` | PASS | `.JK` removed internally |
| `company_name` | ✅ | Not observed | `company_name` | PASS | Available in tested responses |
| `sector` | ✅ | Not observed | `sector` | PASS | Available in Company Report |
| `sub_sector` | ✅ | Not observed | `sub_sector` | PASS | Available in Company Report |
| `industry` | ✅ | Not observed | `industry` | PASS | Available in Company Report |
| `sub_industry` | ✅ | Not observed | `sub_industry` | PASS | Available in Company Report |
| `market_cap` | ✅ | Not observed | `market_cap` | PASS | Numeric |
| `last_close_price` | ✅ | Not observed | `price` | PASS | Numeric |
| `latest_close_date` | ✅ | Not observed | `price_date` | PASS | `YYYY-MM-DD` |
| `daily_close_change` | ✅ | Not observed | `daily_price_change` | PASS | Decimal, not percentage string |

### Overview Findings

`daily_close_change` is returned as a decimal value rather than a percentage string or integer. For example, a value of `-0.0119047619` represents approximately `-1.19%`.

The internal representation should remain consistent as a decimal, while percentage formatting can be handled at the presentation layer.

---

## 2. Historical Data Validation

### 2.1 Field Validation

| Field | Available | Nullable | Format | Validation | Catatan |
|---|---|---|---|---|---|
| `date` | ✅ | Not observed | `YYYY-MM-DD` | PASS | Trading date |
| `open` | ✅ | Not observed | Numeric | PASS | Opening price |
| `high` | ✅ | Not observed | Numeric | PASS | Highest price |
| `low` | ✅ | Not observed | Numeric | PASS | Lowest price |
| `close` | ✅ | Not observed | Numeric | PASS | Closing price |
| `volume` | ✅ | Not observed | Numeric | PASS | Trading volume |

### 2.2 Date Format

The `date` field is returned in `YYYY-MM-DD` format.

Invalid date formats were also tested. For example, an invalid date such as `2026-99-99` was rejected with HTTP 400.

### 2.3 Trading Days

The Daily endpoint returns trading-day records rather than every calendar day.

For the tested CUAN period from `2026-06-24` to `2026-09-22`, the API returned 63 trading-day records.

A 7-day request returned 6 trading days, confirming that the response does not include non-trading calendar days.

### 2.4 Tested Period

The following Daily API periods were tested:

- 1-day range: 1 trading-day record
- 7-day range: 6 trading-day records
- 30-day range: 21 trading-day records
- Approximately 90-day range: 63 trading-day records

A request from `2026-01-01` to `2026-09-22` also returned 63 records covering `2026-06-24` to `2026-09-22`.

Therefore, the exact maximum historical range supported by the API was not determined.

### 2.5 Missing Data

No missing values were observed for `date`, `open`, `high`, `low`, `close`, and `volume` in the tested Daily API samples.

This finding applies only to the tested samples and does not establish a guarantee that these fields can never be null.

---

## 3. Peers Validation

| Field | Available | Nullable | Validation | Catatan |
|---|---|---|---|---|
| Peer ticker | ✅ | Not observed | PASS | Peer company symbols are available |
| Peer price | ❌ | N/A | NOT AVAILABLE | Not provided as a dedicated peer price field in the tested peer response |
| Peer change | ❌ | N/A | NOT AVAILABLE | Not provided as a dedicated peer price-change field |
| Number of peers | ✅ | N/A | PASS | Number depends on the tested company/response |
| Self-peer | ⚠️ | N/A | Observed | Tested peer response can contain the target company as `self` |
| Missing peer data | ⚠️ | Observed | CHECK | Some peer fields may be empty/null |

### Peer Findings

The Peers response provides peer companies together with comparison and financial/valuation fields such as `pb_mrq`, `pe_ttm`, `market_cap`, `net_income`, `total_assets`, `total_equity`, and `total_revenue`.

The tested BBCA peer response explicitly contains BBCA itself with the group `["self"]`. Therefore, self-peer handling is required. The current backend normalizer removes the self-peer from the normalized peer list.

Peer price and direct peer price-change fields were not identified as dedicated fields in the tested peer response. They should therefore be treated as `NOT AVAILABLE` rather than inferred from another endpoint.

---

## 4. Fundamental & Valuation Validation

### 4.1 Fundamental Data

| Field | Available | Nullable | Catatan |
|---|---|---|---|
| `revenue` | ✅ | Not observed | Available through Quarterly Financials |
| `operating_pnl` | ✅ | Not observed | Available through Quarterly Financials |
| `earnings_before_tax` | ✅ | Not observed | Available through Quarterly Financials |
| `earnings` | ✅ | Not observed | Available through Quarterly Financials |
| `gross_profit` | ✅ | Not observed | Available through Quarterly Financials |
| `ebit` | ✅ | Not observed | Available through Quarterly Financials |
| `ebitda` | ✅ | Not observed | Available through Quarterly Financials |
| `total_assets` | ✅ | Not observed | Available through Quarterly Financials |
| `total_liabilities` | ✅ | Not observed | Available through Quarterly Financials |
| `total_equity` | ✅ | Not observed | Available through Quarterly Financials |
| `total_debt` | ✅ | Not observed | Available through Quarterly Financials |
| `operating_cash_flow` | ✅ | Not observed | Available through Quarterly Financials |
| `capital_expenditure` | ✅ | Not observed | Available through Quarterly Financials |
| `free_cash_flow` | ✅ | Not observed | Available through Quarterly Financials |

### 4.2 Valuation Data

| Field | Available | Nullable | Catatan |
|---|---|---|---|
| `forward_pe` | ✅ | **Yes — null observed** | Field exists but may return null |
| `intrinsic_value` | ✅ | Not observed | Available in valuation response |
| `pb` | ✅ | Not observed | Historical valuation |
| `pe` | ✅ | Not observed | Historical valuation |
| `ps` | ✅ | Not observed | Historical valuation |
| `pcf` | ✅ | Not observed | Historical valuation |
| `peg` | ✅ | Not observed | Historical valuation |
| `enterprise_to_ebitda` | ✅ | **Yes — null observed** | Null observed in tested BBCA valuation data |
| `enterprise_to_revenue` | ✅ | **Yes — null observed** | Null observed in tested BBCA valuation data |

### Fundamental & Valuation Findings

Sectors provides quarterly financial data and valuation data through separate endpoints.

The tested BBCA valuation response contains `forward_pe`, `enterprise_to_ebitda`, and `enterprise_to_revenue` fields with null values in some cases. Therefore, these fields should be treated as nullable rather than assumed to always contain numeric values.

---

## 5. Data Quality Report

| Data | Available | Nullable | Catatan |
|---|---|---|---|
| Overview | ✅ | Not observed in tested samples | Company and market information available |
| Historical | ✅ | Not observed in tested samples | Daily OHLCV available; response contains trading days |
| Peers | ✅ | Some fields nullable/not available | Peer comparison available; peer price/change not provided as dedicated fields |
| Fundamentals | ✅ | Depends on field | Quarterly financial data available |
| Valuation | ✅ | Some fields nullable | Valuation metrics available; some metrics can be null |

---

## 6. Conclusion

The validation confirms that Sectors provides company overview, historical daily market data, peer comparison data, quarterly financial data, and valuation data through separate API endpoints.

However, availability from Sectors does not necessarily mean that the data is currently consumed by the TIDES backend.

Fields that are not present in the tested response are marked as `NOT AVAILABLE` rather than being inferred from alternative endpoints.

The validation results should be used by the Agent Lead when defining agent tools and data requirements.