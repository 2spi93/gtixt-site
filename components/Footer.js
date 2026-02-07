export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-row">
        <div className="muted">© {new Date().getFullYear()} GTIXT. All rights reserved.</div>
        <div className="muted">Rules-based • Versioned • Auditable</div>
      </div>
    </footer>
  );
}