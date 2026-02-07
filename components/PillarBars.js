import { num } from "../lib/format";

export default function PillarBars({ pillarScores }) {
  if (!pillarScores) return null;

  const pillars = Object.entries(pillarScores).map(([key, value]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    score: value,
    pct: Math.round(value * 100)
  }));

  return (
    <div className="pillar-bars">
      {pillars.map(pillar => (
        <div key={pillar.name} className="pillar-bar">
          <div className="pillar-label">
            <span className="mono">{pillar.name}</span>
            <span className="mono">{num(pillar.score, 2)}</span>
          </div>
          <div className="bar-bg">
            <div
              className="bar-fill"
              style={{ width: `${pillar.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}