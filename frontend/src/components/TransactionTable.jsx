import React, { useState } from "react";
import { nzd } from "../format.js";

/** Full statement, most recent first, with an optional flagged-only filter. */
export default function TransactionTable({ transactions }) {
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const flaggedCount = transactions.filter((t) => t.flagged).length;

  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((t) => !flaggedOnly || t.flagged);

  return (
    <div className="card">
      <div className="table-head">
        <h2>All transactions</h2>
        {flaggedCount > 0 && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
            />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            Show flagged only
          </label>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="txn-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.transactionId} className={t.flagged ? "flagged" : ""}>
                <td style={{ whiteSpace: "nowrap" }}>{t.date}</td>
                <td>{t.merchant}</td>
                <td><span className="pill">{t.category}</span></td>
                <td className="num">
                  {t.direction === "credit" ? "+" : "−"}{nzd(t.amount)}
                </td>
                <td>{t.flagged ? <span className="flag-tag">⚠ flagged</span> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
