"use client";

import { useState } from "react";
import { BD_DISTRICTS_BY_DIVISION, BD_DIVISIONS, type BdDivision } from "@/lib/bangladeshLocations";

const SELECT_CLASS =
  "mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

function divisionOf(district: string): BdDivision | "" {
  return BD_DIVISIONS.find((d) => BD_DISTRICTS_BY_DIVISION[d].includes(district)) ?? "";
}

/**
 * Division → district picker. The chosen district is the location value (e.g. "Gazipur").
 * A saved value that isn't in the district list (older free-text entries such as "Chittagong")
 * is kept as a selectable option so editing doesn't silently wipe it.
 */
export function LocationSelect({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (district: string) => void;
  required?: boolean;
}) {
  const [division, setDivision] = useState<BdDivision | "">(() => divisionOf(value));
  const legacyValue = value && !divisionOf(value) ? value : null;
  const districts = division ? BD_DISTRICTS_BY_DIVISION[division] : [];

  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          aria-label={`${label} division`}
          value={division}
          onChange={(e) => {
            const next = e.target.value as BdDivision | "";
            setDivision(next);
            // Keep the district only if it belongs to the newly chosen division.
            if (!next || !BD_DISTRICTS_BY_DIVISION[next].includes(value)) onChange("");
          }}
          required={required && !legacyValue}
          className={SELECT_CLASS}
        >
          <option value="">Select division</option>
          {BD_DIVISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} district`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={!division && !legacyValue}
          className={SELECT_CLASS}
        >
          <option value="">{division ? "Select district" : "Choose a division first"}</option>
          {legacyValue ? <option value={legacyValue}>{legacyValue} (current)</option> : null}
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
