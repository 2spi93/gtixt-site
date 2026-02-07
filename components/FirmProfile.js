import PillarBars from "./PillarBars";
import MetricGrid from "./MetricGrid";
import Tag from "./Tag";
import { num, pct } from "../lib/format";

export default function FirmProfile({ firm }) {
  if (!firm) return null;

  return (
    <div className="grid-2">
      <div className="card">
        <div className="h2">{firm.brand_name || firm.firm_id}</div>
        <div className="muted mono">{firm.website_root}</div>

        <div className="kpi-row">
          <div className="kpi">
            <div className="k">Score</div>
            <div className="v mono">{num(firm.score_0_100, 1)}</div>
          </div>
          <div className="kpi">
            <div className="k">Confidence</div>
            <div className="v"><Tag tone={firm.confidence}>{firm.confidence}</Tag></div>
          </div>
          <div className="kpi">
            <div className="k">NA rate</div>
            <div className="v mono">{pct(firm.na_rate, 1)}</div>
          </div>
        </div>

        <PillarBars pillarScores={firm.pillar_scores} />
      </div>

      <div className="card">
        <div className="h3">Audit Reasons (Oversight Gate)</div>
        <pre className="mono pre">{JSON.stringify(firm.reasons || {}, null, 2)}</pre>

        <div className="h3" style={{ marginTop: 16 }}>Metric Detail</div>
        <MetricGrid metricScores={firm.metric_scores} />
      </div>
    </div>
  );
}