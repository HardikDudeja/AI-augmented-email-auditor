import { getAiResponse } from "../service/aiService";
import { RawRule_AI } from "../models/Rule";
import { ParsedEmail } from "../models/Email";
import {
  RuleEvaluationResult,
  EmailEvaluation,
  ThreadAuditReport,
} from "../models/EvaluationResult";
import ai_rules from "../rules/ai_rules.json";

let finalRules: RawRule_AI[] = [];

export function loadRules(): void {
  const rules = ai_rules as RawRule_AI[];
  if (!Array.isArray(rules)) {
    throw new Error("Rules are not in the expected format");
  }
  const validRules = rules.filter((rule) => {
    const isValid =
      rule.id &&
      rule.name &&
      rule.description &&
      rule.type &&
      rule.promptTemplate &&
      rule.expectedAiOutputFormat &&
      typeof rule.weight === "number" &&
      rule.weight >= 0 &&
      rule.weight <= 1 &&
      rule.justification &&
      rule.justification.pass &&
      rule.justification.fail;
    if (!isValid) {
      console.warn(
        `Skipping invalid rule: ${JSON.stringify(
          rule.name || rule.id || "Unknown Rule"
        )}`
      );
    }
    return isValid;
  });
  console.log(`Loaded ${rules.length} rules.`);
  finalRules = validRules;
}

export async function evaluateEmail(
  email: ParsedEmail
): Promise<EmailEvaluation> {
  if (finalRules.length === 0) {
    loadRules(); // Attempt to load rules if not already loaded
    if (finalRules.length === 0) {
      console.warn("No rules loaded. Email evaluation cannot proceed.");
      return {
        messageId: email.messageId || "N/A",
        totalScore: 0,
        results: [],
        suggestions: [],
      };
    }
  }
  const results: RuleEvaluationResult[] = [];
  let totalScore = 0;
  const suggestions: string[] = [];
  for (const rule of finalRules) {
    let ruleScore = 0;
    let justificationText = "";

    let currentPrompt = rule.promptTemplate;
    for (const key in email) {
      if (Object.prototype.hasOwnProperty.call(email, key)) {
        const value = (email as any)[key];
        let replacementValue: string;

        if (value === undefined || value === null) {
          replacementValue = ""; // Treat undefined/null as empty string
        } else if (Array.isArray(value)) {
          // Handle arrays:
          if (key === "attachments") {
            // For attachments, provide a readable summary
            replacementValue = value
              .map(
                (a: { name: string; contentType: string }) =>
                  `${a.name} (${a.contentType})`
              )
              .join("; ");
          } else {
            // For other string arrays like 'references', join them
            replacementValue = value.join(", ");
          }
        } else if (typeof value === "object") {
          // For other object types (e.g., if you had a nested object), stringify them
          replacementValue = JSON.stringify(value);
        } else {
          // For primitive types (string, number, boolean), convert to string
          replacementValue = String(value);
        }

        currentPrompt = currentPrompt.replace(
          new RegExp(`\\{${key}\\}`, "g"),
          replacementValue
        );
      }
    }
    try {
      const aiResponse = await getAiResponse(currentPrompt);
      let passedRule = false;
      switch (rule.expectedAiOutputFormat) {
        case "boolean":
          passedRule = aiResponse.toLowerCase().startsWith("true");
          ruleScore = passedRule ? 1 : 0;
          justificationText = passedRule
            ? rule.justification.pass
            : rule.justification.fail;
          totalScore += ruleScore;
          break;
        default:
          console.warn(
            `Unsupported AI output format: ${rule.expectedAiOutputFormat} for rule ${rule.name}`
          );
          ruleScore = 0;
          justificationText = `Unsupported AI output format: ${rule.expectedAiOutputFormat}`;
      }
    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
      ruleScore = 0;
      justificationText = `Failed to get AI response for this rule: ${
        error instanceof Error ? error.message : String(error)
      }. Using default fail justification: ${rule.justification.fail}`;
    }

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      score: ruleScore,
      justification: justificationText,
    });
    break;
  }
  return {
    messageId: email.messageId || "N/A",
    totalScore: parseFloat(totalScore.toFixed(2)),
    results,
    suggestions: [...new Set(suggestions)],
  };
}

