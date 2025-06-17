import { getAiResponse } from "../service/aiService";
import { RawRule_AI } from "../models/Rule";
import { ParsedEmail } from "../models/Email";
import {
  RuleEvaluationResult,
  EmailEvaluation,
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

const goodEmail: ParsedEmail = {
  subject: "Meeting Confirmation - Project Alpha",
  from: "john.doe@example.com",
  to: "jane.smith@example.com",
  date: "2025-06-17T10:00:00Z",
  text: "Dear Jane,\n\nI hope this email finds you well. I'm writing to confirm our meeting for Project Alpha on Wednesday at 2 PM IST. Please let me know if this time still works for you.\n\nBest regards,\nJohn",
  messageId: "1",
  threadId: "1",
};

evaluateEmail(goodEmail)
  .then((result) => {
    console.log("Evaluation Result for Good Email:", result);
  })
  .catch((error) => {
    console.error("Error evaluating good email:", error);
  });
