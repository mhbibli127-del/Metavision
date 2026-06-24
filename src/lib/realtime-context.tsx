"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resolveWebSocketBaseUrl } from "@/lib/ws-config";

export type RealtimeEventType =
  | "order_update"
  | "order_updated"
  | "table_update"
  | "reservation_update"
  | "menu_update"
  | "inventory_update"
  | "staff_update"
  | "notification"
  | "trends_update"
  | "signals_update"
  | "insight_event"
  | "incident_detected"
  | "market_alert"
  | "connected";

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: unknown;
  timestamp: Date;
}

type RealtimeContextValue = {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  emitEvent: (type: string, data: unknown) => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  lastEvent: null,
  emitEvent: () => {},
});

const SOCKET_EVENTS: RealtimeEventType[] = [
  "order_update",
  "order_updated",
  "table_update",
  "reservation_update",
  "menu_update",
  "inventory_update",
  "staff_update",
  "notification",
  "trends_update",
  "signals_update",
  "insight_event",
  "incident_detected",
  "market_alert",
  "connected",
];

const WS_DEFER_MS = 4000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const socketRef = useRef<{ connected: boolean; emit: (e: string, d: unknown) => void; disconnect: () => void } | null>(
    null,
  );

  const pushEvent = useCallback((type: RealtimeEventType, data: unknown) => {
    setLastEvent({ type, data, timestamp: new Date() });
  }, []);

  useEffect(() => {
    const httpBase = resolveWebSocketBaseUrl();
    if (!httpBase) return;

    let cancelled = false;
    let cleanupSocket: (() => void) | undefined;

    const timer = window.setTimeout(() => {
      void import("socket.io-client").then(({ io }) => {
        if (cancelled) return;

        const socket = io(`${httpBase}/tastemind`, {
          path: "/socket.io",
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: 1,
          timeout: 8000,
          withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setIsConnected(true);
          fetch("/api/auth/session", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
              const restaurantId = d?.restaurant?.id as string | undefined;
              if (restaurantId) socket.emit("subscribe_restaurant", { restaurantId });
            })
            .catch(() => {});
        });

        socket.on("disconnect", () => setIsConnected(false));

        for (const event of SOCKET_EVENTS) {
          socket.on(event, (data) => pushEvent(event, data));
        }

        cleanupSocket = () => {
          socket.removeAllListeners();
          socket.disconnect();
          socketRef.current = null;
          setIsConnected(false);
        };
      });
    }, WS_DEFER_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanupSocket?.();
    };
  }, [pushEvent]);

  const emitEvent = useCallback((type: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(type, data);
    }
  }, []);

  const value = useMemo(
    () => ({ isConnected, lastEvent, emitEvent }),
    [isConnected, lastEvent, emitEvent],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeUpdates() {
  return useContext(RealtimeContext);
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
