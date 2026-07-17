/**
 * Ingest Lambda, PDF path (Amazon Textract).
 * Triggered by an S3 upload (or invoked directly with { bucket, key }).
 * Runs Textract table analysis on the statement PDF, then normalizes the
 * extracted rows into the shared Transaction schema — same output shape
 * as csv-parser.js, ready for the categorize Lambda / DynamoDB put.
 *
 * Uses the async Textract API (StartDocumentAnalysis + polling) because the
 * sync AnalyzeDocument call only accepts single-page PDFs. Give this Lambda
 * a timeout of at least 3 minutes and an IAM role with:
 *   textract:StartDocumentAnalysis, textract:GetDocumentAnalysis, s3:GetObject
 */

const { randomUUID } = require("crypto");

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 75; // ~2.5 minutes of polling

// ---------------------------------------------------------------------------
// Textract job driver
// ---------------------------------------------------------------------------

async function analyzeStatementPdf(bucket, key) {
  // Lazy require so the pure parsing functions below can be unit-tested
  // locally without installing the AWS SDK (it's preinstalled in the
  // Lambda nodejs18.x+ runtimes).
  const {
    TextractClient,
    StartDocumentAnalysisCommand,
    GetDocumentAnalysisCommand
  } = require("@aws-sdk/client-textract");

  const client = new TextractClient({});

  const { JobId } = await client.send(
    new StartDocumentAnalysisCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
      FeatureTypes: ["TABLES"]
    })
  );

  // Poll until the job finishes, then page through all result blocks.
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const first = await client.send(new GetDocumentAnalysisCommand({ JobId }));

    if (first.JobStatus === "IN_PROGRESS") {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      continue;
    }
    if (first.JobStatus !== "SUCCEEDED") {
      throw new Error(`Textract job ${JobId} ended with status ${first.JobStatus}`);
    }

    const blocks = [...first.Blocks];
    let nextToken = first.NextToken;
    while (nextToken) {
      const page = await client.send(
        new GetDocumentAnalysisCommand({ JobId, NextToken: nextToken })
      );
      blocks.push(...page.Blocks);
      nextToken = page.NextToken;
    }
    return blocks;
  }

  throw new Error(`Textract job ${JobId} timed out after ${MAX_POLL_ATTEMPTS} polls`);
}

// ---------------------------------------------------------------------------
// Block geometry -> table rows
// ---------------------------------------------------------------------------

function buildBlockMap(blocks) {
  const map = new Map();
  for (const block of blocks) map.set(block.Id, block);
  return map;
}

function getCellText(cell, blockMap) {
  const childIds = (cell.Relationships || [])
    .filter(rel => rel.Type === "CHILD")
    .flatMap(rel => rel.Ids);

  const words = childIds
    .map(id => blockMap.get(id))
    .filter(Boolean)
    .map(child => {
      if (child.BlockType === "WORD") return child.Text;
      if (child.BlockType === "SELECTION_ELEMENT" && child.SelectionStatus === "SELECTED") return "X";
      return "";
    });

  return words.join(" ").trim();
}

/**
 * Returns every table in the document as arrays of cell-text rows,
 * concatenated in document order (multi-page statements produce one
 * TABLE block per page).
 */
function extractTableRows(blocks) {
  const blockMap = buildBlockMap(blocks);
  const rows = [];

  for (const table of blocks.filter(b => b.BlockType === "TABLE")) {
    const cellIds = (table.Relationships || [])
      .filter(rel => rel.Type === "CHILD")
      .flatMap(rel => rel.Ids);

    const grid = new Map(); // RowIndex -> Map(ColumnIndex -> text)
    for (const id of cellIds) {
      const cell = blockMap.get(id);
      if (!cell || cell.BlockType !== "CELL") continue;
      if (!grid.has(cell.RowIndex)) grid.set(cell.RowIndex, new Map());
      grid.get(cell.RowIndex).set(cell.ColumnIndex, getCellText(cell, blockMap));
    }

    const rowIndexes = [...grid.keys()].sort((a, b) => a - b);
    for (const rowIndex of rowIndexes) {
      const cols = grid.get(rowIndex);
      const colIndexes = [...cols.keys()].sort((a, b) => a - b);
      rows.push(colIndexes.map(c => cols.get(c)));
    }
  }

  return rows;
}

/**
 * The account reference isn't in the transaction table — it's in the page
 * text (e.g. "Account: ****4821"). Scan LINE blocks for a masked number.
 */
