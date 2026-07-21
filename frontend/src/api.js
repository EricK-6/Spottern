/**
 * Backend client with a demo fallback.
 *
 * When VITE_API_BASE is set (deployed API Gateway), the CSV path posts the
 * raw file to the ingest Lambda, then hands the transactions to the
 * categorize Lambda. If that env var is absent, or any call fails, the app
 * falls back to the bundled sample analysis so the dashboard always renders.
 *
 * PDF uploads go through S3 + Textract asynchronously in the real pipeline,
 * which the browser can't await synchronously — so in this demo build PDFs
 * resolve to the sample analysis too. Once deployed with a status endpoint,
 * swap analyzePdf to upload + poll.
 */

import { MOCK_TRANSACTIONS, SAMPLES } from "./mockData.js";

export { SAMPLES };

const API_BASE = import.meta.env.VITE_API_BASE || "";

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

async function analyzeCsvLive(file) {
  const csvText = await readFileText(file);

  const ingestRes = await fetch(`${API_BASE}/ingest/csv`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: csvText
  });
  if (!ingestRes.ok) throw new Error(`Ingest failed (${ingestRes.status})`);
  const { transactions } = await ingestRes.json();

  const catRes = await fetch(`${API_BASE}/categorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions })
  });
  if (!catRes.ok) throw new Error(`Categorize failed (${catRes.status})`);
  const data = await catRes.json();
  return data.transactions;
}

/**
 * Analyze an uploaded statement. Always resolves to a transaction list;
 * `source` is "live" when the backend answered, "demo" when we fell back.
 */
export async function analyzeStatement(file) {
  const isCsv = file && /\.csv$/i.test(file.name);

  if (API_BASE && isCsv) {
    try {
      const transactions = await analyzeCsvLive(file);
      return { transactions, source: "live" };
    } catch (err) {
      console.warn("Live analysis failed, showing sample data:", err.message);
    }
  }

  // Small delay so the loading state is visible — makes the demo feel real.
  await new Promise(r => setTimeout(r, 600));
  return { transactions: MOCK_TRANSACTIONS, source: "demo" };
}

export function loadSample(id) {
  const sample = SAMPLES.find((s) => s.id === id) || SAMPLES[0];
  return { transactions: sample.transactions, source: "demo" };
}

export const HAS_BACKEND = Boolean(API_BASE);
