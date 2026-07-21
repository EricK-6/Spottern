import React, { useState } from "react";
import Hero from "./components/Hero.jsx";
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

  function handleSample(id) {
    const result = loadSample(id);
    setTransactions(result.transactions);
    setSource(result.source);
  }

  function reset() {
    setTransactions(null);
    setSource(null);
  }

  // Landing page
  if (!transactions) {
    return <Hero onFile={handleFile} onSample={handleSample} loading={loading} />;
  }

  // Results dashboard
  return (
    <>
      <header className="app-header">
        <span className="logo-sm" onClick={reset} style={{ cursor: "pointer" }}>
          Spottern<span className="bang">!</span>
        </span>
        <span className="tagline">Spot unusual spending in your bank statement</span>
      </header>

      <div className="container">
        {source === "demo" && (
          <div className="banner">
            {HAS_BACKEND
              ? "Showing sample data — the live analysis wasn't reachable."
              : "Demo mode — showing a sample statement analyzed by Spottern."}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); reset(); }}>Spot another</a>
          </div>
        )}
        {source === "live" && (
          <div className="banner">
            Analyzed live by Claude on Amazon Bedrock.{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); reset(); }}>Spot another</a>
          </div>
        )}

        <SummaryTiles transactions={transactions} />
        <FlaggedAlerts transactions={transactions} />
        <CategoryChart transactions={transactions} />
        <TransactionTable transactions={transactions} />
      </div>
    </>
  );
}
