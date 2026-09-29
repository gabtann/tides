# TIDES Agent Tool Selection Rules

## Purpose

Defines the initial rules used by the TIDES AI Agent to select investigation tools based on the detected signal.

## Signal-to-Tool Mapping

The MVP supports the following signal types and investigation tools only.

Future signal types and tools are not part of the MVP and should not be selected by the Agent.

| Signal Type | Primary Tools | Optional Tools |
|---|---|---|
| `PRICE_MOVEMENT` | `getHistorical`, `getPeers` | `getOverview` |
| `VOLUME_MOVEMENT` | `getHistorical`, `getPeers` | `getOverview` |
| `HISTORICAL_DEVIATION` | `getHistorical`, `getPeers` | `getOverview` |
| `PEER_DIVERGENCE` | `getPeers`, `getHistorical` | `getOverview` |

## Selection Rules

1. Start with the primary tools associated with the detected signal.
2. Use optional tools only when additional evidence is required.
3. Do not call all available tools by default.
4. Prefer historical and peer context when investigating price or volume signals.
5. Use peer data to challenge whether a signal is specific to the investigated company.
6. Stop retrieving evidence when the available evidence is sufficient.
7. If required evidence is unavailable, explicitly report the limitation instead of making unsupported assumptions.
8. Tool selection must support evidence-based investigation and must not produce direct buy, sell, or hold recommendations.

## Investigation Completion

The Agent should consider an investigation complete when:

- The relevant primary evidence has been retrieved.
- Additional tool calls are unlikely to materially improve the investigation.
- The Agent can distinguish observed facts from interpretation.
- The Agent has attempted to challenge the initial signal when peer or historical context is relevant.
- Any important evidence limitations are explicitly identified.
