# TIDES Architecture

## Overview

TIDES is composed of four main components:

1. Frontend
2. Backend/API
3. AI Agent
4. Sectors Data Layer

The components work together to support the TIDES research workflow:

Watchlist
→ Scan
→ Detect Changes
→ Triage Signals
→ Investigate
→ Challenge Signal
→ Evidence Brief
→ Human Judgment

## High-Level Architecture

                         TIDES
                           |
                      FRONTEND
                           |
                       BACKEND
                     /         \
                    /           \
           SIGNAL ENGINE       AI AGENT
                    \           /
                     \         /
                       SECTORS
                           |
                     MARKET DATA
                           |
                    EVIDENCE BRIEF
                           |
                    HUMAN JUDGMENT

## Components

### 1. Frontend

The frontend provides the user interface for interacting with TIDES.

Main responsibilities:

- Manage the stock watchlist
- Start a market scan
- Display detected changes
- Display the research queue
- Start an investigation
- Display investigation results
- Display the Challenge Signal result
- Display the final Evidence Brief

### 2. Backend/API

The backend acts as the application layer between the frontend, signal engine, AI agent, and Sectors.

Main responsibilities:

- Manage application state
- Manage the user's watchlist
- Provide API endpoints
- Retrieve and normalize Sectors data
- Run signal detection
- Coordinate the AI agent
- Handle errors and data availability
- Store investigation results when required

### 3. Signal Engine

The signal engine identifies potentially meaningful changes in monitored stocks.

Potential inputs include:

- Price changes
- Historical price data
- Volume changes
- Peer movements
- Fundamental changes, when available

The exact signal logic and thresholds will be determined after validating the data available through Sectors.

### 4. AI Agent

The AI agent is responsible for the research process after a potential signal is detected.

Main responsibilities:

- Understand the research task
- Determine what additional evidence is needed
- Select appropriate data/tools
- Investigate historical context
- Investigate peer context
- Investigate fundamental context when available
- Challenge the initial signal
- Synthesize the evidence
- Communicate uncertainty

The AI agent is not responsible for making investment decisions.

### 5. Sectors Data Layer

Sectors provides the financial market data used by TIDES as its core evidence source.

TIDES will use Sectors data for:

- Market information
- Historical information
- Company information
- Peer or classification information, when available
- Financial metrics, when available

The exact endpoints, fields, and available data will be determined during the Sectors technical spike.

## Data Flow

The intended data flow is:

User
  ↓
Frontend
  ↓
Backend
  ↓
Sectors
  ↓
Normalized Market Data
  ↓
Signal Engine
  ↓
Potential Signals
  ↓
AI Agent
  ↓
Additional Sectors Evidence
  ↓
Challenge Signal
  ↓
Evidence Brief
  ↓
User

## Agent Investigation Flow

Potential Signal
      ↓
Understand Signal
      ↓
Determine Required Evidence
      ↓
Select Data/Tools
      ↓
Retrieve Sectors Data
      ↓
Compare Context
      ↓
Challenge Initial Signal
      ↓
Synthesize Evidence
      ↓
Evidence Brief

## Evidence Structure

TIDES will structure research findings around four categories:

### Observed

What the available data directly shows.

### Compared

How the observation compares with historical or peer data.

### Interpreted

What the available evidence may indicate.

### Unknown

What the available data cannot establish.

This separation is intended to reduce unsupported conclusions and clearly communicate uncertainty.

## Architecture Constraints

TIDES follows several important constraints:

- Sectors must be a core data source.
- The system must not depend on unsupported financial data assumptions.
- Signal thresholds will be validated against real Sectors data.
- The AI agent must perform a defined research workflow rather than simply generate a response from a prompt.
- TIDES does not provide buy/sell recommendations.
- Automated trade execution is outside the scope of the project.
- Final judgment remains with the human researcher.

## Current Status

The high-level architecture is defined.

The following technical details remain to be determined through implementation and the Sectors technical spike:

- Exact Sectors endpoints
- Available data fields
- Data response formats
- Authentication method
- Peer/classification availability
- Fundamental metrics availability
- Final signal detection logic
- Storage requirements