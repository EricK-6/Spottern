import React, { useRef, useState } from "react";

/**
 * Landing hero: the Spottern! wordmark, a "Let's Spot" upload button, a short
 * guidance line, and a sample fallback. Also accepts drag-and-drop anywhere
 * on the hero.
 */
export default function Hero({ onFile, onSample, loading }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={`hero ${drag ? "dragging" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <div className="spotlight" aria-hidden="true">🔦</div>

      <h1 className="logo">Spottern<span className="bang">!</span></h1>
      <p className="tagline">Spot unusual spending in your bank statement</p>

      <button className="cta" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? "Spotting…" : "Let's Spot"}
      </button>

      <p className="guidance">
        Upload a CSV or PDF bank statement and our AI reviews every transaction,
        sorts your spending, and flags anything unusual — with a plain-language
        reason why.
      </p>

      <button className="sample-link" onClick={onSample} disabled={loading}>
        or try a sample statement
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.pdf"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      <div className="credit">AWS × BNZ · Innovate AI Hackathon 2026</div>
    </div>
  );
}
