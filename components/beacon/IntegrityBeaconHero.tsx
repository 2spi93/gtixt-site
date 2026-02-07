import { useEffect, useState } from "react";
import BeaconBackdrop from "./BeaconBackdrop";
import BeaconBeam from "./BeaconBeam";
import BeaconTicker from "./BeaconTicker";
import ProofPanel from "./ProofPanel";
import { fetchLatestPointer, fetchSnapshotJson } from "../../lib/snapshot";
import { sha256Hex } from "../../lib/crypto";

export default function IntegrityBeaconHero() {
  const [pointer, setPointer] = useState<any>(null);
  const [verifyState, setVerifyState] = useState<"idle"|"verifying"|"ok"|"fail">("idle");
  const [verifyDetail, setVerifyDetail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await fetchLatestPointer();
      setPointer(p);
    })();
  }, []);

  const headline = "GTIXT — The Global Prop Trading Index";
  const sub = "The world's first institutional benchmark for prop trading transparency, risk integrity, and payout reliability — rule-based, versioned, auditable.";

  async function onVerify() {
    if (!pointer?.object || !pointer?.sha256) return;
    setVerifyState("verifying");
    setVerifyDetail("");

    try {
      const snap = await fetchSnapshotJson(pointer.object);
      const raw = new TextEncoder().encode(JSON.stringify(snap));
      const got = await sha256Hex(raw);
      const ok = got.toLowerCase() === String(pointer.sha256).toLowerCase();
      setVerifyState(ok ? "ok" : "fail");
      setVerifyDetail(ok ? `SHA256 match: ${got.slice(0, 16)}…` : `Mismatch: got ${got.slice(0, 16)}…`);
    } catch (e: any) {
      setVerifyState("fail");
      setVerifyDetail(e?.message ?? "Verification failed");
    }
  }

  return (
    <section className="beacon-hero">
      <BeaconBackdrop />
      <BeaconBeam />

      <div className="beacon-shell">
        <header className="beacon-top">
          <div className="brand">
            <div className="mark">GTIXT</div>
            <div className="tag">Institutional Benchmark</div>
          </div>
          <a className="ghost-btn" href="#integrity">Integrity Center →</a>
        </header>

        <div className="beacon-card">
          <div className="badges">
            <span className="pill">Public Snapshot</span>
            <span className="pill subtle">Scoring v1.0</span>
            <span className="pill subtle">Oversight Gate Quality Gate</span>
          </div>

          <h1>{headline}</h1>
          <p className="sub">{sub}</p>

          <div className="cta-row">
            <a className="primary" href="#index">View the Index</a>
            <a className="secondary" href="#integrity">Integrity Center</a>
            <a className="tertiary" href="#methodology">Methodology v1.0</a>
          </div>

          <BeaconTicker pointer={pointer} />
          <ProofPanel
            pointer={pointer}
            verifyState={verifyState}
            verifyDetail={verifyDetail}
            onVerify={onVerify}
          />
        </div>
      </div>
    </section>
  );
}