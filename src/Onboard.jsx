// src/Onboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./lib/supabase";
import { loadActiveTenantOrFirst } from "./lib/onboarding";
import { getActiveTenant, saveActiveTenant } from "./lib/tenantState";
import OnboardStepper from "./components/onboard/OnboardStepper";
import AnimatedCard from "./components/onboard/AnimatedCard";

function slugify(name) {
  return name
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 40) || "tenant";
}

async function ensureUniqueSlug(base) {
  let candidate = base;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", candidate)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

// UPPERCASE + ensure trailing dash
function normalizePrefix(v) {
  let s = (v || "INV").toString().trim().toUpperCase();
  if (!s.endsWith("-")) s += "-";
  return s;
}

// drop empty strings so DB defaults work
function prune(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

/* -------------------- MICRO CONFETTI (no deps) -------------------- */
function MicroConfetti({ count = 28, duration = 1200 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const colors = [
      "#26BA99", "#10B981", "#3B82F6", "#6366F1",
      "#F59E0B", "#EF4444", "#14B8A6", "#8B5CF6",
    ];
    const gen = Array.from({ length: count }).map((_, i) => {
      // random vector for each piece (slight outward + downward)
      const angle = (Math.random() * Math.PI) - Math.PI / 2; // left/up to right/up
      const speed = 80 + Math.random() * 120;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed + 120; // bias downwards
      return {
        id: i,
        left: 50 + (Math.random() * 40 - 20), // around center %
        top: 32 + Math.random() * 8,          // near the header icon
        rotate: Math.floor(Math.random() * 360),
        color: colors[i % colors.length],
        delay: Math.random() * 0.2, // 0–20% of duration
        dx,
        dy,
      };
    });
    setPieces(gen);
    const t = setTimeout(() => setPieces([]), duration + 500);
    return () => clearTimeout(t);
  }, [count, duration]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <style>{`
        @keyframes confetti-burst {
          0%   { opacity: 1; transform: translate(0,0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(720deg) scale(0.9); }
        }
      `}</style>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: "7px",
            height: "11px",
            background: p.color,
            borderRadius: "1px",
            transform: `rotate(${p.rotate}deg)`,
            transformOrigin: "center",
            animation: `confetti-burst ${duration}ms ease-out ${Math.round(p.delay * duration)}ms forwards`,
            // custom vector per piece
            ["--dx"]: `${p.dx}px`,
            ["--dy"]: `${p.dy}px`,
            boxShadow: "0 0 0.5px rgba(0,0,0,0.15)",
          }}
        />
      ))}
    </div>
  );
}
/* ------------------------------------------------------------------ */

