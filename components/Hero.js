import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero({ meta }) {
  return (
    <div className="card cardPad" style={{ padding: 18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <Image src="/brand/logo-icon.svg" alt="GTIXT" width={28} height={28} />
            <span className="chip">Institutional Benchmark</span>
            <span className="chip chipOk">Public Snapshot</span>
          </div>

          <h1 className="h1">GTIXT — The Global Prop Trading Index</h1>
          <p className="sub">
            The world's first institutional benchmark for prop trading transparency,
            risk integrity, and payout reliability — rule-based, versioned, auditable.
          </p>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:14 }}>
            <a className="btn btnPrimary" href="#index">View the Index</a>
            <Link className="btn btnGhost" href="/integrity">Integrity Center</Link>
            <Link className="btn btnGhost" href="/methodology">Methodology v1.0</Link>
          </div>
        </div>

        <div className="ticker" style={{ minWidth: 320, maxWidth: 420, height: 46, alignSelf:"flex-start" }}>
          <div className="tickerLine">
            <strong>SNAPSHOT</strong><span>{meta?.snapshot_key || "—"}</span>
            <strong>RECORDS</strong><span>{meta?.count ?? "—"}</span>
            <strong>SCORING</strong><span>{meta?.version_key || "v1.0"}</span>
            <strong>AS OF</strong><span>{meta?.created_at || "—"}</span>
            <strong>INTEGRITY</strong><span>SHA256</span>
            <strong>EXPORT</strong><span>CSV</span>
          </div>
        </div>
      </div>
    </div>
  );
}