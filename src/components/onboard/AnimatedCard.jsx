import React from "react";

export default function AnimatedCard({ inView = true, children }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm p-6 transition-all duration-300
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      {children}
    </div>
  );
}
