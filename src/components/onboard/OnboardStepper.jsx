import React from "react";

export default function OnboardStepper({ step = 0, total = 1, title = "" }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-finovo transition-[width] duration-300"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 flex items-center gap-2 justify-center">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-4 rounded-full transition-all ${i <= step ? "bg-finovo w-6" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
