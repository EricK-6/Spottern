import React, { useState, useEffect } from "react";

const STEPS = [
  "Reading your statement…",
  "Sorting your spending into categories…",
  "Checking for unusual activity…",
  "Writing plain-language explanations…"
];

/** Full-screen "AI is working" moment shown while a statement is analyzed. */
export default function Analyzing() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % STEPS.length), 550);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hero analyzing">
      <div className="hero-badge pulse" aria-hidden="true">
        <img src="/logo.png" alt="" />
      </div>
      <div className="spinner" aria-hidden="true" />
      <p className="analyze-step" role="status">{STEPS[i]}</p>
    </div>
  );
}
