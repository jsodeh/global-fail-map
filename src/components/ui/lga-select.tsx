"use client";

import { useMemo } from "react";
import nigeriaLgas from "@/data/nigeria-lgas.json";

interface LGASelectProps {
  state: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LGASelect({
  state,
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
}: LGASelectProps) {
  // Find LGAs for the selected state
  const lgas = useMemo(() => {
    if (!state) return [];
    
    // Handle FCT mapping (state might be "FCT" in states.json but "Federal Capital Territory" in lgas.json)
    const stateData = nigeriaLgas.find(
      (s) => s.state === state || (state === "FCT" && s.alias === "abuja")
    );
    
    return stateData?.lgas || [];
  }, [state]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled || !state}
      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${className}`}
    >
      <option value="">
        {state ? "Select LGA" : "Select a state first"}
      </option>
      {lgas.map((lga) => (
        <option key={lga} value={lga}>
          {lga}
        </option>
      ))}
    </select>
  );
}
