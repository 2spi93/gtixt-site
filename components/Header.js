import Link from "next/link";
import Image from "next/image";
import ModeToggle from "./ModeToggle";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-row">
        <Link href="/" className="brand">
          <Image src="/brand/logo.svg" alt="GTIXT" className="brand-logo" width={120} height={32} />
        </Link>

        <nav className="nav">
          <Link href="/index-live">Index</Link>
          <Link href="/firms">Firms</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/api">API</Link>
          <Link href="/governance">Governance</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/integrity">Integrity</Link>
        </nav>

        <div className="header-actions">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}