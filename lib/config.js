export const CONFIG = {
  // URL du "pointeur" latest.json (MinIO public)
  // ex: https://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json
  LATEST_URL:
    process.env.NEXT_PUBLIC_LATEST_URL ||
    "http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json",

  // Base MinIO publique (pour construire l'URL du snapshot)
  MINIO_BASE:
    process.env.NEXT_PUBLIC_MINIO_BASE ||
    "http://51.210.246.61:9000/gpti-snapshots",

  BRAND: {
    name: "GTIXT",
    tagline: "The Global Prop Trading Index",
    altTagline: "Institutional Prop Trading Benchmark",
  },
};