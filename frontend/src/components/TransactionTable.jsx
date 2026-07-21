import React from "react";
import { nzd } from "../format.js";

/** Full statement, most recent first, with flagged rows highlighted. */
export default function TransactionTable({ transactions }) {
  const rows = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card">
      <h2>All transactions</h2>
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
