import express from "express";
import { investigateWithAgent } from "../backend/src/services/agent-orchestrator.service.js";

const app = express();
const port = process.env.AGENT_PORT || 4100;

app.use(express.json());

app.post("/investigate", async (req, res) => {
  try {
    const result = await investigateWithAgent(req.body);
    res.json(result);
  } catch (error) {
    console.error("Agent investigation failed:", error);

    res.status(error.status || 500).json({
      error: error.code || "AGENT_INVESTIGATION_FAILED",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`TIDES Agent running on http://localhost:${port}`);
});