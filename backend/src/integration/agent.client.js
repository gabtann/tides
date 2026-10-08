import { config } from "../config/env.js";

const AGENT_TIMEOUT_MS = 45_000;
const VALID_AGENT_ERROR_STATUSES = new Set([400, 404, 429, 500, 502, 504]);

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
      const fallbackError = new Error(
        `Agent service returned HTTP ${response.status}`,
      );
      fallbackError.code = "AGENT_REQUEST_FAILED";
      fallbackError.status = 502;

      let body;
      try {
        body = await response.json();
      } catch {
        throw fallbackError;
      }

      const agentError =
        body?.success === false && typeof body.error === "object"
          ? body.error
          : typeof body?.error === "string"
            ? { code: body.error, message: body.message }
            : null;
      const validErrorBody =
        typeof agentError?.code === "string" &&
        /^[A-Z][A-Z0-9_]{0,63}$/.test(agentError.code) &&
        typeof agentError.message === "string" &&
        agentError.message.trim().length > 0;

      if (
        !validErrorBody ||
        !VALID_AGENT_ERROR_STATUSES.has(response.status)
      ) {
        throw fallbackError;
      }

      const error = new Error(agentError.message);
      error.code = agentError.code;
      error.status = response.status;
      throw error;
    }

    try {
      return await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        const invalidResponseError = new Error(
          "Agent service returned an invalid JSON response",
        );
        invalidResponseError.code = "AGENT_INVALID_RESPONSE";
        invalidResponseError.status = 502;
        throw invalidResponseError;
      }
      throw error;
    }
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