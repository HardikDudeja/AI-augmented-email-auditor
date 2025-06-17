// import { ParsedEmail } from "../models/Email";
// import rules from "./rules.json";
// import { RuleEvaluationResult } from "../models/EvaluationResult";
// import { RawRule } from "../models/Rule";

// export function evaluateWithJsonRules(
//   email: ParsedEmail
// ): RuleEvaluationResult[] {
//   return (rules as RawRule[]).map((rule) => {
//     const content: string = email.text || "";
//     let passed = false;

//     switch (rule.type) {
//       case "startsWithAny":
//         passed = rule.params.some((word: string) =>
//           content.toLowerCase().startsWith(word.toLowerCase())
//         );
//         break;

//       case "avgWordsPerSentence":
//         const sentences = content.split(/[.?!]/).filter(Boolean);
//         const words = content.split(/\s+/).filter(Boolean);
//         const avg = words.length / (sentences.length || 1);
//         passed = avg < rule.params.threshold;
//         break;

//       // Add more rule types here
//     }

//     return {
//       rule: rule.name,
//       score: passed ? rule.score : 0,
//       justification: passed ? rule.justification.pass : rule.justification.fail,
//     };
//   });
// }
