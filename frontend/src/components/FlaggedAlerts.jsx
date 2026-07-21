import React from "react";
import { nzd } from "../format.js";

/**
 * The headline of the whole app: the flagged transactions with Claude's
 * plain-language explanation. Uses the reserved status palette with an icon
 * (⚠) + label, never colour alone.
 */
export default function FlaggedAlerts({ transactions }) {
  const flagged = transactions.filter((t) => t.flagged);

  if (flagged.length === 0) {
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
        Flagged transactions{" "}
        <span className="flag-tag">⚠ {flagged.length} need a look</span>
      </h2>
      {flagged.map((t) => (
        <div className="flag" key={t.transactionId}>
          <div className="icon" aria-hidden="true">⚠️</div>
          <div className="body">
            <div className="head">
              <span className="merchant">{t.merchant}</span>
              <span className="amount">{nzd(t.amount)}</span>
            </div>
            <div className="meta">
              {t.date} · risk score {t.anomalyScore.toFixed(2)}
            </div>
            <div className="why">{t.explanation}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
