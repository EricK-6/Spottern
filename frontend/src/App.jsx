import React, { useState } from "react";
import UploadPanel from "./components/UploadPanel.jsx";
import SummaryTiles from "./components/SummaryTiles.jsx";
import FlaggedAlerts from "./components/FlaggedAlerts.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import TransactionTable from "./components/TransactionTable.jsx";
import { analyzeStatement, loadSample, HAS_BACKEND } from "./api.js";

export default function App() {
  const [transactions, setTransactions] = useState(null);
  const [source, setSource] = useState(null); // "live" | "demo"
  const [loading, setLoading] = useState(false);

  async function handleFile(file) {
    setLoading(true);
    try {
      const result = await analyzeStatement(file);
      setTransactions(result.transactions);
      setSource(result.source);
    } finally {
      setLoading(false);
    }
  }

  function handleSample() {
    const result = loadSample();
    setTransactions(result.transactions);
    setSource(result.source);
  }

  function reset() {
    setTransactions(null);
    setSource(null);
  }

  return (
    <>
      <header className="app-header">
        <h1>Spottern!</h1>
        <span className="tagline">Spot unusual spending in your bank statement</span>
      </header>

      <div className="container">
        {!transactions ? (
          <UploadPanel onFile={handleFile} onSample={handleSample} loading={loading} />
        ) : (
          <>
            {source === "demo" && (
              <div className="banner">
                {HAS_BACKEND
                  ? "Showing sample data — the live analysis wasn't reachable."
                  : "Demo mode — showing a sample statement analyzed by Spottern."}
                {" "}
                <a href="#" onClick={(e) => { e.preventDefault(); reset(); }}>
                  Upload another
                </a>
              </div>
            )}
            {source === "live" && (
              <div className="banner">
                Analyzed live by Claude on Amazon Bedrock.{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); reset(); }}>
                  Upload another
                </a>
              </div>
            )}

            <SummaryTiles transactions={transactions} />
            <FlaggedAlerts transactions={transactions} />
            <CategoryChart transactions={transactions} />
            <TransactionTable transactions={transactions} />
          </>
        )}
      </div>
    </>
  );
}
