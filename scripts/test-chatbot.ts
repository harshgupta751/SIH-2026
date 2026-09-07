import { classifyScope, validateChatMessage } from '../src/lib/chatbot/responder';
import { answerChatMessageFallback } from '../src/lib/chatbot/fallback';

function assert(label: string, condition: boolean) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
}

const outOfScope = [
  'what is array',
  'explain javascript closures',
  'weather in mumbai today',
  'write python code for sorting',
];

for (const q of outOfScope) {
  const r = validateChatMessage(q);
  assert(`out-of-scope "${q}"`, r !== null && r.inScope === false);
}

const inScopeProceed = [
  'how do I register as a citizen',
  'what services can I apply for',
  'how does consent work on mahasetu',
  'officer sanction application',
];

for (const q of inScopeProceed) {
  assert(`in-scope proceed "${q}"`, validateChatMessage(q) === null);
}

assert('greeting blocked from gemini', validateChatMessage('hello')?.intentId === 'greeting');
assert('classify greeting', classifyScope('hello') === 'in');
assert('fallback register intent', answerChatMessageFallback('how to register').intentId === 'register-citizen');

console.log('\nAll chatbot scope tests passed.');
