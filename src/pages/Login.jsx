import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../lib/supabase";
import SiteHeader from "../components/SiteHeader.jsx";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !pass) { setErr("Please enter your email and password."); return; }
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      // IMPORTANT: let AfterLogin decide -> /onboard or /app
      nav("/after-login", { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-finovo-light/40">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur">
          {/* LEFT: Form */}
          <div className="p-8 md:p-10 lg:p-12">
            {/* Brand */}
            <div className="flex items-center gap-2 mb-2" aria-hidden="true"></div>

            <h1 className="text-3xl font-bold text-finovo text-center mb-4">Welcome Back!</h1>
            <p className="text-gray-600 mt-1 mb-8 text-center">Let’s get you signed in securely.</p>

            {err && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm">
                {err}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-finovo focus:border-finovo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={pass}
                    onChange={(e)=>setPass(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-finovo focus:border-finovo pr-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-lg bg-finovo text-white font-semibold shadow-lg hover:bg-finovo-dark transition-colors disabled:opacity-70"
              >
                {busy ? "Working…" : "Log in with Email"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Don’t have an account?{" "}
              <Link to="/register" className="font-semibold text-finovo hover:text-finovo-dark">
                Sign Up
              </Link>
            </p>

            <p className="text-[10px] text-gray-400 mt-10">&copy; Finovo {new Date().getFullYear()}</p>
          </div>

          {/* RIGHT: Image panel */}
          <div
            className="relative min-h-[320px] md:min-h-full"
            style={{
              backgroundImage: `url(/assets/imgs/sc-login-bg.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* soft vignette / brand tint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
            <div className="absolute inset-0 ring-1 ring-black/5" />

            {/* Quote card */}
            <div className="absolute bottom-6 left-6 right-6 md:left-8 md:right-8">
              <div className="backdrop-blur bg-white/70 rounded-2xl shadow-xl px-4 py-3 md:px-5 md:py-4">
                <div className="flex items-center gap-3">
                  {/* Profile image */}
                  <img
                    src="/assets/imgs/login-reviewer1.png"
                    alt="Customer reviewer"
                    className="h-10 w-10 rounded-full object-cover border border-gray-300 shadow-sm"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Customer Spotlight</div>
                    <p className="text-xs text-gray-700">
                      “Explore your numbers with clarity—Finovo keeps your books neat,
                      your cashflow visible, and your focus on growth.”
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* /RIGHT */}
        </div>
      </div>
    </div>
  );
}
