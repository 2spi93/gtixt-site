# GTIXT Risk Interpretation Standard (v1.0)

Status: Public Standard
Owner: GTIXT Intelligence Engine
Audience: Risk teams, desks, advanced traders, external integrators

## Positioning

GTIXT is the first public risk model for the global prop trading industry.

This standard defines how to read, compare, and operationalize GTIXT risk probabilities in a consistent institutional way.

## Scope

This document applies to:
- Closure risk
- Fraud risk
- Stress risk

Range for each risk score: 0.00 to 1.00

## Core Interpretation Layer

### Probability bands

- 0.00 to 0.39: Low risk
  Interpretation: No immediate structural signal.
  Typical action: Continue monitoring.

- 0.40 to 0.59: Moderate risk
  Interpretation: Mixed indicators, potential deterioration.
  Typical action: Increase monitoring frequency.

- 0.60 to 0.74: Elevated risk
  Interpretation: Historically associated with firm instability.
  Typical action: Reduce new exposure and run enhanced review.

- 0.75 to 0.84: High risk
  Interpretation: High probability of operational disruption.
  Typical action: Freeze incremental allocation until confirmation.

- 0.85 to 1.00: Critical risk
  Interpretation: Similar patterns observed before firm closures.
  Typical action: Escalate immediately to risk committee.

## Mandatory Decision Context

A probability alone is not enough. Every risk decision must include:
- Probability band (Low/Moderate/Elevated/High/Critical)
- Confidence score (model confidence)
- Data freshness (last update timestamp)
- Horizon (for example: weekly, monthly)
- Trigger summary (main factors)

## Human-Readable Output Template

Use this output shape in UI, API, and reports:

- score: 0.82
- band: High
- interpretation: High probability of operational disruption.
- action: Freeze incremental allocation and escalate review.
- confidence: 0.77
- freshness_hours: 4.2
- horizon: weekly
- top_triggers:
  - Payout deterioration
  - Rule instability
  - Elevated ecosystem stress

## Decision Matrix (Institutional)

- Low + high confidence: Monitor on normal cadence
- Moderate + medium confidence: Add targeted review checks
- Elevated + high confidence: Reduce exposure and notify operators
- High + medium/high confidence: Freeze allocation, senior review required
- Critical (any confidence above minimum threshold): Immediate escalation protocol

## Escalation Protocol (Minimum)

- Elevated: Owner analyst + operations lead
- High: Risk lead + operations lead + compliance observer
- Critical: Risk committee event, documented decision log

## Model Limits and Responsible Use

GTIXT probabilities are decision support signals, not deterministic outcomes.

Do not use a single score as a standalone closure/fraud verdict. Always combine:
- Probability band
- Confidence
- Freshness
- Trigger evidence
- Human validation

## Governance

- Versioned methodology required
- Public change log required
- Backtesting and calibration reviews recommended on fixed cadence

## Public Citation

When quoting GTIXT risk publicly, include:
- Model version
- Timestamp
- Horizon
- Confidence

Example:
"Closure risk: 0.78 (High), confidence 0.74, horizon weekly, GTIXT v1.2.0, updated 2026-03-20T02:00:00Z."
