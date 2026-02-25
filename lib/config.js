const isServer = typeof window === "undefined";
const INTERNAL_ROOT = process.env.MINIO_INTERNAL_ROOT || "http://localhost:9002/gpti-snapshots";

const normalizeBase = (base) => {
  if (!base) return INTERNAL_ROOT;
  if (!isServer) return base;
  if (/^https?:\/\//i.test(base)) return base;
  const root = INTERNAL_ROOT.replace(/\/+$/, "");
  if (base === "/snapshots" || base === "/snapshots/") return root;
  const path = base.startsWith("/snapshots/")
    ? base.replace(/^\/snapshots\//, "")
    : base.replace(/^\/+/, "");
  return `${root}/${path}`;
};

const normalizeUrl = (url, base) => {
  if (!url) return base;
  if (!isServer) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const root = INTERNAL_ROOT.replace(/\/+$/, "");
  const path = url.startsWith("/snapshots/")
    ? url.replace(/^\/snapshots\//, "")
    : url.replace(/^\/+/, "");
  return `${root}/${path}`;
};

const minioBase = normalizeBase(process.env.NEXT_PUBLIC_MINIO_BASE || "http://localhost:9002/gpti-snapshots");

export const CONFIG = {
  // URL du "pointeur" latest.json (MinIO public)
  // ex: http://localhost:9002/gpti-snapshots/universe_v0.1_public/_public/latest.json
  LATEST_URL: normalizeUrl(
    process.env.NEXT_PUBLIC_LATEST_URL ||
      "http://localhost:9002/gpti-snapshots/universe_v0.1_public/_public/latest.json",
    minioBase
  ),

  // Base MinIO publique (pour construire l'URL du snapshot)
  MINIO_BASE: minioBase,

  BRAND: {
    name: "GTIXT",
    tagline: "The Global Prop Trading Index",
    altTagline: "Institutional Prop Trading Benchmark",
  },
};