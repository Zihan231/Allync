"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "@/lib/mock/types";

const LocationPickerInner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-surface-line bg-surface text-sm text-ink-faint">
      Loading map…
    </div>
  ),
});

export function LocationPicker(props: {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  geolocateLabel: string;
  geolocateErrorMessage: string;
}) {
  return <LocationPickerInner {...props} />;
}
