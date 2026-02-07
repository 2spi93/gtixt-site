// components/VerifyButton.jsx
import { useState } from "react";
import { verifySnapshotIntegrity } from "../lib/integrity";

export default function VerifyButton({ latestUrl, baseBucketUrl, onResult }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setLoading(true);
    setMsg("");
    try {
      const res = await verifySnapshotIntegrity({ latestUrl, baseBucketUrl });
      onResult?.(res);
      setMsg(res.ok ? "Integrity verified." : "Integrity mismatch.");
    } catch (e) {
      setMsg(e?.message || "Verification failed.");
      onResult?.({ ok: false, error: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verifyRow">
      <button className="btn btn-primary" onClick={run} disabled={loading}>
        {loading ? "Verifying…" : "Verify Integrity"}
      </button>
      <div className="verifyMsg">{msg}</div>
    </div>
  );
}