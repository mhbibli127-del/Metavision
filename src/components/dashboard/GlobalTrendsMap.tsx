"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  source: "foursquare" | "competitor" | "trend";
  category?: string;
  rating?: number;
  address?: string;
  momentum?: number;
  demandChange?: number;
};

type GlobalTrendsMapProps = {
  center: { lat: number; lng: number; city: string };
  pins: MapPin[];
  loading?: boolean;
};

const sourceColor: Record<MapPin["source"], string> = {
  foursquare: "#3d8bfd",
  competitor: "#ff9f43",
  trend: "#7dffba",
};

export default function GlobalTrendsMap({ center, pins, loading }: GlobalTrendsMapProps) {
  useEffect(() => {
    document.body.classList.add("tm-map-active");
    return () => document.body.classList.remove("tm-map-active");
  }, []);

  const bounds = useMemo(() => {
    if (!pins.length) return undefined;
    const lats = pins.map((p) => p.lat);
    const lngs = pins.map((p) => p.lng);
    return [
      [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
      [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02],
    ] as [[number, number], [number, number]];
  }, [pins]);

  if (loading) {
    return <div className="tm-map-shell tm-map-shell--loading">Xəritə yüklənir…</div>;
  }

  return (
    <div className="tm-map-shell">
      <div className="tm-map-legend">
        <span><i className="tm-legend-dot tm-legend-dot--fsq" /> Foursquare</span>
        <span><i className="tm-legend-dot tm-legend-dot--comp" /> Rəqib (DB)</span>
        <span><i className="tm-legend-dot tm-legend-dot--trend" /> Bazar trendi</span>
      </div>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        bounds={bounds}
        className="tm-leaflet-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {pins.map((pin) => (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={pin.source === "trend" ? 14 : 9}
            pathOptions={{
              color: sourceColor[pin.source],
              fillColor: sourceColor[pin.source],
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <strong>{pin.name}</strong>
              {pin.category && <div>{pin.category}</div>}
            </Tooltip>
            <Popup>
              <div className="tm-map-popup">
                <strong>{pin.name}</strong>
                {pin.category && <p>{pin.category}</p>}
                {pin.address && <p>{pin.address}</p>}
                {pin.rating != null && <p>Reytinq: {pin.rating}</p>}
                {pin.momentum != null && (
                  <p>
                    Momentum {pin.momentum}%
                    {pin.demandChange != null && ` · tələb ${pin.demandChange > 0 ? "+" : ""}${pin.demandChange}%`}
                  </p>
                )}
                <small>{pin.source === "foursquare" ? "Foursquare" : pin.source === "competitor" ? "Metavision DB" : "Bazar trendi"}</small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
