# GTIXT Public Plausible Event Matrix

## Canonical Events

| Event name | Trigger | Props | Objective |
|---|---|---|---|
| `public_funnel_step` | Route change on public pages | `step`, `path` | Measure top-of-funnel progression and page entry mix |
| `public_funnel_click` | Click from public pages toward key conversion pages | `href`, `from` | Identify strongest transition CTAs and navigation paths |
| `public_scroll_depth` | Scroll depth milestones (25/50/75) | `depth`, `path` | Validate content consumption and section stickiness |
| `public_api_link_click` | Click on public links targeting `/api/*` | `href`, `endpoint_group`, `from` | Measure technical intent and API discovery |
| `nav_search_open` | Search palette open from navigation | `surface`, `input` | Track intent to locate firms/data quickly |
| `nav_api_export_click` | CSV export click in navigation | `dataset`, `surface` | Measure high-intent data extraction behavior |
| `hero_cta_click` | Hero CTA clicks | `cta`, `surface` | Compare primary/secondary hero action effectiveness |

## Props Convention

- `step`: `home` | `rankings` | `firm_page` | `methodology` | `api_docs`
- `surface`: UI origin (`hero`, `navbar`)
- `input`: interaction mode (`button`, `keyboard`)
- `depth`: numeric milestone percent (`25`, `50`, `75`)
- `endpoint_group`: normalized API family path (example: `/api/data/export`)

## KPI Mapping

- Awareness: `public_funnel_step` (home, rankings share)
- Engagement: `public_scroll_depth`, `nav_search_open`
- Conversion intent: `hero_cta_click`, `public_funnel_click`
- Data intent: `nav_api_export_click`, `public_api_link_click`

## Notes

- Event names are flat and lowercase for consistency.
- All props must be primitive (`string`, `number`, `boolean`).
- Client calls fail-safe through `trackEvent` and must never block UX.
