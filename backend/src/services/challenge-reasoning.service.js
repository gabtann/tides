import { generateText } from '../integration/gemini.client.js';

const CHALLENGE_STATUSES = new Set([
  'SUPPORTED',
  'WEAKENED',
  'CONTRADICTED',
  'INCONCLUSIVE',
]);

const CONFIDENCE_LEVELS = new Set([
  'STRONG',
  'MODERATE',
  'WEAK',
]);

function parseChallengeResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(
      new Error('Agent returned invalid JSON for Challenge Signal.'),
      { code: 'AGENT_INVALID_JSON', status: 502 }
    );
  }
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string');
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeChallengeResult(result, input) {
  const challenge = result?.challenge ?? {};

  const challengeStatus = CHALLENGE_STATUSES.has(result?.challengeStatus)
    ? result.challengeStatus
    : 'INCONCLUSIVE';

  const confidence = CONFIDENCE_LEVELS.has(result?.confidence)
    ? result.confidence
    : 'WEAK';

  return {
    ticker: input.ticker,
    signalType: input.signalType,
    signalSummary:
      typeof result?.signalSummary === 'string'
        ? result.signalSummary
        : input.evidenceBrief.signal,
    challengeSummary:
      typeof result?.challengeSummary === 'string'
        ? result.challengeSummary
        : '',
    generatedAt:
      typeof result?.generatedAt === 'string'
        ? result.generatedAt
        : new Date().toISOString(),
    challenge: {
      supporting: normalizeStringArray(challenge.supporting),
      contradicting: normalizeStringArray(challenge.contradicting),
      alternativeExplanations: normalizeStringArray(
        challenge.alternativeExplanations
      ),
      unknown: normalizeStringArray(challenge.unknown),
    },
    challengeStatus,
    confidence,
    limitation:
      typeof result?.limitation === 'string'
        ? result.limitation
        : null,
  };
}

function buildChallengePrompt(input, evidence) {
  return `
You are the Challenge Signal component of TIDES, an AI research agent for stock-market research.

Your task is to critically challenge the existing Evidence Brief using ONLY the supplied evidence.

You are NOT an investment recommender.

Rules:
- Do not produce buy, sell, or hold recommendations.
- Do not predict future prices or market direction.
- Do not invent facts, news, corporate events, sentiment, or causal explanations.
- Clearly separate supporting evidence from contradicting evidence.
- Alternative explanations must be grounded in the supplied evidence.
- If an explanation cannot be established from the supplied evidence, put it in "unknown".
- Missing evidence must remain explicit.
- Do not treat the Evidence Brief interpretation as automatically true.
- The Challenge Signal should test whether the Evidence Brief interpretation is supported, weakened, contradicted, or inconclusive.

Signal:
${JSON.stringify({
  ticker: input.ticker,
  signalType: input.signalType,
  signalSummary: input.evidenceBrief.signal,
})}

Evidence Brief:
${JSON.stringify(input.evidenceBrief)}

Available evidence:
${JSON.stringify(evidence)}

Return ONLY valid JSON with exactly this structure:
{
  "signalSummary": "string",
  "challengeSummary": "string",
  "generatedAt": "ISO 8601 timestamp",
  "challenge": {
    "supporting": ["string"],
    "contradicting": ["string"],
    "alternativeExplanations": ["string"],
    "unknown": ["string"]
  },
  "challengeStatus": "SUPPORTED | WEAKENED | CONTRADICTED | INCONCLUSIVE",
  "confidence": "STRONG | MODERATE | WEAK",
  "limitation": "string or null"
}
`;
}

export async function challengeEvidence(
  input,
  evidence = {},
  dependencies = {}
) {
  const runGenerateText = dependencies.generateText ?? generateText;

  const prompt = buildChallengePrompt(input, evidence);
  const response = await runGenerateText(prompt);
  const result = parseChallengeResponse(response);

  return normalizeChallengeResult(result, input);
}