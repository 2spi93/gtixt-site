import { dt } from "../lib/format";

export default function IndexTape({ pointer }) {
  if (!pointer) return null;
  return (
    <div className="tape">
      <div className="tape-item"><span className="k">Latest:</span> {dt(pointer.created_at)}</div>
      <div className="tape-item"><span className="k">Records:</span> {pointer.count ?? "—"}</div>
      <div className="tape-item"><span className="k">SHA256:</span> <span className="mono">{pointer.sha256?.slice(0,16)}…</span></div>
    </div>
  );
}