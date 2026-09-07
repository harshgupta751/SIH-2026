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

function isGreeting(text: string) {
  const t = normalize(text);
  return CHAT_GREETING_PATTERNS.some((p) => p.test(t));
}

/** Rule-based answers when Gemini is not configured or the API call fails. */
export function answerChatMessageFallback(message: string): ChatReply {
  const text = normalize(message);
  if (!text) {
    return { answer: 'Please type a question about MahaSetu.', intentId: 'empty', inScope: true };
  }

  if (text.length > 500) {
    return {
      answer: 'Please keep your question under 500 characters so I can help with MahaSetu topics.',
      intentId: 'too-long',
      inScope: true,
    };
  }

  const outHits = countMatches(text, OUT_OF_SCOPE_PATTERNS);
  const inHits = countMatches(text, IN_SCOPE_SIGNALS);
  if (outHits > 0 && inHits === 0) {
    return { answer: CHAT_OUT_OF_SCOPE, intentId: 'out-of-scope', inScope: false };
  }

  if (isGreeting(text)) {
    return { answer: CHAT_WELCOME, intentId: 'greeting', inScope: true };
  }

  let best: { intent: typeof CHAT_KNOWLEDGE[0]; score: number } | null = null;
  for (const intent of CHAT_KNOWLEDGE) {
    let score = 0;
    for (const pattern of intent.patterns) {
      if (pattern.test(text)) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { intent, score };
    }
  }

  if (best) {
    return {
      answer: best.intent.answer,
      intentId: best.intent.id,
      inScope: true,
      links: best.intent.links,
    };
  }

  const scopeUnknown = countMatches(text, IN_SCOPE_SIGNALS) === 0 && !isGreeting(text);
  if (scopeUnknown) {
    return { answer: CHAT_OUT_OF_SCOPE, intentId: 'out-of-scope', inScope: false };
  }

  return { answer: CHAT_NO_MATCH_IN_SCOPE, intentId: 'no-match', inScope: true };
}