export default function Onboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // Steps: 0=Basics, 1=Contact, 2=Invoicing, 3=Review
  const [step, setStep] = useState(0);
  const totalSteps = 4;

  // Step state
  const [company, setCompany] = useState({ business_name: "", currency: "EUR", invoice_prefix: "INV" });
  const [slugPreview, setSlugPreview] = useState("");
  const [contact, setContact] = useState({
    owner_email: "",
    tax_id: "",
    whatsapp_country_code: "",
    phone: "",
    address: "",
    timezone: "Europe/Lisbon",
  });
  const [prefs, setPrefs] = useState({
    last_invoice_no: 0,
    pdf_footer: "",
    brand_color: "#26BA99",
    logo_url: "",
  });

  // NEW: success state (show celebratory screen instead of instant redirect)
  const [created, setCreated] = useState(false);
  const [createdTenant, setCreatedTenant] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setErr("");
      let { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) {
        await new Promise(r => setTimeout(r, 60));
        ({ data: { session } = {} } = await supabase.auth.getSession());
      }
      if (!session) { nav("/login", { replace: true }); return; }

      if (session?.user?.email) {
        setContact(c => ({ ...c, owner_email: c.owner_email || session.user.email }));
      }

      try {
        const t = await loadActiveTenantOrFirst(getActiveTenant);
        if (!mounted) return;
        if (t) { saveActiveTenant(t); nav("/app", { replace: true }); return; }
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load onboarding.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) nav("/login", { replace: true });
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [nav]);

  useEffect(() => {
    setSlugPreview(slugify(company.business_name || ""));
  }, [company.business_name]);

  function nextFromBasics(e) {
    e?.preventDefault?.();
    setErr("");
    const name = company.business_name?.trim();
    if (!name) { setErr("Company name is required."); return; }
    setStep(1);
  }
  function nextFromContact(e) { e?.preventDefault?.(); setErr(""); setStep(2); }
  function nextFromPrefs(e) { e?.preventDefault?.(); setErr(""); setStep(3); }

  const nextInvoiceSample = useMemo(() => {
    const basePrefix = normalizePrefix(company.invoice_prefix).replace(/-+$/g, "");
    const nextNo = (Number.isFinite(+prefs.last_invoice_no) ? (+prefs.last_invoice_no + 1) : 1);
    return `${basePrefix ? basePrefix + "-" : ""}${String(nextNo).padStart(4, "0")}`;
  }, [company.invoice_prefix, prefs.last_invoice_no]);

  async function createWorkspace(e) {
    e?.preventDefault?.();
    setErr("");

    const name = company.business_name?.trim();
    if (!name) { setErr("Company name is required."); setStep(0); return; }

    try {
      setSubmitting(true);
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const base = slugify(name);
      const slug = await ensureUniqueSlug(base);
      const normalizedPrefix = normalizePrefix(company.invoice_prefix);

      const rawPayload = {
        business_name: name,
        slug,
        currency: (company.currency || "EUR").toUpperCase(),
        invoice_prefix: normalizedPrefix,
        number_prefix_invoice: normalizedPrefix,
        timezone: contact.timezone || "Europe/Lisbon",
        owner_email: contact.owner_email || null,
        tax_id: contact.tax_id || null,
        whatsapp_country_code: contact.whatsapp_country_code || null,
        phone: contact.phone || null,
        address: contact.address || null,
        last_invoice_no: Number.isFinite(+prefs.last_invoice_no) ? +prefs.last_invoice_no : 0,
        pdf_footer: prefs.pdf_footer || null,
        brand_color: prefs.brand_color || null,
        logo_url: prefs.logo_url || null,
      };

      const payload = prune(rawPayload);

      const { data: tenant, error: tErr } = await supabase
        .from("tenants")
        .insert(payload)
        .select("*")
        .maybeSingle();
      if (tErr) throw tErr;

      const { error: mErr } = await supabase
        .from("user_tenants")
        .insert({ user_id: session.user.id, tenant_id: tenant.id, role: "owner" });
      if (mErr) throw mErr;

      saveActiveTenant(tenant);

      // 💥 DO NOT redirect immediately — show success first
      setCreatedTenant(tenant);
      setCreated(true);
    } catch (e) {
      if (e?.code === "23505") {
        setErr("That workspace URL is taken. Try a different company name.");
        setStep(0);
      } else {
        setErr(e.message || "Failed to create workspace.");
      }
    } finally {
      setSubmitting(false);
    }
  }

