import React, { useState } from "react";
import { nzd, riskLevel } from "../format.js";

/**
 * Collapse identical flagged charges (same merchant, amount, day) into one
 * alert so a double-billing shows as a single "×2" card instead of two
 * duplicate cards.
 */
function groupFlagged(transactions) {
  const groups = [];
  const byKey = new Map();
  for (const t of transactions.filter((x) => x.flagged)) {
    const key = `${t.merchant}|${t.amount}|${t.date}`;
    if (byKey.has(key)) {
      byKey.get(key).count += 1;
    } else {
      const g = { ...t, key, count: 1 };
      byKey.set(key, g);
      groups.push(g);
    }
  }
  return groups;
}

/**
 * The headline of the app: flagged transactions with Claude's plain-language
 * explanation, a plain-language risk level, and an action to confirm or report.
 */
export default function FlaggedAlerts({ transactions }) {
  const groups = groupFlagged(transactions);
  const totalFlagged = transactions.filter((t) => t.flagged).length;
  const [resolved, setResolved] = useState({});

  if (groups.length === 0) {
    return (
      <div className="card">
        <h2>Flagged transactions</h2>
        <p className="muted">Nothing looked unusual on this statement. ✓</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        Flagged transactions <span className="flag-tag">⚠ {totalFlagged} need a look</span>
      </h2>
      {groups.map((g) => {
        const risk = riskLevel(g.anomalyScore);
        const state = resolved[g.key];
        return (
          <div className="flag reveal" key={g.key}>
            <div className="icon" aria-hidden="true">⚠️</div>
            <div className="body">
              <div className="head">
                <span className="merchant">
                  {g.merchant}
                  {g.count > 1 && <span className="dup-badge">×{g.count}</span>}
                </span>
                <span className="amount">{nzd(g.amount)}</span>
              </div>
              <div className="meta">
                {g.date}
                {g.count > 1 ? ` · charged ${g.count} times` : ""} ·{" "}
                <span className={`risk-pill ${risk.cls}`} title={`anomaly score ${g.anomalyScore.toFixed(2)}`}>
                  {risk.label}
                </span>
              </div>
              <div className="why">{g.explanation}</div>

              {state ? (
                <div className={`resolve-note ${state}`}>
                  {state === "reported"
                    ? "✓ Reported — BNZ has been alerted and will be in touch."
                    : "✓ Marked as safe."}
                </div>
              ) : (
                <div className="flag-actions">
                  <button
                    className="fa-btn safe"
                    onClick={() => setResolved((r) => ({ ...r, [g.key]: "safe" }))}
                  >
                    This was me
                  </button>
                  <button
                    className="fa-btn report"
                    onClick={() => setResolved((r) => ({ ...r, [g.key]: "reported" }))}
                  >
                    Not me — report
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
