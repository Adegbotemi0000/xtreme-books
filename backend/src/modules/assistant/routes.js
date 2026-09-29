const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const { answerFromKnowledge, FALLBACK } = require("./knowledge");

const router = express.Router();
router.use(requireAuth);

// "Chat with us" widget's backend. Rule-based for now (no LLM key
// configured — see knowledge.js) — when it can't answer, the frontend shows
// an "Reach out to our team" escalation instead of pretending to help.
router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(422).json({ error: "message is required" });
    }

    const answer = answerFromKnowledge(message);
    if (answer) {
      return res.json({ answer, escalate: false });
    }

    res.json({ answer: FALLBACK, escalate: true });
  })
);

module.exports = router;
