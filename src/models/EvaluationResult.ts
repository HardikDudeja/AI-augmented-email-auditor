export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  score: number;
  justification: string;
}

export interface EmailEvaluation {
  messageId: string;
  totalScore: number;
  results: RuleEvaluationResult[];
  suggestions: string[];
}
