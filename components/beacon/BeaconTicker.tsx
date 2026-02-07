import { formatISODate } from "../../lib/format";

export default function BeaconTicker({ pointer }: { pointer: any }) {
  const created = pointer?.created_at ? formatISODate(pointer.created_at) : "—";
  const sha = pointer?.sha256 ? String(pointer.sha256).slice(0, 16) + "…" : "—";
  const count = pointer?.count ?? "—";

  return (
    <div className="ticker" role="status" aria-live="polite">
      <span className="ticker-k">LATEST PUBLIC SNAPSHOT</span>
      <span className="ticker-v">{created}</span>
      <span className="dot" />
      <span className="ticker-k">SHA256</span>
      <span className="ticker-v mono">{sha}</span>
      <span className="dot" />
      <span className="ticker-k">RECORDS</span>
      <span className="ticker-v">{count}</span>
    </div>
  );
}