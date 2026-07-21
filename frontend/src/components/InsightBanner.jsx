import React from "react";
import { nzd } from "../format.js";

/** One-line human summary of the review, above the stat tiles. */
export default function InsightBanner({ transactions }) {
  const flagged = transactions.filter((t) => t.flagged);
  const total = flagged.reduce((s, t) => s + t.amount, 0);
  const n = transactions.length;
  const clean = flagged.length === 0;

  return (
    <div className={`insight ${clean ? "clean" : "alert"}`}>
      <span className="insight-badge"><img src="/logo.png" alt="" /></span>
      <span className="insight-text">
        {clean ? (
          <>We reviewed <strong>{n}</strong> transactions — nothing looked unusual. ✓</>
        ) : (
          <>
            We reviewed <strong>{n}</strong> transactions and flagged{" "}
            <strong>{flagged.length}</strong> worth checking — <strong>{nzd(total)}</strong> in
            flagged value.
          </>
        )}
      </span>
    </div>
  );
}
