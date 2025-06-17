import { ParsedEmail } from "../models/Email";
import { EmailEvaluation } from "../models/EvaluationResult";
import { evaluateWithJsonRules } from "../rules/interpreter";

export function evaluateEmail(email: ParsedEmail): EmailEvaluation {
  const results = evaluateWithJsonRules(email);
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);

  return {
    messageId: email.messageId || "",
    totalScore,
    results,
  };
}