function extractAccountRef(blocks) {
  for (const block of blocks) {
    if (block.BlockType !== "LINE" || !block.Text) continue;
    const match = block.Text.match(/\*{2,}\s?(\d{2,6})/);
    if (match) return `****${match[1]}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Row normalization -> Transaction schema
// ---------------------------------------------------------------------------

const MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
};

/** "15 Jun 2026" | "15/06/2026" | "2026-06-15" -> "2026-06-15", else null */
function parseStatementDate(raw) {
  if (!raw) return null;
  const text = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const dmy = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()];
    if (month) return `${dmy[3]}-${month}-${dmy[1].padStart(2, "0")}`;
  }

  const slashed = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (slashed) {
    // NZ statements are day-first
    return `${slashed[3]}-${slashed[2].padStart(2, "0")}-${slashed[1].padStart(2, "0")}`;
  }

  return null;
}

/**
 * "-87.42" | "+2,450.00" | "$87.42 DR" | "(87.42)" -> { amount, direction },
 * else null. Statements mark debits with a leading minus, parentheses, or a
 * DR suffix; anything unmarked is treated as a credit (matches the sample
 * PDF, where the only unsigned-positive rows are deposits).
 */
function parseStatementAmount(raw) {
  if (!raw) return null;
  let text = raw.trim();
  let direction = null;

  const suffix = text.match(/\b(DR|CR)\b\.?$/i);
  if (suffix) {
    direction = suffix[1].toLowerCase() === "dr" ? "debit" : "credit";
    text = text.slice(0, suffix.index).trim();
  }
  if (/^\(.*\)$/.test(text)) {
    direction = direction || "debit";
    text = text.slice(1, -1).trim();
  }
  if (text.startsWith("-")) direction = direction || "debit";

  const value = parseFloat(text.replace(/[^0-9.+-]/g, ""));
  if (Number.isNaN(value)) return null;

  return { amount: Math.abs(value), direction: direction || "credit" };
}

/** Maps a header row to column indexes; null if this row isn't a header. */
function detectColumns(row) {
  const map = { date: null, merchant: null, amount: null, debit: null, credit: null, direction: null };

  row.forEach((cell, i) => {
    const h = (cell || "").toLowerCase();
    if (map.date === null && /date/.test(h)) map.date = i;
    else if (map.merchant === null && /description|merchant|details|particulars|transaction/.test(h)) map.merchant = i;
    else if (map.direction === null && /^direction$/.test(h)) map.direction = i;
    else if (map.debit === null && /withdrawal|debit|money out/.test(h)) map.debit = i;
    else if (map.credit === null && /deposit|credit|money in/.test(h)) map.credit = i;
    else if (map.amount === null && /amount/.test(h) && !/balance/.test(h)) map.amount = i;
  });

  const hasAmount = map.amount !== null || map.debit !== null || map.credit !== null;
  return map.date !== null && map.merchant !== null && hasAmount ? map : null;
}

/**
 * Converts extracted table rows into Transaction records. Header rows
 * (repeated on each page) reset the column mapping; rows that don't parse
 * (opening-balance lines, footers) are skipped.
 */
function rowsToTransactions(rows, accountRef, sourceFormat = "pdf") {
  const transactions = [];
  let columns = null;

  for (const row of rows) {
    const headerCandidate = detectColumns(row);
    if (headerCandidate) {
      columns = headerCandidate;
      continue;
    }
    if (!columns) continue;

    const date = parseStatementDate(row[columns.date]);

    let parsed = null;
    if (columns.amount !== null) {
      parsed = parseStatementAmount(row[columns.amount]);
    } else {
      // Separate money-out / money-in columns: use whichever is populated.
      const debit = parseStatementAmount(row[columns.debit]);
      const credit = parseStatementAmount(row[columns.credit]);
      if (debit) parsed = { amount: debit.amount, direction: "debit" };
      else if (credit) parsed = { amount: credit.amount, direction: "credit" };
    }

    const merchant = (row[columns.merchant] || "").trim();
    if (!date || !parsed || !merchant) continue;

    if (columns.direction !== null) {
      const explicit = (row[columns.direction] || "").trim().toLowerCase();
      if (explicit === "debit" || explicit === "credit") parsed.direction = explicit;
    }

    transactions.push({
      transactionId: randomUUID(),
      accountRef,
      date,
      merchant,
      amount: parsed.amount,
      direction: parsed.direction,
      sourceFormat,
      category: null,
      flagged: false,
      explanation: null,
      anomalyScore: null,
      createdAt: new Date().toISOString()
    });
  }

  return transactions;
}

/** Full pipeline from Textract blocks, exported for testing with fixture blocks. */
function parseTextractBlocks(blocks) {
  const accountRef = extractAccountRef(blocks) || "****0000";
  return rowsToTransactions(extractTableRows(blocks), accountRef);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/** Accepts an S3 event notification, or { bucket, key } directly / as a JSON body. */
function resolveObjectLocations(event) {
  if (Array.isArray(event?.Records) && event.Records[0]?.s3) {
    return event.Records.map(record => ({
      bucket: record.s3.bucket.name,
      key: decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))
    }));
  }

  const body = typeof event?.body === "string" ? JSON.parse(event.body) : (event?.body || event);
  if (body?.bucket && body?.key) return [{ bucket: body.bucket, key: body.key }];

  throw new Error("Expected an S3 event or a { bucket, key } payload");
}

exports.handler = async (event) => {
  try {
    const locations = resolveObjectLocations(event);

    const transactions = [];
    for (const { bucket, key } of locations) {
      const blocks = await analyzeStatementPdf(bucket, key);
      transactions.push(...parseTextractBlocks(blocks));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ count: transactions.length, transactions })
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Failed to parse PDF statement", detail: err.message })
    };
  }
};

// Exported for local testing without invoking through API Gateway / Textract
exports.analyzeStatementPdf = analyzeStatementPdf;
exports.extractTableRows = extractTableRows;
exports.extractAccountRef = extractAccountRef;
exports.parseStatementDate = parseStatementDate;
exports.parseStatementAmount = parseStatementAmount;
exports.rowsToTransactions = rowsToTransactions;
exports.parseTextractBlocks = parseTextractBlocks;
