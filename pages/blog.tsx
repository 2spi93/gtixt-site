'use client';

import Head from "next/head";
import Link from "next/link";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useIsMounted } from "../lib/useIsMounted";
import { useState } from "react";
import { useTranslation } from "../lib/useTranslationStub";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  readTime: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Introducing GTIXT: Institutional Benchmarking for Proprietary Trading",
    date: "2026-01-28",
    excerpt:
      "GTIXT launches as the first public, deterministic benchmark for proprietary trading transparency. Learn about our methodology and governance framework.",
    category: "Announcement",
    readTime: "8 min read",
    featured: true,
  },
  {
    id: "2",
    title: "The Five-Pillar Framework: Evaluating Trading Firm Integrity",
    date: "2026-01-21",
    excerpt:
      "Deep dive into GTIXT's five institutional pillars for assessing transparency, payout reliability, risk models, legal compliance, and reputation.",
    category: "Methodology",
    readTime: "12 min read",
  },
  {
    id: "3",
    title: "Cryptographic Verification: Why Immutability Matters",
    date: "2026-01-14",
    excerpt:
      "Explore how SHA-256 hashing and versioned snapshots create an audit-ready, transparent data infrastructure for institutional benchmarking.",
    category: "Integrity",
    readTime: "10 min read",
  },
  {
    id: "4",
    title: "2025 Proprietary Trading Industry Snapshot",
    date: "2026-01-07",
    excerpt:
      "Annual analysis of transparency, regulatory compliance, and risk management trends across the global proprietary trading ecosystem.",
    category: "Research",
    readTime: "15 min read",
  },
  {
    id: "5",
    title: "Confidence Scoring: Navigating Evidence Quality in Institutional Benchmarking",
    date: "2025-12-28",
    excerpt:
      "How GTIXT quantifies data quality and evidence completeness to establish confidence levels (High/Medium/Low) for each firm evaluation.",
    category: "Methodology",
    readTime: "11 min read",
  },
  {
    id: "6",
    title: "Governance & Independence: Institutional Standards for GTIXT",
    date: "2025-12-14",
    excerpt:
      "GTIXT operates under strict governance principles. This article outlines our Board, Methodology Committee, and quality assurance standards.",
    category: "Governance",
    readTime: "9 min read",
  },
];

const categoryColors: Record<string, string> = {
  "Announcement": "#2F81F7",
  "Methodology": "#3FB950",
  "Integrity": "#F0A500",
  "Research": "#D64545",
  "Governance": "#2F81F7",
};

