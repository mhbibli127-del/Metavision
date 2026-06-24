"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { resolveWebSocketBaseUrl } from "@/lib/ws-config";

type WsEvent =
  | "trends_update"
  | "signals_update"
  | "insight_event"
  | "incident_detected"
  | "market_alert"
  | "order_update"
  | "table_update"
  | "reservation_update"
  | "connected";

type WsHandler = (payload: unknown) => void;

/**
 * useTasteMindSocket — lightweight WebSocket client for TasteMind real-time feed.
 * Falls back silently when WS server is unavailable (dev mode without backend).
 */
export function useTasteMindSocket(
  restaurantId?: string | null,
  handlers: Partial<Record<WsEvent, WsHandler>> | null = {},
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const send = useCallback((event: string, data: object) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  useEffect(() => {
    if (handlers === null) return;

    const httpBase = resolveWebSocketBaseUrl();
    if (!httpBase) return;

    const socket = io(`${httpBase}/tastemind`, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const connectedHandler = handlersRef.current?.connected;
      if (connectedHandler) connectedHandler({});
      if (restaurantId) {
        socket.emit("subscribe_restaurant", { restaurantId });
      }
    });

    const events: WsEvent[] = [
      "trends_update",
      "signals_update",
      "insight_event",
      "incident_detected",
      "market_alert",
      "order_update",
      "table_update",
      "reservation_update",
      "connected",
    ];

    for (const evt of events) {
      socket.on(evt, (payload: unknown) => {
        const handler = handlersRef.current?.[evt];
        if (handler) handler(payload);
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, handlers]);

  return { send };
}
