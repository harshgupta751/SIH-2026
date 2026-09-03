import { eventBus } from '@/lib/events/event-bus';
import { MahaSetuEvent } from '@/lib/interop/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection establishment packet
      const initPayload = JSON.stringify({
        type: 'CONNECTED',
        timestamp: new Date().toISOString(),
        recentEvents: eventBus.getHistory(5),
      });
      controller.enqueue(encoder.encode(`data: ${initPayload}\n\n`));

      // Event listener for live reactive events
      const onEvent = (event: MahaSetuEvent) => {
        try {
          const chunk = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          // Stream might have closed
        }
      };

      eventBus.on('*', onEvent);

      // Keep-alive heartbeat every 15s
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Cleanup when connection closes
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
