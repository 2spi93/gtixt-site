/**
 * Page Navigation Component
 * Provides consistent navigation buttons across all data pages
 */

import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';

interface NavButton {
  href: string;
  label: string;
  icon?: string;
  category?: string;
}

interface NavCategory {
  label: string;
  icon: string;
  items: NavButton[];
}

const navigationCategories: NavCategory[] = [
  {
    label: 'Core',
    icon: '⭐',
    items: [
      { href: '/', label: 'Accueil', icon: '🏠' },
      { href: '/rankings', label: 'Rankings', icon: '📋' },
      { href: '/integrity', label: 'Integrity Center', icon: '🔐' },
    ]
  },
  {
    label: 'Documentation',
    icon: '📚',
    items: [
      { href: '/methodology', label: 'Methodology v1.0', icon: '📖' },
      { href: '/whitepaper', label: 'Whitepaper', icon: '📄' },
      { href: '/docs', label: 'Docs & FAQ', icon: '❓' },
      { href: '/api-docs', label: 'API Docs', icon: '🔌' },
    ]
  },
  {
    label: 'Data & Analysis',
    icon: '📊',
    items: [
      { href: '/data', label: 'Raw Data', icon: '💾' },
      { href: '/agents-dashboard', label: 'Agents Dashboard', icon: '🤖' },
      { href: '/phase2', label: 'Phase 2 Analytics', icon: '📈' },
    ]
  },
  {
    label: 'About',
    icon: 'ℹ️',
    items: [
      { href: '/about', label: 'About GTIXT', icon: '🏢' },
      { href: '/governance', label: 'Governance', icon: '⚖️' },
      { href: '/roadmap', label: 'Roadmap', icon: '🗺️' },
      { href: '/blog', label: 'Blog', icon: '✍️' },
    ]
  }
];

// Flatten for dropdown compatibility
const navigationButtons: NavButton[] = navigationCategories.flatMap(cat => cat.items);

interface PageNavigationProps {
  currentPage?: string;
  customButtons?: NavButton[];
}

export default function PageNavigation({ currentPage, customButtons }: PageNavigationProps) {
  const router = useRouter();
  
  const buttons = customButtons || navigationButtons;
  const currentValue = currentPage || router.pathname;
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next && next !== router.pathname) {
      router.push(next);
    }
  };
  
  return (
    <div className="page-navigation">
      <h3 className="nav-title">🧭 Navigation</h3>
      
      {/* Mobile dropdown */}
      <select
        id="page-nav-select"
        className="nav-select"
        value={currentValue}
        onChange={handleSelectChange}
        aria-label="Select a page"
      >
        {navigationCategories.map((category) => (
          <optgroup key={category.label} label={`${category.icon} ${category.label}`}>
            {category.items.map((button) => (
              <option key={button.href} value={button.href}>
                {button.icon} {button.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Desktop categorized view */}
      <div className="nav-categories">
        {navigationCategories.map((category) => (
          <div key={category.label} className="nav-category">
            <div className="category-header">
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </div>
            <div className="category-items">
              {category.items.map((button) => {
                const isActive = router.pathname === button.href || currentPage === button.href;
                return (
                  <Link
                    key={button.href}
                    href={button.href}
                    className={`nav-button ${isActive ? 'active' : ''}`}
                  >
                    {button.icon && <span className="nav-icon">{button.icon}</span>}
                    <span className="nav-label">{button.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .page-navigation {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .nav-title {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          text-align: center;
          letter-spacing: 0.5px;
        }
        
        .nav-select {
          display: none;
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: rgba(7, 11, 20, 0.75);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.02em;
          margin-bottom: 1rem;
          cursor: pointer;
        }

        .nav-select optgroup {
          background: rgba(7, 11, 20, 0.95);
          color: #a78bfa;
          font-weight: 700;
          padding: 0.5rem;
        }

        .nav-select option {
          background: rgba(7, 11, 20, 0.95);
          color: white;
          padding: 0.5rem;
        }

        .nav-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .nav-category {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .category-icon {
          font-size: 1.25rem;
        }

        .category-label {
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .category-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .nav-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        
        .nav-button:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .nav-button.active {
          background: rgba(255, 255, 255, 0.95);
          color: #667eea;
          border-color: white;
          font-weight: 700;
        }
        
        .nav-icon {
          font-size: 1.1rem;
          line-height: 1;
        }
        
        .nav-label {
          font-size: 0.9rem;
          line-height: 1;
        }
        
        @media (max-width: 768px) {
          .nav-categories {
            display: none;
          }

          .nav-select {
            display: block;
          }

          .nav-title {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 1024px) {
          .nav-categories {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
          }

          .nav-category {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
