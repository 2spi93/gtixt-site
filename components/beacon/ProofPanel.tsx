export default function ProofPanel({
  pointer, verifyState, verifyDetail, onVerify
}: any) {
  const stateLabel =
    verifyState === "idle" ? "Not verified" :
    verifyState === "verifying" ? "Verifying…" :
    verifyState === "ok" ? "Verified" : "Failed";

  return (
    <div className="proof">
      <div className="proof-left">
        <div className="proof-title">Integrity Beacon</div>
        <div className="proof-sub">
          Public data is quality-gated (Oversight Gate). Snapshot integrity is verifiable via SHA256.
        </div>
        <div className={"proof-state " + verifyState}>{stateLabel}</div>
        {verifyDetail ? <div className="proof-detail mono">{verifyDetail}</div> : null}
      </div>

      <div className="proof-actions">
        <button className="secondary" onClick={onVerify} disabled={!pointer?.object || verifyState==="verifying"}>
          Verify integrity →
        </button>
        <a className="ghost" href="#integrity">Open Integrity Center</a>
      </div>
    </div>
  );
}