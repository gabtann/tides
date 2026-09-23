# TIDES AI Agent

## Purpose

The TIDES AI Agent is responsible for investigating potential market signals identified by the signal engine.

The agent does not make investment decisions or provide buy/sell recommendations.

Its purpose is to determine whether a detected change deserves further research by gathering relevant evidence, comparing context, challenging the initial signal, and producing an evidence-based research brief.

## Agent Workflow

The TIDES AI Agent follows a structured investigation workflow:

Potential Signal
↓
Understand Signal
↓
Determine Required Evidence
↓
Select Data and Tools
↓
Retrieve Evidence
↓
Analyze Context
↓
Challenge Signal
↓
Assess Evidence Strength
↓
Generate Evidence Brief

## 1. Understand Signal

The agent first identifies what triggered the research signal.

The agent should determine:

- What changed?
- Which stock is affected?
- What data triggered the signal?
- What period is relevant?
- Why was the signal prioritized for investigation?

The agent must distinguish between an observed change and an interpretation of that change.

## 2. Determine Required Evidence

The agent determines what additional evidence is needed to investigate the signal.

Potential evidence categories include:

- Historical context
- Price movement
- Volume movement
- Peer movement
- Sector or industry context
- Fundamental metrics
- Company information

The agent should select evidence based on the detected signal rather than retrieving every available data point.

## 3. Select Data and Tools

The agent selects the appropriate data and tools required for the investigation.

The selected tools depend on:

- The type of signal
- The evidence required
- The data available through Sectors

The agent should avoid unnecessary tool calls and should only retrieve information relevant to the investigation.

The exact tools and available data fields will be defined after the Sectors technical spike.

## 4. Retrieve Evidence

The agent retrieves the evidence required for the investigation using the available Sectors data tools.

The agent should:

- Request only the data required for the current investigation.
- Preserve the relevant values and time periods used in the analysis.
- Record the source of the retrieved evidence.
- Handle unavailable or incomplete data explicitly.
- Avoid treating missing data as evidence of absence.

Retrieved evidence becomes the basis for the subsequent analysis and challenge process.

## 5. Analyze Context

The agent analyzes the retrieved evidence by comparing the detected signal with relevant context.

Possible comparisons include:

- Historical movement of the same stock
- Price and volume behavior
- Movement of comparable companies
- Sector or industry movement
- Available fundamental information

The agent should distinguish between:

- What the data directly shows
- What the comparison suggests
- What cannot be established from the available evidence

The agent must not assume that a correlation or simultaneous movement proves causation.

## 6. Challenge Signal

The agent challenges the initial research signal after gathering additional evidence.

The purpose of this step is to determine whether the signal remains meaningful after additional context is considered.

For example, if a stock experiences an unusual price movement, the agent may compare the movement with relevant peers or the broader sector.

If similar movements are observed across peers, the initial signal may become less specific to the individual stock.

If the stock moves differently from its relevant peers, the divergence may remain relevant for further investigation.

The Challenge Signal step does not determine whether a stock should be bought or sold.

It evaluates whether the original research signal is still supported by the available evidence.

## 7. Assess Evidence Strength

The agent assesses the strength of the evidence supporting the research signal.

Evidence strength is based on factors such as:

- Availability of relevant data
- Consistency between different observations
- Quality of historical or peer comparisons
- Completeness of the available evidence
- Degree of uncertainty

Possible evidence strength values are:

- Strong
- Moderate
- Weak

Evidence strength describes the quality and consistency of the available research evidence.

It does not represent the expected performance of a stock or the confidence of an investment decision.

## 8. Generate Evidence Brief

After completing the investigation, the agent generates a structured evidence brief.

The evidence brief should contain:

### Research Signal

The original signal that triggered the investigation.

### Research Priority

The level of priority assigned to the signal for further research.

Possible values:

- HIGH
- MEDIUM
- LOW

Research priority represents research relevance, not an investment recommendation.

### Evidence Strength

The assessed strength of the available evidence:

- Strong
- Moderate
- Weak

### Observed

Facts directly supported by the retrieved data.

### Compared

Relevant historical, peer, or sector comparisons.

### Interpreted

