/** Shared formatting helpers. */

const nzdFormatter = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD"
});

/** Format a number as New Zealand dollars, e.g. 1850 -> "$1,850.00". */
export function nzd(amount) {
  return nzdFormatter.format(amount);
}
