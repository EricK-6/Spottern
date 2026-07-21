import React, { useRef, useState } from "react";

/** Upload card: drag/drop or click a CSV/PDF, or load the bundled sample. */
export default function UploadPanel({ onFile, onSample, loading }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="card upload">
      <h2>Upload a bank statement</h2>
      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        <p style={{ fontSize: 15, color: "var(--text-primary)" }}>
          {loading ? "Analyzing…" : "Drop a CSV or PDF here, or click to choose"}
        </p>
        <p>We extract every transaction, categorize your spending, and flag anything unusual.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <button className="btn secondary" onClick={onSample} disabled={loading}>
          Use sample statement
        </button>
      </div>
    </div>
  );
}
