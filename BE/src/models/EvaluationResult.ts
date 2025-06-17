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

export interface ThreadAuditReport {
  threadId: string;
  averageThreadScore: number;
  emailEvaluations: EmailEvaluation[];
  overallStrengths: string;
  overallImprovementAreas: string;
  topSuggestions: string[];
}
