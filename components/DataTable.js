import Link from "next/link";
import Tag from "./Tag";
import { num, pct } from "../lib/format";

export default function DataTable({ records }) {
  if (!records?.length) return <div className="card">No records.</div>;

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Firm</th>
              <th>Score</th>
              <th>Confidence</th>
              <th>NA rate</th>
              <th>Model</th>
              <th>Jurisdiction</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={r.firm_id}>
                <td className="mono">{idx + 1}</td>
                <td>
                  <Link className="link" href={`/firm?id=${encodeURIComponent(r.firm_id)}`}>
                    {r.brand_name || r.firm_id}
                  </Link>
                  <div className="muted small mono">{r.website_root}</div>
                </td>
                <td className="mono">{num(r.score_0_100, 1)}</td>
                <td><Tag tone={r.confidence}>{r.confidence || "—"}</Tag></td>
                <td className="mono">{pct(r.na_rate, 1)}</td>
                <td className="mono">{r.model_type || "—"}</td>
                <td className="mono">{r.jurisdiction || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}