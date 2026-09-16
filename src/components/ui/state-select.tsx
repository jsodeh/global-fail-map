"use client";

import { useState } from "react";
import nigeriaStates from "@/data/nigeria-states.json";

interface StateSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function StateSelect({
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
}: StateSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${className}`}
    >
      <option value="">Select State</option>
      {nigeriaStates.map((state) => (
        <option key={state.code} value={state.name}>
          {state.name}
        </option>
      ))}
    </select>
  );
}
