"use client";

import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type RealtimeEventType =
  | "order_update"
  | "order_updated"
  | "table_update"
  | "reservation_update"
  | "menu_update"
  | "inventory_update"
  | "staff_update"
  | "notification";

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: unknown;
  timestamp: Date;
}

export function useRealtimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const pushEvent = useCallback((type: RealtimeEventType, data: unknown) => {
    setLastEvent({ type, data, timestamp: new Date() });
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) return;

    const httpBase = wsUrl
      .replace(/^ws:\/\//i, "http://")
      .replace(/^wss:\/\//i, "https://")
      .replace(/\/tastemind\/?$/i, "");

    const newSocket = io(`${httpBase}/tastemind`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((d) => {
          const restaurantId = d?.restaurant?.id as string | undefined;
          if (restaurantId) {
            newSocket.emit("subscribe_restaurant", { restaurantId });
          }
        })
        .catch(() => {});
    });

    newSocket.on("disconnect", () => setIsConnected(false));

    const handlers: RealtimeEventType[] = [
      "order_update",
      "table_update",
      "reservation_update",
      "menu_update",
      "inventory_update",
      "staff_update",
      "notification",
    ];

    for (const event of handlers) {
      newSocket.on(event, (data) => pushEvent(event, data));
    }

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [pushEvent]);

  const emitEvent = (type: string, data: unknown) => {
    if (socket?.connected) socket.emit(type, data);
  };

  return { isConnected, lastEvent, emitEvent };
}

export function useRealtimeEvent<T>(eventType: RealtimeEventType) {
  const [eventData, setEventData] = useState<T | null>(null);
  const { isConnected, lastEvent } = useRealtimeUpdates();

  useEffect(() => {
    if (lastEvent && lastEvent.type === eventType) {
      setEventData(lastEvent.data as T);
    }
  }, [lastEvent, eventType]);

  return { isConnected, eventData };
}
