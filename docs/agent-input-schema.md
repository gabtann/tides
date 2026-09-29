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
    "description": "Price movement requires further investigation.",
    "details": {
      "direction": "UP",
      "magnitude": 6.2
    }
  },
  "currentContext": {
    "currentPrice": 8500,
    "dailyChange": 6.2,
    "latestDate": "2026-09-25",
    "sector": "Financials",
    "industry": "Banks"
  },
  "availableTools": [
    "getOverview",
    "getHistorical",
    "getPeers"
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

#### `signal.type`

Type of detected research signal, as produced by the TIDES signal engine.

- Type: `string`
- Allowed values: `PRICE_MOVEMENT`, `VOLUME_MOVEMENT`, `HISTORICAL_DEVIATION`, `PEER_DIVERGENCE`
- Example: `PRICE_MOVEMENT`

#### `signal.details`

Detailed information about the signal.

- Type: `object`
- Contains: `direction`, `magnitude`

#### `signal.details.direction`

Price movement direction. Only present for `PRICE_MOVEMENT` and `HISTORICAL_DEVIATION` signals.

- Type: `string`
- Allowed values: `UP`, `DOWN`, `HIGH`, `LOW`
- Optional

#### `signal.details.magnitude`

Numerical magnitude of the detected signal (in percentage or multiplier).

- Type: `number`
- Examples: `6.2` (price change), `2.3` (volume multiplier), `97.1` (deviation)

#### `signal.allSignals`

All signals detected for this ticker in the same scan. Present when the backend auto-enriches the payload from the last scan result and multiple signals exist for the ticker.

- Type: `Array<{ type, direction?, magnitude }>`
- Optional

#### `signal.priority`

Initial research priority. Optional — if absent, the Agent or backend will derive priority from `evidenceStrength`.

- Type: `string`
- Allowed values: `HIGH`, `MEDIUM`, `LOW`
- Optional

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

The Agent should select tools based on the signal and evidence required rather than automatically calling every available tool.

## Input Principles

1. Ticker uses the canonical TIDES format (uppercase, no `.JK` suffix).
2. Data passed to the Agent should come from the TIDES internal schema.
3. Raw Sectors API response structures should not be passed directly to the Agent.
4. Signal priority represents research priority, not investment advice.
5. Missing or unavailable data must remain explicit rather than being replaced with unsupported assumptions.
6. The Agent may request additional evidence through the available tools during investigation.
7. **Minimal payload:** The backend accepts `{ "ticker": "BBCA" }` as a valid minimum payload. When `signal` or `currentContext` are absent, the backend will attempt to auto-enrich from the most recent scan result before forwarding to the Agent. A full payload (with `signal`, `currentContext`, and `availableTools`) is preferred for deterministic behaviour.
