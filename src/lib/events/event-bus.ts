import EventEmitter from 'events';
import { MahaSetuEvent, MahaSetuEventType } from '../interop/types';

/**
 * In-Memory Reactive Event Bus adhering strictly to Kafka event semantics
 * Coordinates distributed workflows and notifies real-time listeners.
 */
class ReactiveEventBus extends EventEmitter {
  private history: MahaSetuEvent[] = [];

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  public publish(
    eventType: MahaSetuEventType,
    payload: {
      source: string;
      applicationId: string;
      citizenId: string;
      summary: string;
      metadata?: Record<string, any>;
    }
  ): MahaSetuEvent {
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

    this.history.unshift(event);
    if (this.history.length > 200) {
      this.history.pop();
    }

    // Emit typed event and wildcard event for SSE streamers
    this.emit(eventType, event);
    this.emit('*', event);

    return event;
  }

  public getHistory(limit: number = 30): MahaSetuEvent[] {
    return this.history.slice(0, limit);
  }
}

// Global singleton instance across Next.js API routes
declare global {
  var __mahasetu_event_bus: ReactiveEventBus | undefined;
}

export const eventBus: ReactiveEventBus =
  global.__mahasetu_event_bus || (global.__mahasetu_event_bus = new ReactiveEventBus());
