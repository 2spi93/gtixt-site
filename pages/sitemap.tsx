import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

type NavSection = {
  title: string;
  items: Array<{
    href: string;
    label: string;
    description: string;
    icon: string;
  }>;
};

export default function SiteMap() {
  const navigation: NavSection[] = [
    {
      title: '🏠 Core Features',
      items: [
        {
          href: '/',
          label: 'Dashboard',
          description: 'Homepage with firm statistics and integrity beacon',
          icon: '📊'
        },
        {
          href: '/rankings',
          label: 'Firm Rankings',
          description: 'View all firms ranked by GTIXT score',
          icon: '🏆'
        },
        {
          href: '/firms',
          label: 'Firms Directory',
          description: 'Browse and search all institutional firms',
          icon: '🏢'
        },
        {
          href: '/firm',
          label: 'Firm Details',
          description: 'Detailed view of individual firm profiles',
          icon: '📋'
        }
      ]
    },
    {
      title: '📚 Documentation & Methodology',
      items: [
        {
          href: '/methodology',
          label: 'Methodology v1.0',
          description: 'Learn the 5-pillar scoring framework and specs',
          icon: '📖'
        },
        {
          href: '/whitepaper',
          label: 'Technical Whitepaper',
          description: 'Complete specification and scoring algorithms',
          icon: '📄'
        },
        {
          href: '/docs/getting-started',
          label: 'Getting Started',
          description: 'Quick introduction to GTIXT platform',
          icon: '🚀'
        },
        {
          href: '/docs/faq',
          label: 'FAQ',
          description: 'Frequently asked questions answered',
          icon: '❓'
        },
        {
          href: '/docs/api-v1',
          label: 'API Documentation',
          description: 'RESTful API reference and examples',
          icon: '🔌'
        }
      ]
    },
    {
      title: '🔐 Integrity & Verification',
      items: [
        {
          href: '/integrity',
          label: 'Integrity Center',
          description: 'Verify snapshots and check SHA-256 digests',
          icon: '🛡️'
        },
        {
          href: '/audit-trails',
          label: 'Audit Trails',
          description: 'View complete audit trail of all operations',
          icon: '📋'
        },
        {
          href: '/validation',
          label: 'Data Validation',
          description: 'Real-time data quality validation results',
          icon: '✅'
        },
        {
          href: '/reproducibility-demo',
          label: 'Reproducibility',
          description: 'Demonstrate reproducible and verifiable results',
          icon: '🔄'
        }
      ]
    },
    {
      title: '🌍 Governance & Context',
      items: [
        {
          href: '/governance',
          label: 'Governance Model',
          description: 'How GTIXT is governed and maintained',
          icon: '⚖️'
        },
        {
          href: '/regulatory-timeline',
          label: 'Regulatory Timeline',
          description: 'Key regulatory milestones and dates',
          icon: '📅'
        },
        {
          href: '/roadmap',
          label: 'Roadmap',
          description: 'Future features and development plans',
          icon: '🗺️'
        },
        {
          href: '/manifesto',
          label: 'Manifesto',
          description: 'Our mission and core values',
          icon: '📢'
        }
      ]
    },
    {
      title: '📊 Analysis & Reports',
      items: [
        {
          href: '/data',
          label: 'Data Explorer',
          description: 'Interactive data exploration and filtering',
          icon: '🔎'
        },
        {
          href: '/reports',
          label: 'Report Center',
          description: 'Downloadable reports and analyses',
          icon: '📑'
        },
        {
          href: '/agents-dashboard',
          label: 'Agent Dashboard',
          description: 'Monitor AI agents and background processes',
          icon: '🤖'
        }
      ]
    },
    {
      title: '⚖️ Legal & Policy',
      items: [
        {
          href: '/terms',
          label: 'Terms of Service',
          description: 'Terms and conditions for using GTIXT',
          icon: '📜'
        },
        {
          href: '/privacy',
          label: 'Privacy Policy',
          description: 'How we handle your data and privacy',
          icon: '🔒'
        },
        {
          href: '/disclaimer',
          label: 'Disclaimer',
          description: 'Important disclaimers and limitations',
          icon: '⚠️'
        }
      ]
    },
    {
      title: '👥 Company',
      items: [
        {
          href: '/team',
          label: 'Our Team',
          description: 'Meet the GTIXT team members',
          icon: '👨‍💼'
        },
        {
          href: '/careers',
          label: 'Careers',
          description: 'Join our team - open positions',
          icon: '💼'
        },
        {
          href: '/about',
          label: 'About',
          description: 'Company history and mission',
          icon: 'ℹ️'
        },
        {
          href: '/contact',
          label: 'Contact',
          description: 'Get in touch with the GTIXT team',
          icon: '✉️'
        }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>GTIXT - Site Map & Navigation</title>
        <meta name="description" content="Complete map of GTIXT website sections and pages" />
      </Head>

      <main style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>🗺️ GTIXT Site Map</h1>
          <p style={styles.subtitle}>Complete navigation guide to all sections</p>
        </header>

        <div style={styles.grid}>
          {navigation.map((section, idx) => (
            <section key={idx} style={styles.section}>
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              
              <div style={styles.itemsGrid}>
                {section.items.map((item, itemIdx) => (
                  <Link key={itemIdx} href={item.href}>
                    <a style={styles.card}>
                      <div style={styles.cardIcon}>{item.icon}</div>
                      <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}>{item.label}</h3>
                        <p style={styles.cardDesc}>{item.description}</p>
                      </div>
                      <div style={styles.cardArrow}>→</div>
                    </a>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer style={styles.footer}>
          <p>Last updated: February 27, 2026</p>
          <p style={styles.footerMuted}>16 pages • 150+ endpoints • Fully documented</p>
        </footer>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
    paddingBottom: '40px',
    borderBottom: '2px solid #e5e7eb'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#111827'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: 0
  },
  grid: {
    display: 'grid',
    gap: '60px',
    marginBottom: '60px'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  } as React.CSSProperties,
  cardIcon: {
    fontSize: '28px',
    minWidth: '40px',
    textAlign: 'center'
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#1f2937'
  },
  cardDesc: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0
  },
  cardArrow: {
    fontSize: '18px',
    color: '#d1d5db',
    transition: 'transform 0.2s ease, color 0.2s ease'
  },
  footer: {
    textAlign: 'center',
    paddingTop: '40px',
    borderTop: '2px solid #e5e7eb',
    color: '#6b7280'
  },
  footerMuted: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '5px 0 0 0'
  }
};
