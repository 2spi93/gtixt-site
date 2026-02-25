import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface InstitutionalHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export default function InstitutionalHeader({ breadcrumbs }: InstitutionalHeaderProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isMounted = useIsMounted();
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("gpti_lang") || i18n.language || "en";
    }
    return i18n.language || "en";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const desktopLangButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileLangButtonRef = useRef<HTMLButtonElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const [langMenuPosition, setLangMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const savedLang = typeof window !== "undefined" ? window.localStorage.getItem("gpti_lang") : null;
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [i18n]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!langMenuOpen) return;
      const button = isMobile ? mobileLangButtonRef.current : desktopLangButtonRef.current;
      const menu = langMenuRef.current;
      if (menu && menu.contains(target)) return;
      if (button && button.contains(target)) return;
      if (!target.closest("[data-lang-toggle]")) {
        setLangMenuOpen(false);
      }
    };

    if (langMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [langMenuOpen, isMobile]);

  useEffect(() => {
    if (!langMenuOpen) return;
    const updatePosition = () => {
      const button = isMobile ? mobileLangButtonRef.current : desktopLangButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = isMobile ? 160 : 200;
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - menuWidth - 12);
      const top = rect.bottom + 8;
      setLangMenuPosition({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [langMenuOpen, isMobile]);
  
  const isActive = (path: string) => {
    if (path === "/") return router.pathname === "/";
    return router.pathname.startsWith(path);
  };

  const NAV_FALLBACKS: Record<string, string> = {
    "nav.index": "Index",
    "nav.rankings": "Rankings",
    "nav.data": "Data",
    "nav.agents": "Agents",
    "nav.phase2": "Phase 2",
    "nav.integrity": "Integrity",
    "nav.methodology": "Methodology",
    "nav.roadmap": "Roadmap",
    "nav.api": "API",
    "nav.governance": "Governance",
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.careers": "Careers",
  };

  const navText = (key: string) => (isMounted ? t(key) : NAV_FALLBACKS[key] || key);

  const languages = useMemo(() => ([
    { code: "en", label: t("lang.en"), native: "English" },
    { code: "fr", label: t("lang.fr"), native: "Français" },
    { code: "es", label: t("lang.es"), native: "Español" },
    { code: "de", label: t("lang.de"), native: "Deutsch" },
    { code: "pt", label: t("lang.pt"), native: "Português" },
    { code: "it", label: t("lang.it"), native: "Italiano" },
  ]), [t]);

  const handleLanguageChange = useCallback((langCode: string) => {
    setCurrentLang(langCode);
    i18n.changeLanguage(langCode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("gpti_lang", langCode);
    }
    setLangMenuOpen(false);
  }, [i18n]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = currentLang;
    }
  }, [currentLang]);

  const langMenuContent = useMemo(() => {
    if (typeof document === "undefined") return null;
    if (!langMenuOpen || !langMenuPosition) return null;
    const menuStyle = isMobile
      ? { ...styles.langDropdown, position: "fixed" as const, top: langMenuPosition.top, left: langMenuPosition.left }
      : { ...styles.langDropdownMenu, position: "fixed" as const, top: langMenuPosition.top, left: langMenuPosition.left };

    return createPortal(
      <div ref={langMenuRef} style={menuStyle}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleLanguageChange(lang.code)}
            style={
              currentLang === lang.code
                ? isMobile
                  ? { ...styles.langDropdownItem, ...styles.langDropdownItemActive }
                  : { ...styles.langDropdownOption, ...styles.langDropdownOptionActive }
                : isMobile
                  ? styles.langDropdownItem
                  : styles.langDropdownOption
            }
          >
            <span>{lang.native}</span>
            {!isMobile && currentLang === lang.code && <span style={{ marginLeft: "auto" }}>✓</span>}
          </button>
        ))}
      </div>,
      document.body
    );
  }, [langMenuOpen, langMenuPosition, isMobile, currentLang, languages, handleLanguageChange]);

  return (
    <>
      {/* Primary Navigation */}
      <header style={styles.header}>
        <div style={styles.container}>
          <Link href="/" style={styles.brand}>
            <span style={styles.brandName}>GPTI</span>
            <span style={styles.brandSuffix}>XT</span>
          </Link>

          {!isMobile && (
            <div style={styles.rightGroup}>
              <nav style={styles.nav} aria-label="Primary">
                <Link href="/rankings" style={isActive("/rankings") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.index")}
                </Link>
                <Link href="/rankings" style={isActive("/rankings") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.rankings")}
                </Link>
                <Link href="/data" style={isActive("/data") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.data")}
                </Link>
                <Link href="/agents-dashboard" style={isActive("/agents-dashboard") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.agents")}
                </Link>
                <Link href="/phase2" style={isActive("/phase2") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.phase2")}
                </Link>
                <Link href="/integrity" style={isActive("/integrity") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.integrity")}
                </Link>
                <Link href="/methodology" style={isActive("/methodology") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.methodology")}
                </Link>
                <Link href="/roadmap" style={isActive("/roadmap") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.roadmap")}
                </Link>
                <Link href="/api-docs" style={isActive("/api-docs") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.api")}
                </Link>
                <Link href="/docs" style={isActive("/docs") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  Docs
                </Link>
                <Link href="/governance" style={isActive("/governance") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.governance")}
                </Link>
                <Link href="/whitepaper" style={isActive("/whitepaper") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  Whitepaper
                </Link>
                <Link href="/about" style={isActive("/about") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.about")}
                </Link>
                <Link href="/blog" style={isActive("/blog") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.blog")}
                </Link>
                <Link href="/careers" style={isActive("/careers") ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}>
                  {navText("nav.careers")}
                </Link>
              </nav>

              <div style={styles.langContainer}>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    style={styles.langDropdownButton}
                    aria-haspopup="true"
                    aria-expanded={langMenuOpen}
                    data-lang-toggle
                    ref={desktopLangButtonRef}
                  >
                    <span style={{ marginRight: "0.5rem" }}>🌐</span>
                    {currentLang.toUpperCase()}
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}>▼</span>
                  </button>

                </div>
              </div>
            </div>
          )}

          {isMobile && (
            <div style={styles.mobileControls}>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  style={styles.mobileMenuButton}
                  title="Languages"
                  data-lang-toggle
                  ref={mobileLangButtonRef}
                >
                  {currentLang.toUpperCase()}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={styles.hamburger}
                title="Menu"
              >
                <span style={mobileMenuOpen ? { ...styles.hamburgerLine, ...styles.hamburgerLineActive1 } : styles.hamburgerLine} />
                <span style={mobileMenuOpen ? { ...styles.hamburgerLine, ...styles.hamburgerLineActive2 } : styles.hamburgerLine} />
                <span style={mobileMenuOpen ? { ...styles.hamburgerLine, ...styles.hamburgerLineActive3 } : styles.hamburgerLine} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <nav style={styles.mobileNav} aria-label="Mobile">
          <Link href="/rankings" style={isActive("/rankings") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.index")}
          </Link>
          <Link href="/rankings" style={isActive("/rankings") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.rankings")}
          </Link>
          <Link href="/data" style={isActive("/data") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.data")}
          </Link>
          <Link href="/agents-dashboard" style={isActive("/agents-dashboard") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.agents")}
          </Link>
          <Link href="/phase2" style={isActive("/phase2") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.phase2")}
          </Link>
          <Link href="/integrity" style={isActive("/integrity") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.integrity")}
          </Link>
          <Link href="/methodology" style={isActive("/methodology") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.methodology")}
          </Link>
          <Link href="/roadmap" style={isActive("/roadmap") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.roadmap")}
          </Link>
          <Link href="/api-docs" style={isActive("/api-docs") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.api")}
          </Link>
          <Link href="/docs" style={isActive("/docs") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            Docs
          </Link>
          <Link href="/governance" style={isActive("/governance") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.governance")}
          </Link>
          <Link href="/whitepaper" style={isActive("/whitepaper") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            Whitepaper
          </Link>
          <Link href="/about" style={isActive("/about") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.about")}
          </Link>
          <Link href="/blog" style={isActive("/blog") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.blog")}
          </Link>
          <Link href="/careers" style={isActive("/careers") ? { ...styles.mobileNavLink, ...styles.mobileNavLinkActive } : styles.mobileNavLink}>
            {navText("nav.careers")}
          </Link>
        </nav>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={styles.breadcrumbContainer} suppressHydrationWarning>
          <div style={styles.container}>
            <nav style={styles.breadcrumbNav} aria-label="Breadcrumb">
              <Link href="/" style={styles.breadcrumbLink} suppressHydrationWarning>
                {navText("nav.home")}
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} style={styles.breadcrumbItem}>
                  <span style={styles.breadcrumbSeparator}>›</span>
                  {idx === breadcrumbs.length - 1 ? (
                    <span style={styles.breadcrumbCurrent}>{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} style={styles.breadcrumbLink}>
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}

      {langMenuContent}

      <style jsx>{`
        /* Styles applied via inline styles only */
      `}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "rgba(7, 11, 18, 0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    width: "100%",
    overflow: "visible",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
    width: "100%",
  },
  brand: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: "-0.02em",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  brandName: {
    color: "#00D1C1",
  },
  brandSuffix: {
    color: "#FFFFFF",
    fontWeight: 400,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    flex: 1,
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flex: 1,
    justifyContent: "flex-end",
  },
  navLink: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s",
  },
  navLinkActive: {
    color: "#00D1C1",
    borderBottom: "2px solid #00D1C1",
    paddingBottom: "2px",
  },
  breadcrumbContainer: {
    background: "rgba(15, 23, 42, 0.6)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "0.75rem 0",
    position: "relative",
    zIndex: 10,
  },
  breadcrumbNav: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.6)",
  },
  breadcrumbLink: {
    color: "rgba(255, 255, 255, 0.6)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  langContainer: {
    position: "relative",
    zIndex: 1100,
  },
  langDropdownButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    background: "linear-gradient(135deg, rgba(0, 209, 193, 0.08) 0%, rgba(0, 209, 193, 0.02) 100%)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "6px",
    color: "#00D1C1",
    padding: "0.6rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.05em",
    transition: "all 0.2s ease",
  },
  langDropdownMenu: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    background: "rgba(7, 11, 18, 0.98)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 1200,
    minWidth: "180px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 209, 193, 0.5)",
    backdropFilter: "blur(10px)",
  },
  langDropdownOption: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "0.75rem 1rem",
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.75rem",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    borderBottom: "1px solid rgba(0, 209, 193, 0.1)",
  },
  langDropdownOptionActive: {
    background: "rgba(0, 209, 193, 0.15)",
    color: "#00D1C1",
    fontWeight: 700,
  },
  breadcrumbItem: {
    display: "flex",
    alignItems: "center",
  },
  breadcrumbSeparator: {
    margin: "0 0.5rem",
    color: "rgba(255, 255, 255, 0.3)",
  },
  breadcrumbCurrent: {
    color: "#00D1C1",
    fontWeight: 500,
  },
  // Mobile-specific styles
  mobileControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  mobileMenuButton: {
    background: "linear-gradient(135deg, rgba(0, 209, 193, 0.08) 0%, rgba(0, 209, 193, 0.02) 100%)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "6px",
    color: "#00D1C1",
    padding: "0.5rem 0.8rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.08em",
    transition: "all 0.2s",
  },
  langDropdown: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    background: "rgba(7, 11, 18, 0.98)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 1200,
    minWidth: "140px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 209, 193, 0.5)",
    backdropFilter: "blur(10px)",
  },
  langDropdownItem: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "0.75rem 1rem",
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.75rem",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    borderBottom: "1px solid rgba(0, 209, 193, 0.1)",
  },
  langDropdownItemActive: {
    background: "rgba(0, 209, 193, 0.15)",
    color: "#00D1C1",
    fontWeight: 700,
  },
  hamburger: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "0.5rem",
  },
  hamburgerLine: {
    width: "24px",
    height: "2px",
    background: "#00D1C1",
    transition: "all 0.3s ease",
    display: "block",
  },
  hamburgerLineActive1: {
    transform: "rotate(45deg) translateY(11px)",
  },
  hamburgerLineActive2: {
    opacity: 0,
  },
  hamburgerLineActive3: {
    transform: "rotate(-45deg) translateY(-11px)",
  },
  mobileNav: {
    background: "rgba(7, 11, 18, 0.98)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    padding: "1rem",
  },
  mobileNavLink: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    textDecoration: "none",
    padding: "0.75rem",
    transition: "all 0.2s",
    borderRadius: "4px",
  },
  mobileNavLinkActive: {
    color: "#00D1C1",
    background: "rgba(0, 209, 193, 0.1)",
  },
};
