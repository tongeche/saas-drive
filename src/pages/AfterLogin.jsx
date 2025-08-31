import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { loadMyTenants } from "../lib/tenantState";

export default function AfterLogin() {
  const nav = useNavigate();

  // ---------- KEEP FUNCTIONALITY THE SAME ----------
  useEffect(() => {
    (async () => {
      // wait for session to hydrate
      let { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) {
        await new Promise((r) => setTimeout(r, 60));
        ({ data: { session } = {} } = await supabase.auth.getSession());
      }
      if (!session) { nav("/login", { replace: true }); return; }

      let tenants = [];
      try { tenants = await loadMyTenants(); } catch { tenants = []; }

      // enforce a 60s minimum delay so users see the slides
      const minDelayMs = 60000;
      setTimeout(() => {
        nav((tenants && tenants.length > 0) ? "/app" : "/onboard", { replace: true });
      }, minDelayMs);
    })();
  }, [nav]);
  // --------------------------------------------------

  // Feature slides (icons are inline SVGs -> no extra packages)
   // Feature slides (using inline SVGs to avoid external dependencies)
   const slides = useMemo(() => ([
    {
      title: "Level up your money game",
      text: "Send slick, personalized invoices that make you look like a pro.",
      color: "text-blue-500",
      icon: (
        <svg viewBox="0 0 576 512" className="h-8 w-8" fill="currentColor">
          <path d="M64 64h128c17.7 0 32 14.3 32 32s-14.3 32-32 32H64v64h144c17.7 0 32 14.3 32 32s-14.3 32-32 32H64v64h144c17.7 0 32 14.3 32 32s-14.3 32-32 32H64v64h128c17.7 0 32 14.3 32 32s-14.3 32-32 32H64a64 64 0 0 1-64-64V128A64 64 0 0 1 64 64zM320 0a32 32 0 0 0-32 32v448a32 32 0 0 0 64 0V32a32 32 0 0 0-32-32zM480 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64h-96c-17.7 0-32 14.3-32 32s14.3 32 32 32h96v64h-64c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64h-96c-17.7 0-32 14.3-32 32s14.3 32 32 32h96v64h-64c-17.7 0-32 14.3-32 32s14.3 32 32 32h64a64 64 0 0 0 64-64V64a64 64 0 0 0-64-64z"/>
        </svg>
      ),
    },
    {
      title: "Keep tabs on your cash flow",
      text: "Track payments in real-time and gently nudge late payers. No stress.",
      color: "text-indigo-500",
      icon: (
        <svg viewBox="0 0 576 512" className="h-8 w-8" fill="currentColor">
          <path d="M544 240H339.7a32.002 32.002 0 0 0-32.1 32l-.2 153.2c-5.9 3.5-12.3 6.6-19.1 9.4A232.122 232.122 0 0 1 288 512a232.122 232.122 0 0 1-144.4-42.3c-6.8-2.8-13.2-5.9-19.1-9.4L113.6 272c-.1-17.7-14.4-32-32.1-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h16.2L128 471.2V272c0-17.7 14.3-32 32-32h16c17.7 0 32 14.3 32 32v240h64V272c0-17.7 14.3-32 32-32h16c17.7 0 32 14.3 32 32v240h64V272c0-17.7 14.3-32 32-32h16c17.7 0 32 14.3 32 32v240h48c17.7 0 32-14.3 32-32V272c0-17.7-14.3-32-32-32zm-224-208c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32h160c17.7 0 32-14.3 32-32zm96 0c0-17.7-14.3-32-32-32h-32c-17.7 0-32 14.3-32 32s14.3 32 32 32h32c17.7 0 32-14.3 32-32z"/>
        </svg>
      ),
    },
    {
      title: "Share your success",
      text: "Effortlessly share links and clean, branded PDFs with a single click.",
      color: "text-emerald-500",
      icon: (
        <svg viewBox="0 0 576 512" className="h-8 w-8" fill="currentColor">
          <path d="M480 320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V128a32 32 0 0 0-32-32H480c-17.7 0-32 14.3-32 32s14.3 32 32 32h96a32 32 0 0 1 32 32v128c0 17.7-14.3 32-32 32zM384 192H192c-17.7 0-32 14.3-32 32s14.3 32 32 32h192c17.7 0 32-14.3 32-32s-14.3-32-32-32zM128 320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H128zM96 128a64 64 0 1 0 0-128 64 64 0 1 0 0 128zM288 320c-17.7 0-32 14.3-32 32s14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32h-64z"/>
        </svg>
      ),
    },
    {
      title: "Stay organized, stay chill",
      text: "Everything is auto-sorted: your numbers, your clients, and your history.",
      color: "text-rose-500",
      icon: (
        <svg viewBox="0 0 512 512" className="h-8 w-8" fill="currentColor">
          <path d="M512 256c0 141.4-114.6 256-256 256S0 397.4 0 256 114.6 0 256 0s256 114.6 256 256zM224 376c0 13.3-10.7 24-24 24s-24-10.7-24-24V256c0-13.3 10.7-24 24-24s24 10.7 24 24v120zM320 376c0 13.3-10.7 24-24 24s-24-10.7-24-24V256c0-13.3 10.7-24 24-24s24 10.7 24 24v120zM416 376c0 13.3-10.7 24-24 24s-24-10.7-24-24V256c0-13.3 10.7-24 24-24s24 10.7 24 24v120z"/>
        </svg>
      ),
    },
  ]), []);

  // Carousel animation state
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("in"); // in -> hold -> out
  const holdMs = 4000; // each slide visible for 4s
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current && clearTimeout(timerRef.current);
    if (phase === "in") {
      timerRef.current = setTimeout(() => setPhase("hold"), 200);
    } else if (phase === "hold") {
      timerRef.current = setTimeout(() => setPhase("out"), holdMs);
    } else {
      timerRef.current = setTimeout(() => {
        setIdx((i) => (i + 1) % slides.length);
        setPhase("in");
      }, 200);
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, slides.length]);

  // Progress bar for the current slide
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf, start;
    function step(ts) {
      if (!start) start = ts;
      const elapsed = Math.min(holdMs, ts - start);
      setProgress(Math.round((elapsed / holdMs) * 100));
      raf = requestAnimationFrame(step);
    }
    if (phase === "hold") {
      setProgress(0);
      raf = requestAnimationFrame(step);
    } else {
      setProgress(0);
    }
    return () => cancelAnimationFrame(raf);
  }, [phase, holdMs]);

  return (
    <div className="min-h-screen bg-[#E9F5EE] text-gray-800 flex items-center justify-center p-0 md:p-6">
      {/* Full-screen on mobile, card on md+ */}
      <div className="w-full h-screen md:h-auto md:max-w-xl md:rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden flex flex-col">
        {/* Header loader */}
        <div className="flex items-center justify-center gap-3 py-6 text-gray-700 bg-gradient-to-r from-blue-100 to-emerald-100">
          <span className="relative inline-flex">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping absolute inline-flex opacity-75" />
            <span className="h-2 w-2 rounded-full bg-blue-500 relative inline-flex" />
          </span>
          <span className="font-medium">Getting things ready for ya!</span>
        </div>

        {/* Slide content */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <div className={`transition-opacity duration-300 ${phase === "out" ? "opacity-0" : "opacity-100"}`}>
            <div className="flex items-start gap-4 text-left max-w-md mx-auto">
              <div className={`${slides[idx].color}`}>{slides[idx].icon}</div>
              <div>
                <h2 className="text-xl font-semibold">{slides[idx].title}</h2>
                <p className="text-sm text-gray-600 mt-1">{slides[idx].text}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 h-2 w-full bg-gray-100 rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-[width] duration-200"
              style={{ width: `${phase === "hold" ? progress : 0}%` }}
              aria-hidden="true"
            />
          </div>

          {/* Slide dots */}
          <div className="mt-4 flex justify-center gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-4 rounded-full transition-all ${i === idx ? "bg-blue-500 w-6" : "bg-gray-300"}`}
                aria-label={i === idx ? "current slide" : "slide"}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
            Hey, thanks for waiting! We're almost there.
          </div>
          <span className="animate-pulse">just a sec...</span>
        </div>

        {/* SR-only for screen readers */}
        <p className="sr-only" role="status" aria-live="polite">
          Hang tight! We're getting your workspace all set up. You'll be zipping along in no time.
        </p>
      </div>
    </div>
  );
}