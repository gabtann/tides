import { config } from "../config/env.js";

const AGENT_TIMEOUT_MS = 15000;

async function runAgent(input) {
  if (!config.agentBaseUrl) {
    const error = new Error("Agent service is not configured");
    error.code = "AGENT_NOT_CONFIGURED";
    error.status = 500;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.agentBaseUrl}/investigate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Agent service returned HTTP ${response.status}`);
      error.code = "AGENT_REQUEST_FAILED";
      error.status = 502;
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Agent service request timed out");
      timeoutError.code = "AGENT_TIMEOUT";
      timeoutError.status = 504;
      throw timeoutError;
    }

    // Re-throw errors that already have a code (e.g. AGENT_REQUEST_FAILED from non-2xx)
    if (error.code) throw error;

    // Network-level failures (DNS, connection refused) — contract has no separate code
    const netErr = new Error(`Agent service unreachable: ${error.message}`);
    netErr.code = "AGENT_REQUEST_FAILED";
    netErr.status = 502;
    throw netErr;
  } finally {
    clearTimeout(timeout);
  }
}

export { runAgent };