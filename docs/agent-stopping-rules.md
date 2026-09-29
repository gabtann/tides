# TIDES Agent Stopping Rules

## Purpose

Defines when the TIDES AI Agent should stop retrieving evidence during an investigation.

## Signal-Specific Stopping Rules

The MVP supports stopping rules for the following signal types only:

- `PRICE_MOVEMENT`
- `VOLUME_MOVEMENT`
- `HISTORICAL_DEVIATION`
- `PEER_DIVERGENCE`

Future signal types are not part of the MVP.

### PRICE_MOVEMENT

1. Retrieve `getHistorical`.
2. Retrieve `getPeers`.
3. Stop when historical and peer context are sufficient to assess the movement.
4. Use optional tools only when additional context is required.

### VOLUME_MOVEMENT

1. Retrieve `getHistorical`.
2. Retrieve `getPeers`.
3. Stop when the volume movement has sufficient historical and peer context.
4. Use `getOverview` only when additional current context is required.

### HISTORICAL_DEVIATION

1. Retrieve `getHistorical`.
2. Retrieve `getPeers`.
3. Stop when the deviation can be assessed using the available historical and peer evidence.
4. Use `getOverview` only when additional current context is required.

### PEER_DIVERGENCE

1. Retrieve `getPeers`.
2. Retrieve `getHistorical`.
3. Stop when the divergence can be assessed using peer and historical evidence.
4. Use `getOverview` only when additional current context is required.

## General Stopping Rules

The Agent should stop the investigation when:

- Sufficient relevant evidence has been collected.
- Additional tool calls are unlikely to materially improve the investigation.
- Required data is unavailable.
- A tool returns an error that prevents further investigation.
- The available evidence does not support a stronger interpretation.

The Agent must not fabricate, infer, or substitute unavailable data.

The Agent must explicitly report important evidence limitations.

The Agent must not continue calling tools only to increase the amount of retrieved data.

## Investigation Completion

An investigation is complete when the Agent can:

1. State the observed facts.
2. Compare relevant evidence when applicable.
3. Provide an evidence-based interpretation.
4. Identify what remains unknown.
5. State important limitations.