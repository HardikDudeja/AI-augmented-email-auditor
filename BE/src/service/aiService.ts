import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "API_KEY";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (GEMINI_API_KEY === "KEY" || !GEMINI_API_KEY) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not set. AI functions will be mocked."
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

/**
 * Sends a prompt to the AI model and returns its response.
 * @param prompt The prompt string to send to the AI.
 * @returns The AI's generated text response.
 */

export async function getAiResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini AI:", error);
    // Fallback or re-throw as appropriate for your application
    throw new Error("Failed to get AI response.");
  }
}
