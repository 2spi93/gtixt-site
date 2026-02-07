import React, { ReactNode } from "react";
import InstitutionalHeader, { BreadcrumbItem } from "./InstitutionalHeader";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function Layout({ children, breadcrumbs }: LayoutProps) {
  return (
    <div style={styles.root}>
      <InstitutionalHeader breadcrumbs={breadcrumbs} />
      <main id="main-content" style={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
  },
};
