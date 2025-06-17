import { ParsedEmail } from "./Email";

export interface RawRule {
  name: string;
  type: string;
  field: keyof ParsedEmail;
  params: any;
  score: number;
  justification: { pass: string; fail: string };
}

export interface RawRule_AI {
  id: string;
  name: string; // Human-readable name of the rule (e.g., "Professional Greeting", "Timely Response")
  description: string; // A more detailed description of what the rule checks
  type: "content" | "header" | "attachment" | "timing";
  field?: keyof ParsedEmail; // Optional: For direct field checks if not using AI for everything

  // *** Key AI Integration Elements ***
  // For AI-driven rules, this prompt tells the AI what to look for and how to evaluate.
  // It should be designed so that non-devs can write clear instructions for the AI.
  promptTemplate: string; // A template for the AI prompt, e.g., "Does the email content exhibit a professional greeting? (Email: {emailContent})"

  // Expected AI output format for this rule. This helps in parsing the AI's response.
  // Could be "boolean", "score_and_justification", "categorical"
  expectedAiOutputFormat:
    | "boolean"
    | "score_and_justification"
    | "numeric_scale";

  // For 'numeric_scale', define the range and what represents a good/bad score.
  outputScale?: { min: number; max: number; goodThreshold: number };

  // For rules that are *not* purely AI-driven, but might have AI as an assistant
  params?: any; // Parameters specific to the rule type (e.g., for 'timing', it might be maxResponseHours)

  weight: number; // The importance of this rule in the total score calculation (e.g., 0-1 or 0-10)

  // Justifications can be AI-generated, but these provide fallback/guidance.
  justification: {
    pass: string; // Template for passing justification. AI can augment this.
    fail: string; // Template for failing justification. AI can augment this.
  };
}
