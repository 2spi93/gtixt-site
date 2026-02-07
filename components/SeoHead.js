import Head from "next/head";
import { CONFIG } from "../lib/config";

export default function SeoHead({ title, description }) {
  const t = title ? `${title} — ${CONFIG.BRAND.name}` : `${CONFIG.BRAND.name} — ${CONFIG.BRAND.tagline}`;
  const d = description || "Institutional-grade benchmark for prop trading transparency, operational integrity, and risk structure.";
  return (
    <Head>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );
}