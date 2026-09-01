"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/mock/types";

// Default Leaflet marker icons resolve to file paths that bundlers don't
// serve correctly; point them at the CDN copies that ship with the package.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: LatLng = { lat: 23.685, lng: 90.3563 }; // Bangladesh

function ClickHandler({ onPick }: { onPick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerInner({
  value,
  onChange,
  geolocateLabel,
  geolocateErrorMessage,
}: {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  geolocateLabel: string;
  geolocateErrorMessage: string;
}) {
  const [geoError, setGeoError] = useState(false);
  const center = value ?? DEFAULT_CENTER;

  function usePreciseLocation() {
    setGeoError(false);
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError(true)
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-surface-line">
        <MapContainer center={[center.lat, center.lng]} zoom={value ? 13 : 6} style={{ height: 260, width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value ? <Marker position={[value.lat, value.lng]} /> : null}
        </MapContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={usePreciseLocation}
          className="rounded-full border border-surface-line-strong px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
        >
          {geolocateLabel}
        </button>
        {value ? (
          <span className="font-mono text-xs text-ink-faint">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        ) : null}
      </div>
      {geoError ? <p className="mt-1.5 text-xs text-danger-ink">{geolocateErrorMessage}</p> : null}
    </div>
  );
}
