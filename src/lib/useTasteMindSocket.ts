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
 * TasteMind WebSocket — handlers stored in ref to avoid reconnect loop on every render.
 */
export function useTasteMindSocket(
  restaurantId?: string | null,
  handlers: Partial<Record<WsEvent, WsHandler>> | null = {},
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const enabled = handlers !== null;

  const send = useCallback((event: string, data: object) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const httpBase = resolveWebSocketBaseUrl();
    if (!httpBase) return;

    const socket = io(`${httpBase}/tastemind`, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: 2,
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      handlersRef.current?.connected?.({});
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
        handlersRef.current?.[evt]?.(payload);
      });
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, enabled]);

  return { send };
}
