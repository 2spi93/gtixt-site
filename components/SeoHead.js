import Head from "next/head";
import { CONFIG } from "../lib/config";
import { buildLegacySeo } from "../lib/seo";

/**
 * @param {{
 *   title?: string,
 *   description?: string,
 *   path?: string,
 *   canonicalPath?: string,
 *   noIndex?: boolean,
 *   type?: 'website' | 'article'
 * }} props
 */
export default function SeoHead({
  title,
  description,
  path = "/",
  canonicalPath = undefined,
  noIndex = false,
  type = "website",
}) {
  const resolvedTitle = title || `${CONFIG.BRAND.name} — ${CONFIG.BRAND.tagline}`;
  const d = description || "Institutional-grade benchmark for prop trading transparency, operational integrity, and risk structure.";
  const seo = buildLegacySeo({
    title: resolvedTitle,
    description: d,
    path,
    canonicalPath,
    noIndex,
    type,
  });

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={seo.url} />
      <meta property="og:site_name" content={CONFIG.BRAND.name} />
      <meta property="og:type" content={seo.openGraphType} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.url} />
      <meta name="twitter:card" content={seo.twitterCard} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Head>
  );
}