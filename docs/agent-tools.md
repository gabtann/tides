# TIDES Agent Tools

## Purpose

Defines the tools available to the TIDES AI Agent during research and investigation.

The Agent selects tools based on the detected signal and the evidence required to investigate it.

## Available Tools

### `getOverview`

Retrieves the normalized company overview.

**Input:**
- `ticker: string`

**Output:**
- Company name
- Sector
- Sub-sector
- Industry
- Sub-industry
- Market capitalization
- Latest close price
- Latest close date
- Daily close change

**Purpose:**
Provides company and current market context.

---

### `getHistorical`

Retrieves historical daily market data.

**Input:**
- `ticker: string`

**Output:**
- Date
- Open
- High
- Low
- Close
- Volume
- Market capitalization

**Purpose:**
Provides historical context for price and volume movements.

---

### `getPeers`

Retrieves comparable companies provided by Sectors.

**Input:**
- `ticker: string`

**Output:**
- Peer ticker
- Company name
- Sector
- Industry
- Market capitalization
- Valuation metrics
- Selected financial metrics

**Purpose:**
Provides peer context for challenging whether a signal is specific to the investigated company.

---

### `getValuation`

Retrieves valuation data for the investigated company.

**Input:**
- `ticker: string`

**Output:**
- PE
- PB
- PS
- PCF
- PEG
- EV/EBITDA
- EV/Revenue
- Other available valuation metrics

**Purpose:**
Provides valuation context when relevant to the investigation.

---

### `getFundamentals`

Retrieves available quarterly financial data.

**Input:**
- `ticker: string`

**Output:**
- Revenue
- Gross profit
- Operating profit
- Earnings
- EBIT
- EBITDA
- Total assets
- Total liabilities
- Total equity
- Total debt
- Operating cash flow
- Free cash flow

**Purpose:**
Provides fundamental business context when relevant to the investigation.

## Tool Selection Principle

The Agent should select tools based on the detected signal and the evidence required.

The Agent should not automatically call every available tool.

The Agent should avoid unnecessary data retrieval and stop the investigation when sufficient evidence has been collected or when the available evidence is insufficient.

## Evidence Sources

All investigation tools must use normalized TIDES data originating from the Sectors API.

The Agent should not directly depend on raw Sectors API response structures.