// --- Refactored Success screen component ---
function SuccessScreen({ tenant }) {
  return (
    <div className="min-h-screen bg-[#E9F5EE] flex items-center justify-center p-6">
      <div className="w-full max-w-xl mx-auto text-center rounded-3xl bg-white shadow-2xl p-8 sm:p-12 border border-gray-200">
        
        {/* Animated Checkmark */}
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-50 grid place-items-center relative">
          <svg viewBox="0 0 52 52" className="h-12 w-12 text-emerald-500" aria-hidden="true">
            <path
              d="M14 27l8 8 16-18"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="stroke-dasharray" from="0,60" to="60,0" dur="0.8s" fill="freeze" />
            </path>
          </svg>
        </div>

        {/* Header Section */}
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Success! Your workspace is ready.
        </h1>
        <p className="mt-3 text-gray-600 max-w-md mx-auto">
          Welcome aboard! Your new workspace, **{tenant?.business_name}**, has been successfully created and is ready for action.
        </p>

        {tenant?.slug && (
          <div className="mt-5 inline-flex items-center space-x-2 text-sm text-gray-500">
            <span className="font-semibold">URL:</span>
            <span className="font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-800 break-all">{tenant.slug}</span>
          </div>
        )}

        <hr className="my-8 border-gray-200" />
        
        {/* Call-to-action (CTA) Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => nav("app", { replace: true })}
            className="w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition duration-300 shadow-lg transform hover:scale-105"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => { window.location.href = "/#features"; }}
            className="w-full px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition duration-300"
          >
            Explore Products
          </button>
          <button
            onClick={() => { window.location.href = "/#contact"; }}
            className="w-full px-6 py-3 rounded-xl border border-amber-400 bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 transition duration-300"
          >
            Upgrade Plan
          </button>
        </div>

        {/* Tip/Info Section */}
        <p className="mt-6 text-sm text-gray-500">
          You can manage your workspace settings anytime under **Company** → **Preferences**.
        </p>
      </div>
    </div>
  );
}

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-gray-600 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  if (created) {
    return <SuccessScreen tenant={createdTenant} />;
  }

  const titles = ["Company basics", "Identity & contact", "Invoicing & branding", "Review & finish"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        <OnboardStepper step={step} total={totalSteps} title={titles[step]} />

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm">
            {err}
          </div>
        )}

        {step === 0 && (
          <AnimatedCard inView>
            <h1 className="text-xl font-semibold">Name your company</h1>
            <p className="text-sm text-gray-600 mb-4">This will appear on invoices and your workspace URL. You can change it later.</p>

            <form onSubmit={nextFromBasics} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                <input
                  value={company.business_name}
                  onChange={(e) => setCompany(c => ({ ...c, business_name: e.target.value }))}
                  placeholder="Acme Ltd"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-finovo"
                />
                {slugPreview && (
                  <p className="mt-1 text-xs text-gray-500">
                    Workspace URL: <span className="font-mono">{slugPreview}</span>
                    <span className="text-gray-400"> (we’ll ensure it’s unique)</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    value={company.currency}
                    onChange={(e) => setCompany(c => ({ ...c, currency: e.target.value }))}
                    placeholder="EUR"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice prefix</label>
                  <input
                    value={company.invoice_prefix}
                    onChange={(e) => setCompany(c => ({ ...c, invoice_prefix: e.target.value }))}
                    placeholder="INV"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">We’ll format it as {normalizePrefix(company.invoice_prefix)} for numbering.</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button type="button" onClick={() => nav("/login")} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-finovo text-white font-medium hover:opacity-95">Continue</button>
              </div>
            </form>
          </AnimatedCard>
        )}

        {step === 1 && (
          <AnimatedCard inView>
            <h1 className="text-xl font-semibold">How can clients reach you?</h1>
            <p className="text-sm text-gray-600 mb-4">Tell us how to display your company on invoices.</p>

            <form onSubmit={nextFromContact} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner email</label>
                  <input
                    type="email"
                    value={contact.owner_email}
                    onChange={(e) => setContact(c => ({ ...c, owner_email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                  <input
                    value={contact.tax_id}
                    onChange={(e) => setContact(c => ({ ...c, tax_id: e.target.value }))}
                    placeholder="VAT / NIF"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp code</label>
                  <input
                    value={contact.whatsapp_country_code}
                    onChange={(e) => setContact(c => ({ ...c, whatsapp_country_code: e.target.value }))}
                    placeholder="+351"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={contact.phone}
                    onChange={(e) => setContact(c => ({ ...c, phone: e.target.value }))}
                    placeholder="912 345 678"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={contact.address}
                  onChange={(e) => setContact(c => ({ ...c, address: e.target.value }))}
                  placeholder="Street, City, ZIP, Country"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={contact.timezone}
                  onChange={(e) => setContact(c => ({ ...c, timezone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="Europe/Lisbon">Europe/Lisbon</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Madrid">Europe/Madrid</option>
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button type="button" onClick={() => setStep(0)} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-finovo text-white font-medium hover:opacity-95">Continue</button>
              </div>
            </form>
          </AnimatedCard>
        )}

        {step === 2 && (
          <AnimatedCard inView>
            <h1 className="text-xl font-semibold">Invoicing & branding</h1>
            <p className="text-sm text-gray-600 mb-4">Choose your numbering start, add a footer, and set your brand look.</p>

            <form onSubmit={nextFromPrefs} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last invoice number</label>
                  <input
                    type="number"
                    min={0}
                    value={prefs.last_invoice_no}
                    onChange={(e) => setPrefs(p => ({ ...p, last_invoice_no: parseInt(e.target.value || "0", 10) }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Next will be: <span className="font-mono">{nextInvoiceSample}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand color</label>
                  <input
                    type="color"
                    value={prefs.brand_color}
                    onChange={(e) => setPrefs(p => ({ ...p, brand_color: e.target.value }))}
                    className="w-full h-[42px] rounded-lg border border-gray-300 p-1"
                    title="Pick your brand color"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  value={prefs.logo_url}
                  onChange={(e) => setPrefs(p => ({ ...p, logo_url: e.target.value }))}
                  placeholder="https://…/logo.png"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                {prefs.logo_url ? (
                  <div className="mt-2">
                    <img
                      src={prefs.logo_url}
                      alt="Logo preview"
                      className="h-10 object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF footer</label>
                <textarea
                  value={prefs.pdf_footer}
                  onChange={(e) => setPrefs(p => ({ ...p, pdf_footer: e.target.value }))}
                  placeholder="Thanks for your business. Payment due in 14 days."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="mt-1 text-xs text-gray-500">{prefs.pdf_footer.length}/300</div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-finovo text-white font-medium hover:opacity-95">Continue</button>
              </div>
            </form>
          </AnimatedCard>
        )}

        {step === 3 && (
          <AnimatedCard inView>
            <h1 className="text-xl font-semibold">Review & finish</h1>
            <p className="text-sm text-gray-600 mb-4">Double-check your details. You can edit any section.</p>

            <div className="space-y-4 text-sm">
              <section className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Company basics</h3>
                  <button onClick={() => setStep(0)} className="text-finovo hover:underline">Edit</button>
                </div>
                <div>Business name: <span className="font-medium">{company.business_name || "—"}</span></div>
                <div>Currency: <span className="font-medium">{(company.currency || "EUR").toUpperCase()}</span></div>
                <div>Invoice prefix: <span className="font-mono">{normalizePrefix(company.invoice_prefix)}</span></div>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Identity & contact</h3>
                  <button onClick={() => setStep(1)} className="text-finovo hover:underline">Edit</button>
                </div>
                <div>Email: <span className="font-medium">{contact.owner_email || "—"}</span></div>
                <div>Tax ID: <span className="font-medium">{contact.tax_id || "—"}</span></div>
                <div>WhatsApp: <span className="font-medium">{contact.whatsapp_country_code || ""} {contact.phone || ""}</span></div>
                <div>Address: <span className="font-medium">{contact.address || "—"}</span></div>
                <div>Timezone: <span className="font-medium">{contact.timezone || "Europe/Lisbon"}</span></div>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Invoicing & branding</h3>
                  <button onClick={() => setStep(2)} className="text-finovo hover:underline">Edit</button>
                </div>
                <div>Last invoice no: <span className="font-medium">{prefs.last_invoice_no || 0}</span></div>
                <div>Next sample: <span className="font-mono">{nextInvoiceSample}</span></div>
                <div>Brand color: <span className="inline-block align-middle h-3 w-6 rounded" style={{ background: prefs.brand_color }} /> <span className="ml-1">{prefs.brand_color}</span></div>
                <div>Logo URL: <span className="font-medium truncate">{prefs.logo_url || "—"}</span></div>
                <div>PDF footer: <span className="font-medium">{prefs.pdf_footer || "—"}</span></div>
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button type="button" onClick={() => setStep(2)} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={createWorkspace}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-finovo text-white font-medium hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Creating…" : "Create workspace"}
              </button>
            </div>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
}
