import React, { useState } from "react";
import Hero from "./components/Hero.jsx";
import Analyzing from "./components/Analyzing.jsx";
import InsightBanner from "./components/InsightBanner.jsx";
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

  async function handleSample(id) {
    setLoading(true);
    // Brief pause so the "analyzing" moment is visible, then load the sample.
    await new Promise((r) => setTimeout(r, 1700));
    const result = loadSample(id);
    setTransactions(result.transactions);
    setSource(result.source);
    setLoading(false);
  }

  function reset() {
    setTransactions(null);
    setSource(null);
  }

  // Analyzing state (takes priority so the AI moment shows for uploads + samples)
  if (loading) return <Analyzing />;

  // Landing page
  if (!transactions) {
    return <Hero onFile={handleFile} onSample={handleSample} loading={loading} />;
  }

  // Results dashboard
  return (
    <>
      <header className="app-header">
        <span className="header-brand" onClick={reset} style={{ cursor: "pointer" }}>
          <span className="header-badge"><img src="/logo.png" alt="" /></span>
          <span className="logo-sm">Spottern<span className="bang">!</span></span>
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

        <InsightBanner transactions={transactions} />
        <SummaryTiles transactions={transactions} />
        <FlaggedAlerts transactions={transactions} />
        <CategoryChart transactions={transactions} />
        <TransactionTable transactions={transactions} />

        <div className="trust-chip">⚡ Powered by Claude on Amazon Bedrock · AWS × BNZ</div>
      </div>
    </>
  );
}