export async function generateThreadAuditReport(
  emailsInThread: ParsedEmail[],
  employeeEmail?: string
): Promise<ThreadAuditReport> {
  if (emailsInThread.length === 0) {
    throw new Error("Cannot generate audit report for an empty thread.");
  }

  const threadId = emailsInThread[0].threadId || "N/A";

  const emailEvaluations: EmailEvaluation[] = [];
  let totalEmailScores = 0;
  const allSuggestions = new Set<string>();

  emailsInThread.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const email of emailsInThread) {
    const evalulation = await evaluateEmail(email);
    emailEvaluations.push(evalulation);
    totalEmailScores += evalulation.totalScore;
    evalulation.suggestions.forEach((suggestion) => {
      allSuggestions.add(suggestion);
    });
  }
  const averageThreadScore = totalEmailScores / emailsInThread.length;
  let overallStrengths = "No specific strengths identified.";
  let overallImprovementAreas = "No specific improvement areas identified.";
  const combinedEmailTexts = emailEvaluations
    .map((e) =>
      e.results.map((r) => `${r.ruleName}: ${r.justification}`).join("\n")
    )
    .join("\n\n");
  const allScoreResults = emailEvaluations.flatMap((e) => e.results);

  const summaryPrompt = `
  Analyze the following email evaluation results from a conversation thread involving an employee ${
    employeeEmail ? `(email: ${employeeEmail})` : ""
  }.
  Based on the individual rule justifications and scores:

  Overall Email Scores (0-100%): ${emailEvaluations
    .map((e) => `${e.messageId}: ${e.totalScore.toFixed(2)}%`)
    .join(", ")}

  Individual Rule Breakdowns:
  ${allScoreResults
    .map(
      (r) =>
        `- Rule '${r.ruleName}' (ID: ${r.ruleId}): Score ${r.score.toFixed(
          2
        )}, Justification: ${r.justification}`
    )
    .join("\n")}

  1. Summarize the **overall strengths** of the employee's communication in this thread. Be concise.
  2. Summarize the **key areas for improvement** in the employee's communication in this thread. Be concise.
  
  Format your response as follows:
  Strengths: [Summary of strengths]
  Improvement Areas: [Summary of improvement areas]
  `;

  try {
    const aiResponse = await getAiResponse(summaryPrompt);
    const strengthsMatch = aiResponse.match(/Strengths:\s*(.*?)(\n|$)/i);
    const improvementsMatch = aiResponse.match(
      /Improvement Areas:\s*(.*?)(\n|$)/i
    );
    if (strengthsMatch && strengthsMatch[1]) {
      overallStrengths = strengthsMatch[1].trim();
    }
    if (improvementsMatch && improvementsMatch[1]) {
      overallImprovementAreas = improvementsMatch[1].trim();
    }
  } catch (error) {
    console.error("Error getting AI summary for thread:", error);
    overallStrengths = "Could not generate AI summary of strengths.";
    overallImprovementAreas =
      "Could not generate AI summary of improvement areas.";
  }

  return {
    threadId: threadId,
    averageThreadScore: parseFloat(averageThreadScore.toFixed(2)),
    emailEvaluations: emailEvaluations,
    overallStrengths: overallStrengths,
    overallImprovementAreas: overallImprovementAreas,
    topSuggestions: Array.from(allSuggestions),
  };
}

// const goodEmail: ParsedEmail = {
//   subject: "Meeting Confirmation - Project Alpha",
//   from: "john.doe@example.com",
//   to: "jane.smith@example.com",
//   date: "2025-06-17T10:00:00Z",
//   text: "Dear Jane,\n\nI hope this email finds you well. I'm writing to confirm our meeting for Project Alpha on Wednesday at 2 PM IST. Please let me know if this time still works for you.\n\nBest regards,\nJohn",
//   messageId: "1",
//   threadId: "1",
// };

// evaluateEmail(goodEmail)
//   .then((result) => {
//     console.log("Evaluation Result for Good Email:", result);
//   })
//   .catch((error) => {
//     console.error("Error evaluating good email:", error);
//   });

const email1: ParsedEmail = {
  subject: "Project Phoenix Kick-off",
  from: "manager@example.com",
  to: "employee@example.com",
  date: "2025-06-16T09:00:00Z",
  text: "Dear Employee,\n\nHope you're having a good week. We're kicking off Project Phoenix. Please review the attached document and prepare your initial thoughts by end of day.\n\nBest regards,\nManager",
  messageId: "phoenix-thread-001",
  threadId: "phoenix-thread-XYZ",
};

// Email 2 (Employee's reply - good)
const email2: ParsedEmail = {
  subject: "Re: Project Phoenix Kick-off",
  from: "employee@example.com",
  to: "manager@example.com",
  date: "2025-06-16T15:30:00Z", // 6.5 hours later
  text: "Dear Manager,\n\nThank you for the update on Project Phoenix. I have reviewed the document and will prepare my thoughts. I anticipate sending them over by 5 PM today. Please let me know if you need anything further.\n\nSincerely,\nEmployee",
  messageId: "phoenix-thread-002",
  inReplyTo: "phoenix-thread-001",
  references: ["phoenix-thread-001"],
  threadId: "phoenix-thread-XYZ",
};

// Email 3 (Employee's follow-up - slightly informal, delayed)
const email3: ParsedEmail = {
  subject: "Fwd: Project Phoenix Kick-off - my thoughts",
  from: "employee@example.com",
  to: "manager@example.com",
  date: "2025-06-18T10:00:00Z", // Original email was 2025-06-16T09:00:00Z, so this is > 24hrs from original
  text: "Hi boss,\n\nJust sending over my thoughts on Phoenix. It's really comprehensive! Attached. Let me know what you think.\n\nCheers,\nEmployee",
  messageId: "phoenix-thread-003",
  inReplyTo: "phoenix-thread-001", // This follow-up refers to original
  references: ["phoenix-thread-001", "phoenix-thread-002"],
  threadId: "phoenix-thread-XYZ",
};

const phoenixThreadEmails: ParsedEmail[] = [email1, email2, email3];
const employeeEmailToAudit = "employee@example.com"; // The employee we are auditing

generateThreadAuditReport(phoenixThreadEmails, employeeEmailToAudit)
  .then((report) => {
    console.log("Thread Audit Report:", JSON.stringify(report, null, 2));
  })
  .catch((error) => {
    console.error("Error generating thread audit report:", error);
  });
console.log("\nEmail evaluation complete.");
