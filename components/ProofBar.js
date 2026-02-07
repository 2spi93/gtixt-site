import { dt } from "../lib/format";
import { sha256HexFromText } from "../lib/integrity";
import { useState } from "react";

export default function ProofBar({ pointer, snapshotUrl, rawTextForVerify }) {
  const [status, setStatus] = useState("idle"); // idle | verifying | ok | fail
  const [calc, setCalc] = useState("");

  async function verify() {
    if (!rawTextForVerify) return;
    setStatus("verifying");
    try {
      const h = await sha256HexFromText(rawTextForVerify);
      setCalc(h);
      setStatus(h === pointer.sha256 ? "ok" : "fail");
    } catch {
      setStatus("fail");
    }
  }

  if (!pointer) return null;

  return (
    <div className="proof">
      <div className="proof-row">
        <div className="proof-item"><span className="k">Snapshot</span> <span className="mono">{pointer.object}</span></div>
        <div className="proof-item"><span className="k">Created</span> {dt(pointer.created_at)}</div>
        <div className="proof-item"><span className="k">SHA256</span> <span className="mono">{pointer.sha256}</span></div>
        <div className="proof-item"><span className="k">URL</span> <a className="mono" href={snapshotUrl} target="_blank" rel="noreferrer">open</a></div>
        <button className="btn btn-primary" onClick={verify} disabled={!rawTextForVerify || status==="verifying"}>
          {status === "verifying" ? "Verifying…" : "Verify Integrity"}
        </button>
      </div>

      {status !== "idle" && (
        <div className={`proof-status ${status}`}>
          {status === "ok" && "Integrity OK (sha256 match)."}
          {status === "fail" && (
            <span>
              Integrity FAIL. Calculated: <span className="mono">{calc || "—"}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}