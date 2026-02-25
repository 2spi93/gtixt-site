import Link from "next/link";
import Tag from "./Tag";
import { num, pct } from "../lib/format";

export default function DataTable({ records }) {
  if (!records?.length) return <div className="card">No records.</div>;

  return (
    <div className="card data-table">
      <div className="table-wrap desktop-table">
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

      <div className="mobile-cards">
        {records.map((r, idx) => (
          <div key={r.firm_id} className="mobile-card">
            <div className="mobile-card-header">
              <div className="mono mobile-rank">#{idx + 1}</div>
              <Link className="link mobile-firm" href={`/firm?id=${encodeURIComponent(r.firm_id)}`}>
                {r.brand_name || r.firm_id}
              </Link>
            </div>
            <div className="muted small mono">{r.website_root}</div>
            <div className="mobile-grid">
              <div>
                <div className="mobile-label">Score</div>
                <div className="mono">{num(r.score_0_100, 1)}</div>
              </div>
              <div>
                <div className="mobile-label">Confidence</div>
                <Tag tone={r.confidence}>{r.confidence || "—"}</Tag>
              </div>
              <div>
                <div className="mobile-label">NA rate</div>
                <div className="mono">{pct(r.na_rate, 1)}</div>
              </div>
              <div>
                <div className="mobile-label">Model</div>
                <div className="mono">{r.model_type || "—"}</div>
              </div>
              <div>
                <div className="mobile-label">Jurisdiction</div>
                <div className="mono">{r.jurisdiction || "—"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}