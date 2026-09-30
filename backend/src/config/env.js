import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  sectorsApiKey: process.env.SECTORS_API_KEY || '',
  sectorsBaseUrl: process.env.SECTORS_BASE_URL || '',
  agentBaseUrl: process.env.AGENT_BASE_URL || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};