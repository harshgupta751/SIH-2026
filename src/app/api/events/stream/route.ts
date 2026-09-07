export { dynamic, runtime } from '@/lib/api/route-config';

import { eventBus } from '@/lib/events/event-bus';
import { MahaSetuEvent } from '@/lib/interop/types';
import { getSessionFromCookieHeader } from '@/lib/auth/session';

export async function GET(req: Request) {
  const user = getSessionFromCookieHeader(req.headers.get('cookie'));
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const history = await eventBus.getHistory(8);
      const initPayload = JSON.stringify({
        type: 'CONNECTED',
        timestamp: new Date().toISOString(),
        recentEvents: history,
      });
      controller.enqueue(encoder.encode(`data: ${initPayload}\n\n`));

      const onEvent = (event: MahaSetuEvent) => {
        try {
          if (user.role === 'CITIZEN' && event.citizenId && event.citizenId !== user.citizenId) {
            return;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // stream closed
        }
      };

      eventBus.on('*', onEvent);
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      return () => {
        clearInterval(heartbeatInterval);
        eventBus.off('*', onEvent);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
