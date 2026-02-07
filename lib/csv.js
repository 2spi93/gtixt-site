function escapeCsv(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function recordsToCsv(records) {
  // Choisis des colonnes "institutionnelles" lisibles
  const cols = [
    "firm_id",
    "brand_name",
    "website_root",
    "model_type",
    "score_0_100",
    "confidence",
    "na_rate",
    "jurisdiction_tier"
  ];

  const lines = [];
  lines.push(cols.join(","));

  for (const r of records) {
    const row = cols.map((c) => escapeCsv(r[c]));
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}