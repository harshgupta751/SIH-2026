export type ChatReply = {
  answer: string;
  intentId: string;
  inScope: boolean;
  links?: { label: string; href: string }[];
  source?: 'gemini' | 'fallback' | 'guard';
};
