import React from "react";
import { nzd } from "../format.js";

/** Top-line stat tiles: totals plus the flagged count (a hero number for the risk story). */
export default function SummaryTiles({ transactions }) {
  const spend = transactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const income = transactions
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const flaggedCount = transactions.filter((t) => t.flagged).length;

  return (
    <div className="tiles">
      <div className="tile">
        <div className="label">Transactions</div>
        <div className="value">{transactions.length}</div>
      </div>
      <div className="tile">
        <div className="label">Total spend</div>
        <div className="value">{nzd(spend)}</div>
      </div>
      <div className="tile">
        <div className="label">Money in</div>
        <div className="value">{nzd(income)}</div>
      </div>
      <div className="tile">
        <div className="label">Flagged</div>
        <div className={`value ${flaggedCount ? "alert" : ""}`}>{flaggedCount}</div>
      </div>
    </div>
  );
}
