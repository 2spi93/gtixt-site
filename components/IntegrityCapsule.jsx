// components/IntegrityCapsule.jsx
import { shortHash } from "../lib/integrity";

export default function IntegrityCapsule({ latest, status }) {
  const sha = latest?.sha256 || "";
  const created = latest?.created_at ? new Date(latest.created_at) : null;

  return (
    <div className="capsule">
      <div className="capsuleTop">
        <div>
          <div className="capsuleKicker">Integrity Beacon</div>
          <div className="capsuleTitle">Public Snapshot Pointer</div>
        </div>
        <div className={`pill pill-${status}`}>
          {status === "verified" ? "VERIFIED" : status === "failed" ? "MISMATCH" : "LIVE"}
        </div>
      </div>

      <div className="kv">
        <div className="k">Object</div>
        <div className="v mono">{latest?.object || "—"}</div>

        <div className="k">SHA256</div>
        <div className="v mono">{sha ? shortHash(sha, 10) : "—"}</div>

        <div className="k">Records</div>
        <div className="v">{typeof latest?.count === "number" ? latest.count : "—"}</div>

        <div className="k">Updated</div>
        <div className="v">{created ? created.toUTCString() : "—"}</div>
      </div>

      <div className="capsuleHint">
        Proof-first benchmark: quality-gated (Oversight Gate) + integrity verifiable.
      </div>
    </div>
  );
}