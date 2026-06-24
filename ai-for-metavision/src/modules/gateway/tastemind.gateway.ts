import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '@/config/queue/redis.service';

/**
 * TasteMindGateway — real-time WebSocket layer.
 * Broadcasts: trends, signals, incidents, order updates, insight events.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.WS_ORIGIN?.split(',').map((o) => o.trim()) ?? true,
    credentials: true,
  },
  namespace: '/tastemind',
  transports: ['polling', 'websocket'],
})
export class TasteMindGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TasteMindGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly redis: RedisService) {
    this.subscribeToRedisChannels();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { status: 'ok', timestamp: new Date() });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Frontend subscribes to a restaurant room for targeted updates */
  @SubscribeMessage('subscribe_restaurant')
  handleSubscribeRestaurant(
    @MessageBody() data: { restaurantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`restaurant:${data.restaurantId}`);
    client.emit('subscribed', { restaurantId: data.restaurantId });
  }

  /** Broadcast to all connected clients */
  broadcastTrends(trends: object[]) {
    this.server.emit('trends_update', { trends, timestamp: new Date() });
  }

  broadcastSignals(signals: object[]) {
    this.server.emit('signals_update', { signals, timestamp: new Date() });
  }

  broadcastInsight(event: { text: string; severity: string; linkedModule: string }) {
    this.server.emit('insight_event', { ...event, timestamp: new Date() });
  }

  broadcastIncident(incident: object) {
    this.server.emit('incident_detected', { ...incident, timestamp: new Date() });
  }

  broadcastOrderUpdate(restaurantId: string, payload: object) {
    this.server.to(`restaurant:${restaurantId}`).emit('order_update', payload);
  }

  broadcastTableUpdate(restaurantId: string, payload: object) {
    this.server.to(`restaurant:${restaurantId}`).emit('table_update', payload);
  }

  broadcastReservationUpdate(restaurantId: string, payload: object) {
    this.server.to(`restaurant:${restaurantId}`).emit('reservation_update', payload);
  }

  broadcastAlert(payload: { type: 'opportunity' | 'risk'; message: string; confidence: number }) {
    this.server.emit('market_alert', { ...payload, timestamp: new Date() });
  }

  /** Subscribe to Redis Pub/Sub and rebroadcast to WebSocket clients */
  private subscribeToRedisChannels() {
    const liveChannel = process.env.STREAM_CHANNEL || 'tastemind:live';

    const channels: Array<{ channel: string; handler: (msg: string) => void }> = [
      {
        channel: 'tastemind:trends',
        handler: (msg) => {
          try { this.broadcastTrends(JSON.parse(msg)); } catch {}
        },
      },
      {
        channel: 'tastemind:signals',
        handler: (msg) => {
          try { this.broadcastSignals(JSON.parse(msg)); } catch {}
        },
      },
      {
        channel: 'tastemind:incidents',
        handler: (msg) => {
          try { this.broadcastIncident(JSON.parse(msg)); } catch {}
        },
      },
      {
        channel: liveChannel,
        handler: (msg) => {
          try {
            const payload = JSON.parse(msg) as { type?: string; data?: unknown };
            if (payload.type === 'trends') this.broadcastTrends(payload.data as object[]);
            else if (payload.type === 'signals') this.broadcastSignals(payload.data as object[]);
            else if (payload.type === 'incident') this.broadcastIncident(payload.data as object);
            else if (payload.type === 'insight') this.broadcastInsight(payload.data as { text: string; severity: string; linkedModule: string });
            else if (payload.type === 'alert') this.broadcastAlert(payload.data as { type: 'opportunity' | 'risk'; message: string; confidence: number });
            else if (payload.type === 'table_update') this.broadcastTableUpdate((payload as { restaurantId: string }).restaurantId, payload.data as object);
            else if (payload.type === 'reservation_update') this.broadcastReservationUpdate((payload as { restaurantId: string }).restaurantId, payload.data as object);
            else if (payload.type === 'order_update') this.broadcastOrderUpdate((payload as { restaurantId: string }).restaurantId, payload.data as object);
            else if (payload.type === 'menu_update' || payload.type === 'inventory_update' || payload.type === 'staff_update') {
              const rid = (payload as { restaurantId: string }).restaurantId;
              this.server.to(`restaurant:${rid}`).emit(payload.type, payload.data);
            }
          } catch {}
        },
      },
    ];

    // Subscribe after module init to ensure redis client ready
    setImmediate(async () => {
      for (const { channel, handler } of channels) {
        try {
          await this.redis.subscribe(channel, handler);
        } catch (err) {
          this.logger.warn(`Could not subscribe to ${channel}: ${err}`);
        }
      }
    });
  }
}
