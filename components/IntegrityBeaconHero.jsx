// components/IntegrityBeaconHero.jsx
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import IntegrityCapsule from "./IntegrityCapsule";
import VerifyButton from "./VerifyButton";
import IndexPulse from "./IndexPulse";
import WorldGridBg from "./WorldGridBg";
import { fetchLatestPointer, joinObjectUrl } from "../lib/integrity";

export default function IntegrityBeaconHero() {
  // ⚠️ adapte ces 2 URLs à ton MinIO public
  const latestUrl = useMemo(
    () => "http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json",
    []
  );
  const baseBucketUrl = useMemo(
    () => "http://51.210.246.61:9000/gpti-snapshots",
    []
  );

  const [latest, setLatest] = useState(null);
  const [status, setStatus] = useState("live"); // live | verified | failed
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const l = await fetchLatestPointer(latestUrl);
        if (cancelled) return;
        setLatest(l);
        setObjectUrl(joinObjectUrl(baseBucketUrl, l.object));
      } catch {
        // keep minimal UI if offline
      }
    })();
    return () => { cancelled = true; };
  }, [latestUrl, baseBucketUrl]);

  function onVerify(res) {
    if (res?.ok) setStatus("verified");
    else setStatus("failed");
  }

  return (
    <section className="hero">
      <WorldGridBg />

      <div className="heroInner">
        <div className="heroLeft">
          <div className="chips">
            <span className="chip">Institutional Benchmark</span>
            <span className="chip chip-strong">Public Snapshot</span>
            <span className="chip">Scoring v1.0</span>
          </div>

          <h1 className="h1">GTIXT — The Global Prop Trading Index</h1>

          <p className="sub">
            Institutional benchmark for prop trading transparency, risk integrity, and payout reliability —
            rule-based, versioned, auditable.
          </p>

          <div className="ctaRow">
            <Link className="btn btn-primary" href="/#index">View the Index</Link>
            <Link className="btn btn-ghost" href="/integrity">Integrity Center</Link>
            <Link className="btn btn-soft" href="/methodology">Methodology v1.0</Link>
          </div>

          <div className="proofRow">
            <div className="proof">
              <div className="proofK">LATEST</div>
              <div className="proofV mono">{latest?.object || "—"}</div>
            </div>
            <div className="proof">
              <div className="proofK">SHA256</div>
              <div className="proofV mono">{latest?.sha256 || "—"}</div>
            </div>
          </div>

          <IndexPulse />
        </div>

        <div className="heroRight">
          <IntegrityCapsule latest={latest} status={status} />

          <div className="capsuleActions">
            <VerifyButton latestUrl={latestUrl} baseBucketUrl={baseBucketUrl} onResult={onVerify} />

            <div className="dlRow">
              <a className="btn btn-soft" href={latestUrl} target="_blank" rel="noreferrer">
                Download latest.json
              </a>
              <a className="btn btn-soft" href={objectUrl || "#"} target="_blank" rel="noreferrer">
                Download snapshot
              </a>
            </div>

            <div className="capsuleFoot">
              WebCrypto verification works best on HTTPS.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}