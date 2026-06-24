"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "./Skeleton";

export function LiveNumber({
  value,
  loading,
  format = (n) => n.toLocaleString(),
  className = "",
}: {
  value: number;
  loading?: boolean;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) return;
    const from = display;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const duration = 280;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last display
  }, [value, loading]);

  useEffect(() => {
    if (!loading) setDisplay(value);
  }, [loading, value]);

  if (loading) return <Skeleton className="ds-skeleton--stat" />;

  return (
    <span className={`ds-live-number${flash ? " ds-live-number--flash" : ""} ${className}`.trim()}>
      {format(display)}
    </span>
  );
}
