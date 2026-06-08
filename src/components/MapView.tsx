import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap, CircleMarker } from 'react-leaflet';
import type { LatLngExpression, Marker as LeafletMarker } from 'leaflet';
import L from 'leaflet';
import type { LocationMessage } from '../types';

type MapViewProps = {
  latest: LocationMessage | null;
  history: LocationMessage[];
  autoFollow: boolean;
  centerSignal: number;
};

const DEFAULT_CENTER: LatLngExpression = [-6.2088, 106.8456]; // Default to Jakarta if no data

function MapController({ latest, history, autoFollow, centerSignal }: MapViewProps) {
  const map = useMap();
  const firstLoad = useRef(true);

  // Auto follow latest
  useEffect(() => {
    if (!latest) return;
    if (autoFollow || firstLoad.current) {
      map.setView([latest.lat, latest.lng], map.getZoom(), { animate: true });
      firstLoad.current = false;
    }
  }, [latest, autoFollow, map]);

  // Handle center signal (manual center)
  useEffect(() => {
    if (latest) {
      map.setView([latest.lat, latest.lng], map.getZoom(), { animate: true });
    } else if (history.length > 0) {
      const bounds = L.latLngBounds(history.map(h => [h.lat, h.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [centerSignal, latest, history, map]);

  // Initial fit bounds if history exists but no latest
  useEffect(() => {
    if (history.length > 0 && !latest) {
      const bounds = L.latLngBounds(history.map(h => [h.lat, h.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [history, latest, map]);

  return null;
}

export function MapView({ latest, history, autoFollow, centerSignal }: MapViewProps) {
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    if (!latest || !markerRef.current) return;
    markerRef.current.setLatLng([latest.lat, latest.lng]);
  }, [latest]);

  const polylinePoints = useMemo(
    () => history.map((item) => [item.lat, item.lng] as [number, number]),
    [history],
  );

  const markerPosition: LatLngExpression = latest ? [latest.lat, latest.lng] : DEFAULT_CENTER;

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} className="map-root">
      <TileLayer
        url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      />

      <MapController latest={latest} history={history} autoFollow={autoFollow} centerSignal={centerSignal} />

      {/* Historical points as small circles */}
      {history.map((item, idx) => (
        <CircleMarker
          key={`hist-${idx}`}
          center={[item.lat, item.lng]}
          radius={3}
          pathOptions={{ color: 'var(--accent-color)', fillOpacity: 0.6 }}
        />
      ))}

      {latest && (
        <Marker ref={markerRef} position={markerPosition}>
          {/* Custom label or popup could go here */}
        </Marker>
      )}

      {polylinePoints.length > 1 && (
        <Polyline
          positions={polylinePoints}
          pathOptions={{ color: 'var(--accent-color)', weight: 3, opacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
}