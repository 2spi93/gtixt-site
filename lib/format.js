export function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeTier(x) {
  const s = String(x || "").trim();
  if (!s) return "";
  return s.toUpperCase();
}

export function formatISODate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(isoString);
  }
}

// Legacy aliases for backward compatibility
export const num = safeNum;
export const pct = (x) => `${safeNum(x).toFixed(1)}%`;