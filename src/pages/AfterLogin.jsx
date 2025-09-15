import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoice, 
  faChartLine, 
  faUsers, 
  faAutomobile,
  faBrain,
  faShield,
  faRocket,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import supabase from "../lib/supabase";
import { loadMyTenants } from "../lib/tenantState";

export default function AfterLogin() {
  const nav = useNavigate();

  // ---------- KEEP FUNCTIONALITY THE SAME BUT REDUCE WAIT TIME ----------
  useEffect(() => {
    (async () => {
      // wait for session to hydrate
      let { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) {
        await new Promise((r) => setTimeout(r, 40));
        ({ data: { session } = {} } = await supabase.auth.getSession());
      }
      if (!session) { nav("/login", { replace: true }); return; }

      let tenants = [];
      try { tenants = await loadMyTenants(); } catch { tenants = []; }

      // reduced from 40s to 20s minimum delay
      const minDelayMs = 20000;
      setTimeout(() => {
        nav((tenants && tenants.length > 0) ? "/app" : "/onboard", { replace: true });
      }, minDelayMs);
    })();
  }, [nav]);
  // --------------------------------------------------

  // Enhanced feature slides with new business intelligence features
  const slides = useMemo(() => ([
    {
      title: "Smart Invoice Management",
      text: "Create beautiful, professional invoices with automated tracking, payment reminders, and instant delivery.",
      color: "text-blue-500 dark:text-blue-400",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      icon: faFileInvoice,
    },
    {
      title: "Business Intelligence Dashboard",
      text: "Get real-time insights with advanced analytics, cash flow forecasting, and performance metrics.",
      color: "text-emerald-500 dark:text-emerald-400",
      bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
      icon: faChartLine,
    },
    {
      title: "Advanced CRM & Client Management",
      text: "Manage client relationships with smart segmentation, communication tracking, and payment behavior analysis.",
      color: "text-indigo-500 dark:text-indigo-400",
      bgGradient: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
      icon: faUsers,
    },
    {
      title: "Automation & Workflows",
      text: "Automate recurring invoices, payment reminders, and bulk operations to save hours every week.",
      color: "text-purple-500 dark:text-purple-400",
      bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      icon: faAutomobile,
    },
    {
      title: "AI-Powered Insights",
      text: "Leverage machine learning for predictive analytics, risk assessment, and business growth recommendations.",
      color: "text-pink-500 dark:text-pink-400",
      bgGradient: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20",
      icon: faBrain,
    },
    {
      title: "Enterprise Security & Compliance",
      text: "Bank-grade security with role-based access, audit trails, and compliance features for peace of mind.",
      color: "text-orange-500 dark:text-orange-400",
      bgGradient: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      icon: faShield,
    },
  ]), []);

  // Carousel animation state with smoother transitions
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("in"); // in -> hold -> out
  const holdMs = 2500; // each slide visible for 2.5s
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current && clearTimeout(timerRef.current);
    if (phase === "in") {
      timerRef.current = setTimeout(() => setPhase("hold"), 300);
    } else if (phase === "hold") {
      timerRef.current = setTimeout(() => setPhase("out"), holdMs);
    } else {
      timerRef.current = setTimeout(() => {
        setIdx((i) => (i + 1) % slides.length);
        setPhase("in");
      }, 300);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center p-0 md:p-6 transition-colors duration-300">
      {/* Full-screen on mobile, card on md+ */}
      <div className="w-full h-screen md:h-auto md:max-w-2xl md:rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl dark:shadow-none overflow-hidden flex flex-col transition-all duration-300">
        {/* Header loader with modern gradient */}
        <div className={`flex items-center justify-center gap-4 py-8 text-gray-700 dark:text-gray-300 bg-gradient-to-r ${slides[idx].bgGradient} transition-all duration-500`}>
          <div className="relative">
            <FontAwesomeIcon 
              icon={faSpinner} 
              className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" 
            />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-lg">Setting up your workspace...</span>
            <span className="text-sm opacity-75">Almost ready to launch! 🚀</span>
          </div>
        </div>

        {/* Slide content with enhanced animations */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className={`transition-all duration-500 transform ${
            phase === "out" ? "opacity-0 -translate-y-4 scale-95" : 
            phase === "in" ? "opacity-100 translate-y-0 scale-100" : "opacity-100 translate-y-0 scale-100"
          }`}>
            <div className={`flex items-start gap-6 text-left max-w-lg mx-auto p-6 rounded-2xl bg-gradient-to-r ${slides[idx].bgGradient} transition-all duration-500`}>
              <div className={`${slides[idx].color} flex-shrink-0 p-3 rounded-xl bg-white dark:bg-gray-700 shadow-lg`}>
                <FontAwesomeIcon icon={slides[idx].icon} className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {slides[idx].title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {slides[idx].text}
                </p>
              </div>
            </div>
          </div>

          {/* Modern progress bar */}
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              <span>Feature {idx + 1} of {slides.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-lg mx-auto shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 transition-all duration-300 ease-out rounded-full shadow-sm"
                style={{ width: `${phase === "hold" ? progress : 0}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Enhanced slide dots */}
          <div className="mt-6 flex justify-center gap-3">
            {slides.map((slide, i) => (
              <button
                key={i}
                className={`h-3 rounded-full transition-all duration-300 ${
                  i === idx 
                    ? `w-8 ${slide.color.replace('text-', 'bg-')}` 
                    : "w-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
                aria-label={i === idx ? "current slide" : `go to slide ${i + 1}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </div>

        {/* Modern footer */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faRocket} className="text-emerald-500 dark:text-emerald-400" />
              <span>Thanks for your patience! Building something amazing...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="animate-pulse">20s</span>
            </div>
          </div>
        </div>

        {/* Enhanced screen reader support */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading your workspace. Currently showing feature {idx + 1} of {slides.length}: {slides[idx].title}. 
          Progress: {progress}% complete. Please wait while we prepare your business management platform.
        </div>
      </div>
    </div>
  );
}