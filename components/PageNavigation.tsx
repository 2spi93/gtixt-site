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
}

const navigationButtons: NavButton[] = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/rankings', label: 'Rankings', icon: '📋' },
  { href: '/agents-dashboard', label: 'Tableau de bord Agents', icon: '🤖' },
  { href: '/phase2', label: 'Phase 2', icon: '�' },
  { href: '/data', label: 'Données', icon: '�' },
];

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
      <label className="nav-select-label" htmlFor="page-nav-select">Select a page</label>
      <select
        id="page-nav-select"
        className="nav-select"
        value={currentValue}
        onChange={handleSelectChange}
        aria-label="Select a page"
      >
        {buttons.map((button) => (
          <option key={button.href} value={button.href}>
            {button.label}
          </option>
        ))}
      </select>
      <div className="nav-buttons">
        {buttons.map((button) => {
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
      
      <style jsx>{`
        .page-navigation {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .nav-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }

        .nav-select-label {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .nav-select {
          display: none;
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          background: rgba(7, 11, 20, 0.75);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.02em;
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
          font-size: 1.2rem;
        }
        
        .nav-label {
          font-size: 0.95rem;
        }
        
        @media (max-width: 768px) {
          .nav-buttons {
            display: none;
          }

          .nav-select {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