Interpretations that are supported by the available evidence.

### Challenge Signal

The result of testing the initial signal against additional context.

### Unknown

Important questions that cannot be established from the available evidence.

### Evidence

The key data points used during the investigation, including their relevant values, periods, and sources.

### Research Summary

A concise summary of the investigation and why the signal may or may not deserve further research.

The research summary must not contain a buy or sell recommendation.

## Agent Constraints

The TIDES AI Agent must follow these constraints:

### 1. Evidence First

The agent must base its analysis on available evidence.

It must not invent:

- Market data
- Financial metrics
- Events
- Company information
- Causes of price movements

### 2. No Unsupported Causality

The agent must not claim that an event caused a market movement unless the available evidence directly supports the claim.

For example:

> "The stock increased because of event X."

should not be stated when the available data only shows that the stock increased around the same period as event X.

### 3. Distinguish Observation from Interpretation

The agent must clearly separate:

- Observed facts
- Comparisons
- Interpretations
- Unknown information

### 4. Communicate Uncertainty

When evidence is incomplete, conflicting, or unavailable, the agent must explicitly communicate the limitation.

Missing data must not be treated as confirmation or rejection of a hypothesis.

### 5. Challenge the Initial Signal

The agent must evaluate the initial signal against relevant additional context before producing the final research brief.

The agent should not simply confirm the initial signal.

### 6. Sectors as the Core Financial Data Source

Financial market evidence used by TIDES must come from the available Sectors data integration.

The agent must not silently substitute unsupported external financial data for missing Sectors data.

### 7. No Investment Recommendations

The agent must not provide:

- Buy recommendations
- Sell recommendations
- Hold recommendations
- Automated trading decisions
- Guaranteed price predictions

TIDES is an information and research support tool.

### 8. Human Judgment

The final interpretation and investment decision remain with the human researcher.

The agent provides structured evidence and research context to support human judgment.

## Agent Input

The AI Agent receives a potential research signal from the signal engine.

The input should provide enough information for the agent to understand what was detected and begin an investigation.

Conceptually, the input contains:

- Stock identifier
- Signal type
- Trigger information
- Relevant period
- Initial research priority

The exact fields and format will be defined after the Sectors data and signal engine are validated.

## Agent Investigation State

During an investigation, the agent maintains a structured state containing the information collected and decisions made during the research process.

The investigation state contains:

- Signal
- Evidence required
- Evidence collected
- Observations
- Comparisons
- Challenge result
- Evidence strength
- Unknowns
- Final research brief

The state allows the investigation to progress through multiple steps instead of treating the interaction as a single prompt-and-response operation.

## Agent Output

After completing the investigation, the agent produces an evidence brief.

The output should contain:

- Research signal
- Research priority
- Evidence strength
- Observed findings
- Comparisons
- Interpretation
- Challenge Signal result
- Unknowns
- Supporting evidence
- Research summary

The output is intended to support human research and judgment.

It must not provide a buy, sell, or hold recommendation.

## Tool Selection Logic

The agent should determine which categories of evidence are required before retrieving data.

Tool selection is driven by the detected signal and the evidence required to investigate it.

The agent should not retrieve every available data point by default.

### Signal-to-Evidence Mapping

| Signal Context | Potential Evidence |
|---|---|
| Unusual price movement | Current price and historical price |
| Unusual volume movement | Current volume and historical volume |
| Price-volume divergence | Price and volume history |
| Potential company-specific movement | Peer comparison |
| Potential sector-wide movement | Sector or industry context |
| Signal involving financial performance | Relevant fundamental metrics |
| Insufficient evidence | Additional relevant data or explicit uncertainty |

The exact Sectors tools and available fields will be mapped to these evidence categories after the Sectors technical spike.

### Tool Selection Principles

The agent should:

1. Identify the information needed to investigate the signal.
2. Select only the relevant data categories.
3. Retrieve the available evidence through Sectors.
4. Evaluate whether the retrieved evidence is sufficient.
5. Request additional evidence when necessary.
6. Stop the investigation when sufficient evidence has been collected or when available data is insufficient.
7. Explicitly communicate uncertainty when the required evidence cannot be obtained.