import React, { useState } from "react";
import { nzd } from "../format.js";

/**
 * Spending by category: a sorted horizontal bar chart. One measure (dollars
 * spent), so a single magnitude hue, not a categorical palette. Bars carry
 * direct value labels; hover shows the share of total spend.
 */
export default function CategoryChart({ transactions }) {
  const [hover, setHover] = useState(null);

  const totals = {};
  for (const t of transactions) {
    if (t.direction !== "debit") continue;
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }

  const rows = Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) {
    return (
      <div className="card">
        <h2>Spending by category</h2>
        <p className="muted">No spending to chart.</p>
      </div>
    );
  }

  const max = rows[0].amount;
  const totalSpend = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="card">
      <h2>Spending by category</h2>
      {rows.map((r) => {
        const pct = (r.amount / totalSpend) * 100;
        return (
          <div
            className="bar-row"
            key={r.category}
            onMouseEnter={() => setHover(r.category)}
            onMouseLeave={() => setHover(null)}
            title={`${r.category}: ${nzd(r.amount)} (${pct.toFixed(0)}% of spend)`}
          >
            <div className="cat">{r.category}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(r.amount / max) * 100}%`,
                  opacity: hover && hover !== r.category ? 0.55 : 1
                }}
              />
            </div>
            <div className="val">
              {nzd(r.amount)}
              {hover === r.category ? ` · ${pct.toFixed(0)}%` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
