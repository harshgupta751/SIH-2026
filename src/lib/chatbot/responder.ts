import { answerChatMessageFallback } from './fallback';
import { askGemini, isGeminiConfigured, isGeminiRefusal } from './gemini';
import {
  CHAT_GREETING_PATTERNS,
  CHAT_KNOWLEDGE,
  CHAT_NO_MATCH_IN_SCOPE,
  CHAT_OUT_OF_SCOPE,
  CHAT_WELCOME,
  IN_SCOPE_SIGNALS,
  OUT_OF_SCOPE_PATTERNS,
} from './knowledge';
import type { ChatReply } from './types';

function normalize(text: string) {
  return text.trim().replace(/\s+/g, ' ');
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((n, p) => (p.test(text) ? n + 1 : n), 0);
}

export function isGreeting(text: string) {
  const t = normalize(text);
  return CHAT_GREETING_PATTERNS.some((p) => p.test(t));
}

export function classifyScope(text: string): 'in' | 'out' | 'unknown' {
  const t = normalize(text).toLowerCase();
  if (!t || t.length < 2) return 'unknown';

  const outHits = countMatches(t, OUT_OF_SCOPE_PATTERNS);
  const inHits = countMatches(t, IN_SCOPE_SIGNALS);

  if (outHits > 0 && inHits === 0) return 'out';
  if (inHits > 0) return 'in';

  if (/^(what is|what are|define|explain)\s+\w+[\s?.!]*$/i.test(t) && inHits === 0) {
    return 'out';
  }

  if (isGreeting(t)) return 'in';
  return 'unknown';
}

/** Synchronous guard — blocks before any Gemini API call. Returns null when the message may proceed. */
export function validateChatMessage(message: string): ChatReply | null {
  const text = normalize(message);
  if (!text) {
    return { answer: 'Please type a question about MahaSetu.', intentId: 'empty', inScope: true, source: 'guard' };
  }

  if (text.length > 500) {
    return {
      answer: 'Please keep your question under 500 characters so I can help with MahaSetu topics.',
      intentId: 'too-long',
      inScope: true,
      source: 'guard',
    };
  }

  const scope = classifyScope(text);
  if (scope === 'out' || scope === 'unknown') {
    return { answer: CHAT_OUT_OF_SCOPE, intentId: 'out-of-scope', inScope: false, source: 'guard' };
  }

  if (isGreeting(text)) {
    return { answer: CHAT_WELCOME, intentId: 'greeting', inScope: true, source: 'guard' };
  }

  return null;
}

function linksForMessage(text: string) {
  for (const intent of CHAT_KNOWLEDGE) {
    if (intent.patterns.some((p) => p.test(text))) {
      return intent.links;
    }
  }
  return undefined;
}

export async function answerChatMessage(message: string): Promise<ChatReply> {
  const guarded = validateChatMessage(message);
  if (guarded) return guarded;

  const text = normalize(message);

  if (isGeminiConfigured()) {
    try {
      const answer = await askGemini(text);
      const refused = isGeminiRefusal(answer);
      return {
        answer,
        intentId: refused ? 'gemini-refusal' : 'gemini',
        inScope: !refused,
        links: refused ? undefined : linksForMessage(text),
        source: 'gemini',
      };
    } catch {
      // fall through to rule-based answers when Gemini is unavailable
    }
  }

  const fallback = answerChatMessageFallback(text);
  if (fallback.intentId === 'no-match') {
    return {
      answer: isGeminiConfigured()
        ? CHAT_NO_MATCH_IN_SCOPE
        : `${CHAT_NO_MATCH_IN_SCOPE}\n\n(Set GEMINI_API_KEY in .env for richer answers.)`,
      intentId: 'no-match',
      inScope: true,
      source: 'fallback',
    };
  }
  return { ...fallback, source: 'fallback' };
}
