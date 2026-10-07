import Groq from "groq-sdk";
import { config } from "../config/env.js";

if (!config.groqApiKey) {
  throw new Error("GROQ_API_KEY is not configured");
}

const groq = new Groq({
  apiKey: config.groqApiKey,
});

async function generateText(contents) {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: contents }],
  });

  const text = response.choices[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("Groq returned no text response");
  }

  return text;
}

export { generateText };
