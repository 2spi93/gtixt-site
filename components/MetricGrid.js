import { num } from "../lib/format";

export default function MetricGrid({ metricScores }) {
  if (!metricScores) return null;

  const metrics = Object.entries(metricScores).map(([key, value]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    score: value
  }));

  return (
    <div className="metric-grid">
      {metrics.map(metric => (
        <div key={metric.name} className="metric-item">
          <span className="metric-name">{metric.name}</span>
          <span className="metric-score mono">{num(metric.score, 2)}</span>
        </div>
      ))}
    </div>
  );
}