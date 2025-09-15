import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import SiteHeader from "../components/SiteHeader.jsx";

export default function Register() {
  const nav = useNavigate();

  // Finovo palette
  const finovo = "#3c6b5b";
  const finovoGrad = "#6fb49f";
  const finovoLight = "#d9f0e1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleEmailSignup(e) {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg({ type: "error", text: "Email and password are required." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/login" },
      });
      if (error) throw error;

      // background onboarding (non-blocking)
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      fetch("/.netlify/functions/onboard-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          business_name: null,
          owner_email: email,
          phone_number: null,
        }),
      }).catch(() => {});

      if (!sess?.session) {
        setMsg({
          type: "success",
          text: "Account created. Check your email to confirm, then sign in.",
        });
      } else {
        nav("/app");
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Sign up failed." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/app",
          queryParams: { prompt: "select_account" },
        },
      });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Google sign-in failed." });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2 bg-white">
          {/* LEFT */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm">
              <div className="flex items-center justify-center mb-6">
              
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">
                Sign up for Free
              </h1>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                Create your Finovo account in seconds.
              </p>

              {msg && (
                <div
                  className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                    msg.type === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-white font-semibold shadow-md hover:opacity-90 transition disabled:opacity-60"
                  style={{ backgroundColor: finovo }}
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                <span className="px-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 dark:text-gray-400">
                  or
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              </div>

              <button
                onClick={handleGoogle}
                className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-medium dark:text-white flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <i className="fa-brands fa-google text-base"></i>
                Sign up with Google
              </button>

              <div className="flex items-center justify-between text-sm mt-6">
                <Link to="/" className="text-gray-500 dark:text-gray-400 hover:underline">
                  ← Website
                </Link>
                <div>
                  Have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium hover:underline"
                    style={{ color: finovo }}
                  >
                    Sign in →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div
            className="relative p-10 md:p-12 text-white"
            style={{
              background: `linear-gradient(135deg, ${finovo} 0%, ${finovoGrad} 100%)`,
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-soft-light bg-[radial-gradient(1200px_400px_at_-10%_10%,white,transparent)]" />
            <div className="relative max-w-sm ml-auto mr-0">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
  Run your operations effortlessly
</h2>
<p className="text-white/90 mb-6 text-sm">
  Secure and trusted by 100s of customers.
</p>

<ul className="space-y-5">
  <Feature title="World-class invoicing">
    Generate branded PDFs and share in one click.
  </Feature>

  <Feature title="Extensible automations">
    Quotation → Invoice flows and scheduled jobs.
  </Feature>

  {/* (Supabase item removed as requested) */}

  <Feature title="Preview & collaborate">
    Keep clients and teammates on the same page.
  </Feature>

  <Feature title="Share instantly">
    Send via WhatsApp or email with smart links.
  </Feature>
</ul>

              <div className="mt-8 rounded-xl bg-white/10 backdrop-blur p-4 text-sm">
                <p className="opacity-90">
                  Tip: You can add your brand and colors later in{" "}
                  <span className="font-semibold">Tenant Settings</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <i className="fa-solid fa-check text-white text-lg"></i>
      </span>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-white/90 text-sm">{children}</div>
      </div>
    </li>
  );
}

