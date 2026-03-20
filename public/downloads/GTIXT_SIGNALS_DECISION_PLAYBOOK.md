# GTIXT Signals and Decision Playbook (v1.0)

Status: Public Decision Playbook
Owner: GTIXT Intelligence Engine
Audience: Operators, risk analysts, desk leads

## Objective

Convert GTIXT signals into disciplined, repeatable decisions.

This playbook defines:
- how to read signal states
- how to combine signals with probabilities
- what action to take by severity level

## Signal categories

Primary GTIXT signal states:
- Stable
- Rising
- Deteriorating
- High-risk
- Unrated

## Signal interpretation

- Stable:
  Interpretation: No immediate stress pattern in core indicators.
  Action: Normal monitoring cadence.

- Rising:
  Interpretation: Improvement trend detected, but not a guarantee.
  Action: Maintain controls, monitor persistence.

- Deteriorating:
  Interpretation: Meaningful degradation in one or more pillars.
  Action: Increase review frequency, verify root causes.

- High-risk:
  Interpretation: Multiple adverse patterns aligned.
  Action: Restrict exposure and launch escalation review.

- Unrated:
  Interpretation: Insufficient data quality/completeness.
  Action: Do not treat as safe; request evidence completion.

## Decision model: Signal x Probability

Use both layers together.

### Rule 1
If signal is Deteriorating or High-risk and closure risk >= 0.60:
- classify as Elevated event
- trigger operator review

### Rule 2
If signal is High-risk and closure risk >= 0.75:
- classify as High event
- freeze incremental allocation

### Rule 3
If closure risk >= 0.85 regardless of positive signal noise:
- classify as Critical event
- escalate to risk committee

### Rule 4
If confidence is low or freshness is stale:
- downgrade automation
- require manual confirmation before hard action

## Recommended response ladder

- Watch:
  Conditions: Moderate risk, stable or rising signal
  Response: Monitor, no hard intervention

- Caution:
  Conditions: Elevated risk or deteriorating signal
  Response: Reduce exposure velocity, verify evidence

- Restrict:
  Conditions: High risk and adverse signal alignment
  Response: Freeze new allocation

- Escalate:
  Conditions: Critical risk or multi-trigger event
  Response: Formal governance review, documented decision

## Required evidence fields in decision log

For every restriction/escalation event, log:
- firm_id
- timestamp
- signal state
- closure/fraud/stress probabilities
- confidence
- freshness
- top triggers
- decision owner
- decision action

## Weekly publication formats (authority layer)

Use this playbook to publish:
- Weekly Risk Report
- Firms at Risk This Week
- Systemic Stress Update

## Communication standard

Write decisions in short, unambiguous language:
- Deterministic.
- Auditable.
- Versioned.

Avoid:
- long narrative blocks
- certainty claims without confidence/freshness context

## Example decision output

- Firm: FTMO
- Signal: Deteriorating
- Closure risk: 0.78 (High)
- Confidence: 0.74
- Freshness: 3.1h
- Action: Freeze incremental allocation and escalate review.
- Reason: Payout stress + rule instability + contagion pressure.

## Final rule

GTIXT is a decision support standard.

Decisions must be explainable, logged, and reviewable.
