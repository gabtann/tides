import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env.js";

if (!config.geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey: config.geminiApiKey,
});

async function generateText(contents) {
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents,
  });

  return response.text;
}

export { generateText };