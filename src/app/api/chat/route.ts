export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { answerChatMessage } from '@/lib/chatbot/responder';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
    }

    const reply = await answerChatMessage(message);
    return NextResponse.json({
      success: true,
      reply: reply.answer,
      intentId: reply.intentId,
      inScope: reply.inScope,
      links: reply.links || [],
      source: reply.source || 'guard',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not process your question' }, { status: 500 });
  }
}
