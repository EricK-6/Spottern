/**
 * Notify Lambda.
 * Receives the flagged transactions from the categorize Lambda and raises
 * two alerts:
 *   1. BNZ fraud-ops  -> SNS topic (structured summary for the bank).
 *   2. The customer   -> SES email in plain language, one line per flagged
 *      charge with Claude's explanation and a clear "what to do next".
 *
 * Each channel is optional and self-skips when its config is absent, so the
 * same code runs in a bare demo (no SES verification yet) and in a fully
 * wired deployment.
 *
 * Env vars:
 *   SNS_TOPIC_ARN   - BNZ fraud-ops topic (skip SNS if unset)
 *   SENDER_EMAIL    - SES-verified From address (skip email if unset)
 *   CUSTOMER_EMAIL  - fallback recipient when the payload carries none
 *   AWS_REGION      - provided automatically by the Lambda runtime
 *
 * No npm install needed — SNS + SES clients ship with the Lambda runtime's
 * AWS SDK v3. IAM needs sns:Publish and ses:SendEmail.
 */

const { CORS_HEADERS, parseEventBody } = require("../../shared/pipeline");

const money = amount => `$${Number(amount).toFixed(2)}`;

/** One human-readable line for a flagged transaction. */
function formatTransactionLine(t) {
  const base = `${t.date}  ${t.merchant} — ${money(t.amount)}`;
  return t.explanation ? `${base}\n    Why we flagged it: ${t.explanation}` : base;
}

/**
 * Plain-language email for the customer. Returns { subject, text, html }.
 * Deliberately calm and jargon-free — the goal is "here's what we spotted,
 * here's what to do", not to alarm.
 */
function buildCustomerEmail(transactions) {
  const accountRef = transactions[0]?.accountRef || "your account";
  const count = transactions.length;
  const noun = count === 1 ? "transaction" : "transactions";

  const subject = `Spottern: ${count} ${noun} on ${accountRef} worth a quick look`;

  const intro =
    `Hi,\n\nSpottern reviewed your recent statement for ${accountRef} and spotted ` +
    `${count} ${noun} that look a little unusual. This doesn't necessarily mean ` +
    `anything is wrong — we'd just like you to take a quick look:`;

  const lines = transactions.map(t => `  • ${formatTransactionLine(t)}`).join("\n\n");

  const outro =
    `\n\nIf you recognise these and they're expected, no action is needed.\n` +
    `If any look wrong, please contact BNZ or freeze your card in the app straight away.\n\n` +
    `— The Spottern team\n(This is an automated review of a sample statement.)`;

  const text = `${intro}\n\n${lines}${outro}`;

  const htmlRows = transactions
    .map(t => {
      const why = t.explanation
        ? `<div style="color:#555;font-size:13px;margin-top:4px">Why we flagged it: ${escapeHtml(t.explanation)}</div>`
        : "";
      return (
        `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">` +
        `<strong>${escapeHtml(t.merchant)}</strong> — ${money(t.amount)}` +
        `<div style="color:#888;font-size:12px">${t.date}</div>${why}</td></tr>`
      );
    })
    .join("");

  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#222">` +
    `<h2 style="color:#003DA5">Spottern spotted something</h2>` +
    `<p>We reviewed your recent statement for <strong>${escapeHtml(accountRef)}</strong> and found ` +
    `${count} ${noun} worth a quick look. This doesn't necessarily mean anything is wrong.</p>` +
    `<table style="width:100%;border-collapse:collapse">${htmlRows}</table>` +
    `<p style="margin-top:20px">If you recognise these, no action is needed. If any look wrong, ` +
    `contact BNZ or freeze your card in the app straight away.</p>` +
    `<p style="color:#888;font-size:12px">Automated review of a sample statement — Spottern.</p></div>`;

  return { subject, text, html };
}

/** Structured alert for BNZ fraud-ops. Returns { subject, message }. */
function buildBankAlert(transactions) {
  const accountRef = transactions[0]?.accountRef || "unknown";
  const totalFlagged = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const topScore = Math.max(...transactions.map(t => Number(t.anomalyScore) || 0));

  const subject = `[Spottern] ${transactions.length} flagged on ${accountRef} (max score ${topScore.toFixed(2)})`;

  const detail = transactions
    .map(
      t =>
        `- ${t.date} | ${t.merchant} | ${money(t.amount)} ${t.direction} | ` +
        `score ${Number(t.anomalyScore).toFixed(2)} | ${t.category}\n    ${t.explanation || "(no explanation)"}`
    )
    .join("\n");

  const message =
    `Spottern flagged ${transactions.length} transaction(s) on account ${accountRef}.\n` +
    `Total flagged value: ${money(totalFlagged)}\n` +
    `Highest anomaly score: ${topScore.toFixed(2)}\n\n${detail}\n`;

  return { subject, message };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function publishToBank(alert) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) return false;

  const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
  const sns = new SNSClient({});
  await sns.send(
    new PublishCommand({ TopicArn: topicArn, Subject: alert.subject.slice(0, 100), Message: alert.message })
  );
  return true;
}

async function emailCustomer(email, recipient) {
  const sender = process.env.SENDER_EMAIL;
  if (!sender || !recipient) return false;

  const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
  const ses = new SESClient({});
  await ses.send(
    new SendEmailCommand({
      Source: sender,
      Destination: { ToAddresses: [recipient] },
      Message: {
        Subject: { Data: email.subject },
        Body: {
          Text: { Data: email.text },
          Html: { Data: email.html }
        }
      }
    })
  );
  return true;
}

exports.handler = async (event) => {
  try {
    const body = parseEventBody(event);
    const transactions = body.transactions;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error("Expected a { transactions: [...] } payload of flagged transactions");
    }

    const recipient = body.customerEmail || process.env.CUSTOMER_EMAIL || null;

    const email = buildCustomerEmail(transactions);
    const alert = buildBankAlert(transactions);

    const [bankNotified, customerNotified] = await Promise.all([
      publishToBank(alert),
      emailCustomer(email, recipient)
    ]);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        flaggedCount: transactions.length,
        bankNotified,
        customerNotified,
        recipient: customerNotified ? recipient : null
      })
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to send notifications", detail: err.message })
    };
  }
};

// Exported for local testing without SNS/SES
exports.buildCustomerEmail = buildCustomerEmail;
exports.buildBankAlert = buildBankAlert;
exports.formatTransactionLine = formatTransactionLine;
