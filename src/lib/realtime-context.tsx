"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { resolveWebSocketBaseUrl } from "@/lib/ws-config";

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

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const pushEvent = useCallback((type: RealtimeEventType, data: unknown) => {
    setLastEvent({ type, data, timestamp: new Date() });
  }, []);

  useEffect(() => {
    const httpBase = resolveWebSocketBaseUrl();
    if (!httpBase) return;

    const newSocket = io(`${httpBase}/tastemind`, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 2,
      timeout: 8000,
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
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [pushEvent]);

  const emitEvent = useCallback(
    (type: string, data: unknown) => {
      if (socket?.connected) socket.emit(type, data);
    },
    [socket],
  );

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
