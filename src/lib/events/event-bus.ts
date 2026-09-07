import EventEmitter from 'events';
import { MahaSetuEvent, MahaSetuEventType } from '../interop/types';
import { prisma } from '@/lib/db/prisma';

class ReactiveEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
  }

  public async publish(
    eventType: MahaSetuEventType,
    payload: {
      source: string;
      applicationId: string;
      citizenId: string;
      summary: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<MahaSetuEvent> {
    const event: MahaSetuEvent = {
      id: `EVT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      eventType,
      source: payload.source,
      applicationId: payload.applicationId,
      citizenId: payload.citizenId,
      summary: payload.summary,
      timestamp: new Date().toISOString(),
      metadata: payload.metadata || {},
    };

    await prisma.event.create({
      data: {
        id: event.id,
        eventType: event.eventType,
        source: event.source,
        payloadJson: JSON.stringify(event),
      },
    });

    this.emit(eventType, event);
    this.emit('*', event);
    return event;
  }

  public async getHistory(limit = 30): Promise<MahaSetuEvent[]> {
    const rows = await prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return rows.map((row) => {
      try {
        return JSON.parse(row.payloadJson) as MahaSetuEvent;
      } catch {
        return {
          id: row.id,
          eventType: row.eventType as MahaSetuEventType,
          source: row.source,
          applicationId: '',
          citizenId: '',
          summary: '',
          timestamp: row.timestamp.toISOString(),
        };
      }
    });
  }
}

declare global {
  var __mahasetu_event_bus: ReactiveEventBus | undefined;
}

export const eventBus: ReactiveEventBus =
  global.__mahasetu_event_bus || (global.__mahasetu_event_bus = new ReactiveEventBus());
