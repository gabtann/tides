const config = require("../config/env");

const AGENT_TIMEOUT_MS = 15000;

async function runAgent(input) {
  if (!config.agentBaseUrl) {
    const error = new Error("Agent service is not configured");
    error.code = "AGENT_NOT_CONFIGURED";
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
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Agent service request timed out");
      timeoutError.code = "AGENT_TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  runAgent,
};