export default function BlogPage() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [displayedCount, setDisplayedCount] = useState<number>(3);

  const categories = ["All", "Announcement", "Methodology", "Integrity", "Research", "Governance"];
  
  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const displayedPosts = filteredPosts.slice(0, displayedCount);
  const hasMore = displayedCount < filteredPosts.length;

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <>
      <Head>
        <title>Blog & Research — GTIXT</title>
        <meta 
          name="description" 
          content="Institutional analysis, research, and insights on proprietary trading transparency, benchmarking methodology, and market structure." 
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [{ label: "Blog", href: "/blog" }] : []}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>Insights & Research</div>
          <h1 style={styles.h1}>Blog & Analysis</h1>
          <p style={styles.lead}>
            Institutional analysis, methodology deep dives, and research on proprietary trading transparency, 
            benchmarking standards, and market structure.
          </p>
        </section>

        {/* Featured Article */}
        {featuredPost && (
          <section style={styles.featuredSection}>
            <h2 style={styles.sectionTitle}>Featured Article</h2>
            <Link href={`/blog/${featuredPost.id}`} style={styles.featuredCard}>
              <div style={styles.featuredMeta}>
                <span 
                  style={{
                    ...styles.categoryBadge,
                    backgroundColor: `${categoryColors[featuredPost.category]}15`,
                    color: categoryColors[featuredPost.category],
                  }}
                >
                  {featuredPost.category}
                </span>
                <span style={styles.date}>
                  {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <span style={styles.readTime}>{featuredPost.readTime}</span>
              </div>
              <h3 style={styles.featuredTitle}>{featuredPost.title}</h3>
              <p style={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
              <div style={styles.ctaArrow}>Read full article →</div>
            </Link>
          </section>
        )}

        {/* Categories */}
        <section style={styles.categoriesSection}>
          <div style={styles.categoryFilter}>
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => {
                  setSelectedCategory(cat);
                  setDisplayedCount(3);
                }}
                style={{
                  ...styles.categoryBtn,
                  backgroundColor: cat === selectedCategory ? "#2F81F7" : "#1E2630",
                  color: cat === selectedCategory ? "#0B0E11" : "#C9D1D9",
                  borderColor: cat === selectedCategory ? "#2F81F7" : "#2F81F7",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section style={styles.postsSection}>
          <div style={styles.postsGrid}>
            {displayedPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.id}`} 
                style={styles.articleCard}
              >
                <div 
                  style={{
                    ...styles.cardMeta,
                    borderLeftColor: categoryColors[post.category] || "#2F81F7",
                  }}
                >
                  <span 
                    style={{
                      ...styles.categoryBadge,
                      backgroundColor: `${categoryColors[post.category]}20`,
                      color: categoryColors[post.category],
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={styles.date}>
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>

                <h3 style={styles.postTitle}>{post.title}</h3>

                <p style={styles.excerpt}>{post.excerpt}</p>

                <div style={styles.cardFooter}>
                  <span style={styles.readTime}>{post.readTime}</span>
                  <span style={styles.readMore}>Read →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={styles.loadMoreContainer}>
              <button
                onClick={() => setDisplayedCount(displayedCount + 3)}
                style={styles.loadMoreBtn}
              >
                Load More Articles
              </button>
            </div>
          )}

          {displayedPosts.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No articles in this category yet.</p>
            </div>
          )}
        </section>

        {/* Newsletter */}
        <section style={styles.newsletterSection}>
          <h2 style={styles.newsletterTitle}>Stay Updated</h2>
          <p style={styles.newsletterLead}>
            Get the latest GTIXT research, methodology updates, and institutional insights delivered to your inbox.
          </p>

          <form style={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@institution.com"
              style={styles.input}
              required
            />
            <button type="submit" style={styles.subscribeBtn}>
              Subscribe
            </button>
          </form>

          <p style={styles.newsletterNote}>
            We respect your privacy. Unsubscribe at any time.
          </p>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h3 style={styles.ctaTitle}>Explore GTIXT</h3>
          <p style={styles.ctaText}>
            Discover the complete institutional framework behind GTIXT.
          </p>
          <div style={styles.ctaButtons}>
            <Link href="/methodology" style={{...styles.button, ...styles.buttonPrimary}}>
              📚 Methodology
            </Link>
            <Link href="/integrity" style={{...styles.button, ...styles.buttonSecondary}}>
              🔐 Integrity
            </Link>
            <Link href="/governance" style={{...styles.button, ...styles.buttonSecondary}}>
              ⚖️ Governance
            </Link>
            <Link href="/api-docs" style={{...styles.button, ...styles.buttonSecondary}}>
              🔌 API Docs
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0B0E11",
    color: "#C9D1D9",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "0",
  },
  hero: {
    backgroundColor: "#11161C",
    padding: "80px 20px",
    borderBottom: "1px solid #2F81F7",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#2F81F7",
    marginBottom: "16px",
  },
  h1: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
    lineHeight: "1.1",
  },
  lead: {
    fontSize: "16px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "0",
    maxWidth: "900px",
    margin: "0 auto",
  },
  featuredSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 20px",
    borderBottom: "1px solid #2F81F7",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2F81F7",
    marginBottom: "24px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  featuredCard: {
    display: "block",
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "40px",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.3s ease",
  },
  featuredMeta: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  categoryBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  date: {
    fontSize: "13px",
    color: "#8B949E",
  },
  readTime: {
    fontSize: "13px",
    color: "#8B949E",
  },
  featuredTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
    lineHeight: "1.3",
  },
  featuredExcerpt: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.7",
    marginBottom: "20px",
  },
  ctaArrow: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2F81F7",
  },
  categoriesSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 20px 0",
  },
  categoryFilter: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "40px",
  },
  categoryBtn: {
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: "700",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  postsSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 20px 60px",
    borderBottom: "1px solid #2F81F7",
  },
  postsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },
  articleCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },
  cardMeta: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #2F81F7",
    flexWrap: "wrap",
  },
  postTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
    lineHeight: "1.4",
  },
  excerpt: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "auto",
    paddingBottom: "16px",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    color: "#8B949E",
  },
  readMore: {
    color: "#2F81F7",
    fontWeight: "600",
  },
  loadMoreContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  },
  loadMoreBtn: {
    padding: "14px 32px",
    fontSize: "14px",
    fontWeight: "700",
    backgroundColor: "#1E2630",
    color: "#2F81F7",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyStateText: {
    fontSize: "16px",
    color: "#8B949E",
  },
  newsletterSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 20px",
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "16px",
    textAlign: "center",
  },
  newsletterTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  newsletterLead: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.7",
    marginBottom: "32px",
  },
  newsletterForm: {
    display: "flex",
    gap: "12px",
    maxWidth: "500px",
    margin: "0 auto 20px",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    padding: "12px 16px",
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    color: "#C9D1D9",
    fontSize: "14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  subscribeBtn: {
    padding: "12px 32px",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  newsletterNote: {
    fontSize: "12px",
    color: "#8B949E",
    marginTop: "12px",
  },
  ctaSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  ctaText: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  ctaButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    display: "inline-block",
    padding: "14px 28px",
    fontSize: "14px",
    fontWeight: "600",
    border: "1px solid transparent",
    borderRadius: "8px",
    textDecoration: "none",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  buttonPrimary: {
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
  },
  buttonSecondary: {
    backgroundColor: "#1E2630",
    color: "#C9D1D9",
    border: "1px solid #2F81F7",
  },
};
