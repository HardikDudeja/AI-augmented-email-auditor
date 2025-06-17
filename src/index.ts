import express from "express";
import cors from "cors";
import {
  evaluateEmail,
  generateThreadAuditReport,
  loadRules,
} from "./engine/ruleEngine";

import { ParsedEmail } from "./models/Email";
import { ThreadAuditReport } from "./models/EvaluationResult";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/audit/email", async (req, res) => {
  const email: ParsedEmail = req.body.email;
  if (
    !email ||
    !email.text ||
    !email.subject ||
    !email.from ||
    !email.to ||
    !email.date
  ) {
    res.status(400).json({
      error: "Missing required email fields (text, subject, from, to, date).",
    });
    return;
  }
  try {
    const evaluationResults = await evaluateEmail(email);
    res.json(evaluationResults);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error auditing email:`, error);
    res.status(500).json({ error: "Failed to audit email", details: error });
  }
});

app.post("/audit/thread", async (req, res) => {
  const emailsInThread: ParsedEmail[] = req.body.emails;
  const employeeEmail: string | undefined = req.body.employeeEmail;

  if (
    !emailsInThread ||
    !Array.isArray(emailsInThread) ||
    emailsInThread.length === 0
  ) {
    res.status(400).json({
      error: "Request body must contain a non-empty array of emails.",
    });
    return;
  }

  const isValidThread = emailsInThread.every(
    (e) => e.text && e.subject && e.from && e.to && e.date
  );
  if (!isValidThread) {
    res.status(400).json({
      error:
        "All emails in the thread must have required fields (text, subject, from, to, date).",
    });
    return;
  }

  const threadId = emailsInThread[0].threadId || "N/A";
  console.log(
    `[${new Date().toISOString()}] Received request to audit thread: ${threadId}`
  );
  try {
    const auditReport: ThreadAuditReport = await generateThreadAuditReport(
      emailsInThread,
      employeeEmail
    );
    res.json(auditReport);
  } catch (error: any) {
    console.error(
      `[${new Date().toISOString()}] Error auditing thread ${threadId}:`,
      error
    );
    res.status(500).json({ error: "Failed to audit thread", details: error });
  }
});

app.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] Server running on http://localhost:${PORT}`
  );
  console.log(`API Endpoints:`);
  console.log(`- POST /audit/email`);
  console.log(`- POST /audit/thread`);
});
