# TIDES Agent Tools

## Purpose

Defines the tools available to the TIDES AI Agent during research and investigation.

The Agent selects tools based on the detected signal and the evidence required to investigate it.

## Available Tools

The MVP provides the following tools:

- `getOverview`
- `getHistorical`
- `getPeers`

Additional tools such as valuation and fundamentals are planned for future versions and are not available in the MVP.

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
- `period: string`

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


## Tool Selection Principle

The Agent should select tools based on the detected signal and the evidence required.

The Agent should not automatically call every available tool.

The Agent should avoid unnecessary data retrieval and stop the investigation when sufficient evidence has been collected or when the available evidence is insufficient.

### Tool Usage Rules

- `getOverview` should be used when company or current market context is required.
- `getHistorical` should be used for price, volume, and historical deviation signals.
- `getPeers` should be used to compare the investigated company with relevant peers.
- The Agent should only use tools available in the MVP tool set.
- Primary tools should be used before optional tools.
- Optional tools should only be called when the available evidence is insufficient.
- The Agent should stop when the evidence is sufficient, relevant data is unavailable, or additional tools would not materially improve the investigation.

## Evidence Sources

All investigation tools must use normalized TIDES data originating from the Sectors API.

The Agent should not directly depend on raw Sectors API response structures.
