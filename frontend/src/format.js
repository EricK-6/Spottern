/** Shared formatting helpers. */

const nzdFormatter = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD"
});

/** Format a number as New Zealand dollars, e.g. 1850 -> "$1,850.00". */
export function nzd(amount) {
  return nzdFormatter.format(amount);
}

/** Turn a 0–1 anomaly score into a plain-language risk level + style class. */
export function riskLevel(score) {
  if (score >= 0.7) return { label: "High risk", cls: "high" };
  if (score >= 0.4) return { label: "Medium risk", cls: "med" };
  return { label: "Low risk", cls: "low" };
}
