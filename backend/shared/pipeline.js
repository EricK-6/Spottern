/**
 * Spottern! pipeline helpers shared by the Lambdas.
 * The PDF flow is event-driven (S3 upload -> ingest -> categorize -> notify),
 * so each stage fires the next one asynchronously when the target function
 * name is present in its environment. The CSV flow skips this — the frontend
 * orchestrates it synchronously over API Gateway.
 */

/** CORS headers for every API Gateway-facing response. */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

/** Fire-and-forget invocation of the next Lambda in the pipeline. */
async function invokeNextLambda(functionName, payload) {
  // Lazy require: the AWS SDK is preinstalled in the Lambda runtime but not
  // needed (or installed) when unit-testing the pure functions locally.
  const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
  const client = new LambdaClient({});
  await client.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "Event",
      Payload: Buffer.from(JSON.stringify(payload))
    })
  );
}

/** API Gateway proxy events arrive with a JSON string body; direct invocations don't. */
function parseEventBody(event) {
  if (typeof event?.body === "string") return JSON.parse(event.body);
  return event?.body || event || {};
}

module.exports = { CORS_HEADERS, invokeNextLambda, parseEventBody };
