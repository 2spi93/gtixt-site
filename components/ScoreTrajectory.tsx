import React from "react";

type ScorePoint = {
  date: string;
  score: number;
};

type ScoreEvent = {
  date: string;
  label: string;
  impact?: number;
};

type Percentiles = {
  universe?: number;
  modelType?: number;
  jurisdiction?: number;
};

type ScoreTrajectoryProps = {
  firmName: string;
  points: ScorePoint[];
  events?: ScoreEvent[];
  percentiles?: Percentiles;
};

export const ScoreTrajectory: React.FC<ScoreTrajectoryProps> = ({
  firmName,
  points,
  events = [],
  percentiles,
}) => {
  if (!points || points.length === 0) {
    return null;
  }

  const scores = points.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.score - first.score;

  const asciiLevels = [100, 95, 90, 85, 80, 75, 70];
  const asciiColumns = points.map((point) => ({
    score: Math.round(point.score),
    label: point.date,
  }));
  const axisLine = `    └${"─".repeat(Math.max(1, asciiColumns.length * 3))}`;
  const asciiRows = asciiLevels.map((level) => {
    let row = `${level.toString().padStart(3, " ")} ┤`;
    asciiColumns.forEach((point, idx) => {
      const hit = Math.abs(point.score - level) <= 2;
      row += hit ? " ● " : "   ";
      if (hit && idx === asciiColumns.length - 1) {
        row += `${point.score} (${point.label})`;
      }
    });
    return row;
  });

  const trendLabel =
    delta > 0
      ? `upward trajectory with a +${delta} improvement`
      : delta < 0
      ? `downward trajectory with a ${delta} change`
      : "stable trajectory with no material change";

  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-[#11171C] p-6">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Score Trajectory
          </p>
          <h3 className="text-sm text-slate-300">
            Evolution of the institutional score for{" "}
            <span className="font-semibold text-[#00D4C2]">{firmName}</span>
          </h3>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>
            From <span className="font-medium text-slate-200">{first.date}</span> to{" "}
            <span className="font-medium text-slate-200">{last.date}</span>
          </p>
          <p>
            Change:{" "}
            <span
              className={
                delta > 0
                  ? "font-semibold text-emerald-400"
                  : delta < 0
                  ? "font-semibold text-rose-400"
                  : "font-semibold text-slate-300"
              }
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          </p>
        </div>
      </header>

      {/* Courbe d’évolution (ASCII premium, lisible partout) */}
      <div className="mb-4 rounded-lg border border-slate-800 bg-[#0A0F12] p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          Courbe d’évolution
        </p>
        <pre className="m-0 whitespace-pre-wrap font-mono text-[11px] leading-5 text-slate-200">
          {asciiRows.join("\n")}
          {"\n"}
          {axisLine}
        </pre>
      </div>

      {/* Courbe simplifiée (line chart minimaliste en CSS) */}
      <div className="mb-4 h-32 w-full rounded-lg bg-[#0A0F12] px-3 py-2">
        <div className="flex h-full items-end gap-2">
          {points.map((point, idx) => {
            const normalized =
              maxScore === minScore
                ? 0.5
                : (point.score - minScore) / (maxScore - minScore);
            const height = 20 + normalized * 80; // 20–100%

            return (
              <div
                key={`${point.date}-${idx}`}
                className="flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-[3px] rounded-full bg-[#00D4C2]"
                  style={{ height: `${height}%` }}
                />
                <span className="mt-1 text-[10px] text-slate-500">
                  {point.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé institutionnel */}
      <p className="mb-4 text-xs text-slate-300">
        <span className="font-semibold text-slate-100">{firmName}</span> shows a{" "}
        <span className="font-semibold text-[#00D4C2]">{trendLabel}</span> over the
        observed period, moving from{" "}
        <span className="font-semibold text-slate-100">{first.score}</span> to{" "}
        <span className="font-semibold text-slate-100">{last.score}</span>. This
        trajectory is evaluated in the context of GTIXT's deterministic scoring
        framework and oversight process.
      </p>

      {/* Events + percentiles */}
      <div className="grid gap-4 md:grid-cols-2">
        {events.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Key events
            </p>
            <ul className="space-y-1 text-xs text-slate-300">
              {events.map((event, idx) => (
                <li
                  key={`${event.date}-${idx}`}
                  className="flex items-start justify-between gap-2 rounded-md bg-[#0A0F12] px-3 py-2"
                >
                  <div>
                    <p className="text-[11px] text-slate-400">{event.date}</p>
                    <p className="text-xs text-slate-200">{event.label}</p>
                  </div>
                  {typeof event.impact === "number" && (
                    <span
                      className={
                        event.impact > 0
                          ? "mt-1 text-[11px] font-semibold text-emerald-400"
                          : event.impact < 0
                          ? "mt-1 text-[11px] font-semibold text-rose-400"
                          : "mt-1 text-[11px] font-semibold text-slate-400"
                      }
                    >
                      {event.impact > 0 ? `+${event.impact}` : event.impact}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {percentiles && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Percentile context
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              {typeof percentiles.universe === "number" && (
                <div className="flex items-center justify-between rounded-md bg-[#0A0F12] px-3 py-2">
                  <span className="text-slate-400">Universe</span>
                  <span className="font-semibold text-[#00D4C2]">
                    {percentiles.universe}th
                  </span>
                </div>
              )}
              {typeof percentiles.modelType === "number" && (
                <div className="flex items-center justify-between rounded-md bg-[#0A0F12] px-3 py-2">
                  <span className="text-slate-400">Model type</span>
                  <span className="font-semibold text-[#00D4C2]">
                    {percentiles.modelType}th
                  </span>
                </div>
              )}
              {typeof percentiles.jurisdiction === "number" && (
                <div className="flex items-center justify-between rounded-md bg-[#0A0F12] px-3 py-2">
                  <span className="text-slate-400">Jurisdiction</span>
                  <span className="font-semibold text-[#00D4C2]">
                    {percentiles.jurisdiction}th
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ScoreTrajectory;
