# TIDES Agent Input Schema

## Purpose

Defines the input structure passed from the TIDES backend to the AI Agent for research and investigation.

The Agent receives normalized TIDES data and signal context rather than raw Sectors API responses.

## Agent Input

```json
{
  "ticker": "BBCA",
  "signal": {
    "type": "PRICE_MOVEMENT",
    "priority": "HIGH",
    "description": "Price movement requires further investigation."
  },
  "currentContext": {
    "currentPrice": 8500,
    "dailyChange": 4.2,
    "latestDate": "2026-09-25",
    "sector": "Financials",
    "industry": "Banks"
  },
  "availableTools": [
    "getOverview",
    "getHistorical",
    "getPeers",
    "getValuation",
    "getFundamentals"
  ]
}

> Example values are illustrative and must not be treated as actual market data.

## Fields

### `ticker`

Internal TIDES ticker symbol.

- Type: `string`
- Format: uppercase ticker without the `.JK` suffix.
- Example: `BBCA`

### `signal`

Information about the signal detected by the backend.

### `signal.type`

Type of detected research signal.

- Type: `string`
- Allowed values:
  - `PRICE_MOVEMENT`
  - `VOLUME_MOVEMENT`
  - `HISTORICAL_DEVIATION`
  - `PEER_DIVERGENCE`
  - `FUNDAMENTAL_CHANGE`
  - `VALUATION_SIGNAL`

#### `signal.priority`

Initial research priority assigned by the signal engine.

- Type: `string`
- Allowed values: `HIGH`, `MEDIUM`, `LOW`

Research priority indicates that a signal may deserve further investigation. It is not an investment recommendation.

#### `signal.description`

Short description of the detected signal.

- Type: `string`

### `currentContext`

Current normalized context available to the Agent before additional investigation.

#### `currentContext.currentPrice`

Latest available closing price.

- Type: `number`

#### `currentContext.dailyChange`

Latest daily price change.

- Type: `number`

#### `currentContext.latestDate`

Date associated with the latest available market data.

- Type: `string`
- Format: `YYYY-MM-DD`

#### `currentContext.sector`

Company sector.

- Type: `string`
- May be unavailable when the source does not provide the value.

#### `currentContext.industry`

Company industry.

- Type: `string`
- May be unavailable when the source does not provide the value.

### `availableTools`

Tools that the Agent can select during investigation.

- Type: `string[]`

Initial available tools:

- `getOverview`
- `getHistorical`
- `getPeers`
- `getValuation`
- `getFundamentals`

The Agent should select tools based on the signal and evidence required rather than automatically calling every available tool.

## Input Principles

1. Ticker uses the canonical TIDES format.
2. Data passed to the Agent should come from the TIDES internal schema.
3. Raw Sectors API response structures should not be passed directly to the Agent.
4. Signal priority represents research priority, not investment advice.
5. Missing or unavailable data must remain explicit rather than being replaced with unsupported assumptions.
6. The Agent may request additional evidence through the available tools during investigation.
