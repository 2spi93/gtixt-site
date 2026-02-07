import React from "react";

export default function FiltersBar({
  q, setQ,
  jurisdiction, setJurisdiction,
  modelType, setModelType,
  confidence, setConfidence,
  onExportCsv
}) {
  return (
    <div className="filters">
      <input
        className="input"
        placeholder="Search firm / domain..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <select className="select" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
        <option value="">All tiers</option>
        <option value="LOW_RISK">LOW_RISK</option>
        <option value="MEDIUM_RISK">MEDIUM_RISK</option>
        <option value="HIGH_RISK">HIGH_RISK</option>
        <option value="VERY_HIGH_RISK">VERY_HIGH_RISK</option>
        <option value="UNKNOWN">UNKNOWN</option>
      </select>

      <select className="select" value={modelType} onChange={(e) => setModelType(e.target.value)}>
        <option value="">All models</option>
        <option value="CFD_FX">CFD_FX</option>
        <option value="FUTURES">FUTURES</option>
        <option value="HYBRID">HYBRID</option>
      </select>

      <select className="select" value={confidence} onChange={(e) => setConfidence(e.target.value)}>
        <option value="">All confidence</option>
        <option value="high">high</option>
        <option value="medium">medium</option>
        <option value="low">low</option>
      </select>

      <button className="btn" onClick={onExportCsv}>Export CSV</button>

      <style jsx>{`
        .filters { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin: 16px 0; }
        .input { padding:10px 12px; min-width: 240px; border-radius: 10px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color:#fff; }
        .select { padding:10px 12px; border-radius: 10px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color:#fff; }
        .btn { padding:10px 12px; border-radius: 12px; border:1px solid rgba(255,255,255,0.14); background: rgba(0,209,193,0.12); color:#fff; cursor:pointer; }
      `}</style>
    </div>
  );
}