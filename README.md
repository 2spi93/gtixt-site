# GPTI XT Site

Global Prop Trading Index - Token platform

## Overview

This is the frontend website for GPTI XT, consuming data from the GPTI Data API.

## API Integration

The site fetches data from:
- `https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json`
- `https://gtixt.com/gpti-snapshots/{object}`

## Development

```bash
npm install
npm run dev
```

## Deployment

Deployed on Netlify with automatic builds from this repository.

## Branding

Brand assets are located in `public/brand/` and include:
- Logo variants (SVG)
- Brand tokens (CSS custom properties)
- Icons and lockups