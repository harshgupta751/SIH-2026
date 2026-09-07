import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_REFUSAL_SENTENCE, MAHASETU_SYSTEM_PROMPT } from './system-prompt';

function modelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function askGemini(userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName(),
    systemInstruction: MAHASETU_SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.25,
    },
  });

  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text;
}

export function isGeminiRefusal(text: string) {
  const normalized = text.trim();
  return normalized === GEMINI_REFUSAL_SENTENCE || normalized.startsWith(GEMINI_REFUSAL_SENTENCE.slice(0, 40));
}
