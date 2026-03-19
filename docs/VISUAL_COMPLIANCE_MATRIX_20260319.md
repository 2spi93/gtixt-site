# GTIXT Visual Compliance Matrix - 2026-03-19

## Scope
- Full client pass (ordered routes).
- Full admin pass (ordered routes).
- Harmonized via shared route briefing banner + institutional contrast alignment in shell styles.

## Rules Applied
- Micro-copy is normalized with route-specific institutional wording.
- A contextual ? is present on every page through the shared route briefing banner.
- Block disposition is standardized with a fixed briefing block before page content.
- Contrast is harmonized with sober GTIXT tokens (slate/navy/steel, high readability text).

## WCAG Measured Contrast (AA)
<!-- WCAG_AUDIT_START -->
Last run: 2026-03-19T16:56:21.429Z

Result: 9/9 checks pass (0 fail).

| Component | Ratio | AA Threshold | Status |
|---|---|---|---|
| Global body text | 14.48:1 | 4.5:1 | PASS |
| Global paragraph secondary | 6.96:1 | 4.5:1 | PASS |
| Route briefing title | 16.30:1 | 4.5:1 | PASS |
| Route briefing body copy | 14.48:1 | 4.5:1 | PASS |
| Route briefing chip text | 8.49:1 | 4.5:1 | PASS |
| Admin nav link text | 14.48:1 | 4.5:1 | PASS |
| Admin action button text | 13.35:1 | 4.5:1 | PASS |
| Client ribbon chip text | 10.15:1 | 4.5:1 | PASS |
| Accent heading cyan large text | 8.33:1 | 3.0:1 | PASS |

Detailed report: docs/ops/wcag-contrast-latest.md
<!-- WCAG_AUDIT_END -->

## Visual QA Proof (Playwright)
<!-- VISUAL_QA_START -->
Last run: 2026-03-19T16:59:18.849Z

Captured: 50/50 routes.
Auth redirects observed: 28.

Evidence files:
- docs/ops/route-visual-evidence-latest.md
- test-results/route-visual-proof/manifest.json
- test-results/route-visual-proof/*.png

<!-- VISUAL_QA_END -->

## Client Routes (Order Complete)

| # | Route | Micro-copy | ? Tooltip | Block Layout | Contrast | Status |
|---|---|---|---|---|---|---|
| 1 | /analytics | OK | OK | OK | OK | Compliant |
| 2 | /api-docs | OK | OK | OK | OK | Compliant |
| 3 | /best-prop-firms | OK | OK | OK | OK | Compliant |
| 4 | /data | OK | OK | OK | OK | Compliant |
| 5 | /firms/[slug] | OK | OK | OK | OK | Compliant |
| 6 | /firms | OK | OK | OK | OK | Compliant |
| 7 | /ftmo-review | OK | OK | OK | OK | Compliant |
| 8 | /fundingpips-review | OK | OK | OK | OK | Compliant |
| 9 | /index | OK | OK | OK | OK | Compliant |
| 10 | /industry-map | OK | OK | OK | OK | Compliant |
| 11 | /methodology | OK | OK | OK | OK | Compliant |
| 12 | / | OK | OK | OK | OK | Compliant |
| 13 | /prop-firm-payouts | OK | OK | OK | OK | Compliant |
| 14 | /radar | OK | OK | OK | OK | Compliant |
| 15 | /rankings | OK | OK | OK | OK | Compliant |
| 16 | /research | OK | OK | OK | OK | Compliant |
| 17 | /risk-radar | Redirect | N/A | N/A | N/A | Alias |
| 18 | /simulator | OK | OK | OK | OK | Compliant |
| 19 | /strategy-simulator | Redirect | N/A | N/A | N/A | Alias |
| 20 | /style-guide | OK | OK | OK | OK | Compliant |
| 21 | /verify | OK | OK | OK | OK | Compliant |

## Admin Routes (Order Complete)

| # | Route | Micro-copy | ? Tooltip | Block Layout | Contrast | Status |
|---|---|---|---|---|---|---|
| 22 | /admin/agents | OK | OK | OK | OK | Compliant |
| 23 | /admin/agents/policies | OK | OK | OK | OK | Compliant |
| 24 | /admin/ai-assistant | OK | OK | OK | OK | Compliant |
| 25 | /admin/audit | OK | OK | OK | OK | Compliant |
| 26 | /admin/autonomous-lab | OK | OK | OK | OK | Compliant |
| 27 | /admin/copilot | OK | OK | OK | OK | Compliant |
| 28 | /admin/crawls | OK | OK | OK | OK | Compliant |
| 29 | /admin/discovery | OK | OK | OK | OK | Compliant |
| 30 | /admin/execution | OK | OK | OK | OK | Compliant |
| 31 | /admin/firms | OK | OK | OK | OK | Compliant |
| 32 | /admin/health | OK | OK | OK | OK | Compliant |
| 33 | /admin/info | OK | OK | OK | OK | Compliant |
| 34 | /admin/integrity/calibration | OK | OK | OK | OK | Compliant |
| 35 | /admin/integrity | OK | OK | OK | OK | Compliant |
| 36 | /admin/jobs | OK | OK | OK | OK | Compliant |
| 37 | /admin/login | Login context | N/A | Login screen preserved | OK | Preserved |
| 38 | /admin/logs | OK | OK | OK | OK | Compliant |
| 39 | /admin/monitoring | OK | OK | OK | OK | Compliant |
| 40 | /admin/operations | OK | OK | OK | OK | Compliant |
| 41 | /admin | OK | OK | OK | OK | Compliant |
| 42 | /admin/planning | OK | OK | OK | OK | Compliant |
| 43 | /admin/review | OK | OK | OK | OK | Compliant |
| 44 | /admin/security/2fa | OK | OK | OK | OK | Compliant |
| 45 | /admin/security | OK | OK | OK | OK | Compliant |
| 46 | /admin/security/password | OK | OK | OK | OK | Compliant |
| 47 | /admin/sessions | OK | OK | OK | OK | Compliant |
| 48 | /admin/users | OK | OK | OK | OK | Compliant |
| 49 | /admin/validation | OK | OK | OK | OK | Compliant |
| 50 | /admin/webgl-monitor | OK | OK | OK | OK | Compliant |

## Implementation Anchors
- Route-specific briefing and tooltip coverage: components/ui/RouteBriefingBanner.tsx
- Client global injection point: app/(public)/layout.tsx
- Admin global injection point: app/admin/layout.tsx
- Institutional contrast harmonization: styles/globals.css
