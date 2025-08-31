import React from "react";

export default function ProgressChecklist({ progress, items = [] }) {
  return (
    <div className="sticky top-4">
      <div className="rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Getting started</h3>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded mt-2 mb-3 overflow-hidden">
          <div
            className="h-2 bg-[#3c6b5b] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-2 text-sm">
              <span
                className={`inline-grid place-content-center h-5 w-5 rounded-full ${
                  it.done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                }`}
              >
                {it.done ? "✓" : "•"}
              </span>
              <span className={`${it.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
