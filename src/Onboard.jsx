import React, { useEffect, useMemo, useRef, useState } from "react";
import supabase from "./lib/supabase";
import { getActiveTenant, saveActiveTenant } from "./lib/tenantState";
import ProgressChecklist from "./components/ProgressChecklist";
import CsvClientImport from "./components/CsvClientImport";
import {
  debounce,
  loadActiveTenantOrFirst,
  saveTenantPatch,
  computeProgress,
  ensureDemoClient,
  createDraftInvoice,
} from "./lib/onboarding";

// Finovo colors
const cBrand = "#3c6b5b";
const cBrandLight = "#d9f0e1";

export default function Onboard() {
  const [tenant, setTenant] = useState(null);
  const [hasClient, setHasClient] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [step, setStep] = useState(1);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState(null);
  const prevProgressRef = useRef(0);

  const debouncedSave = useRef(
    debounce(async (id, patch) => {
      try {
        const saved = await saveTenantPatch(id, patch);
        setTenant(saved);
        setToast("Saved");
        setTimeout(() => setToast(null), 900);
      } catch (e) {
        console.error(e);
        setToast("Save failed");
      }
    }, 500)
  ).current;

  // Load active tenant and basic stats
  useEffect(() => {
    (async () => {
      try {
        const t = await loadActiveTenantOrFirst(getActiveTenant);
        if (!t) return;
        setTenant(t);
        saveActiveTenant({ slug: t.slug, id: t.id });

        const [{ count: cc }, { count: ic }] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", t.id),
          supabase.from("invoices").select("*", { count: "exact", head: true }).eq("tenant_id", t.id),
        ]);
        setHasClient((cc || 0) > 0);
        setHasInvoice((ic || 0) > 0);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const progress = useMemo(
    () => computeProgress({ tenant, hasClient, hasInvoice }),
    [tenant, hasClient, hasInvoice]
  );

  // CONFETTI when progress hits 100
  useEffect(() => {
    const prev = prevProgressRef.current;
    if (progress === 100 && prev < 100) {
      (async () => {
        try {
          const { default: confetti } = await import("canvas-confetti");
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 } });
        } catch (e) {
          // ignore if dep missing in dev
          console.warn("Confetti unavailable:", e.message);
        }
      })();
    }
    prevProgressRef.current = progress;
  }, [progress]);

  function patch(field, value) {
    if (!tenant) return;
    const next = { ...tenant, [field]: value };
    setTenant(next);
    debouncedSave(tenant.id, { [field]: value });
  }

  // Extract dominant color from uploaded logo (before upload)
  async function extractDominantColor(file) {
    try {
      const bmp = await createImageBitmap(file);
      const w = Math.min(120, bmp.width || 120);
      const h = Math.min(120, bmp.height || 120);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bmp, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, c = 0;
      const stride = 8; // sample every 8th pixel
      for (let i = 0; i < img.length; i += 4 * stride) {
        r += img[i]; g += img[i + 1]; b += img[i + 2]; c++;
      }
      if (!c) return null;
      r = Math.round(r / c); g = Math.round(g / c); b = Math.round(b / c);
      const toHex = (x) => x.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (e) {
      console.warn("Color extract failed:", e.message);
      return null;
    }
  }

  async function onUploadLogo(e) {
    if (!tenant) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setWorking(true);
    try {
      // 1) compute color first and save it
      const color = await extractDominantColor(file);
      if (color) patch("brand_color", color);

      // 2) upload logo
      const path = `${tenant.slug}/logo.${file.name.split(".").pop() || "png"}`;
      const { error: upErr } = await supabase.storage.from("brand").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr && upErr.message?.includes("already exists") === false) throw upErr;

      const { data: pub } = supabase.storage.from("brand").getPublicUrl(path);
      patch("logo_url", pub.publicUrl);
    } catch (e) {
      console.error(e);
      setToast("Upload failed");
    } finally {
      setWorking(false);
    }
  }

  async function addDemoClient() {
    if (!tenant) return;
    setWorking(true);
    try {
      await ensureDemoClient(tenant.id);
      setHasClient(true);
      setToast("Demo client added");
    } catch (e) {
      console.error(e);
      setToast("Failed to add demo client");
    } finally {
      setWorking(false);
    }
  }

  async function createAndPdf() {
    if (!tenant) return;
    setWorking(true);
    try {
      const client = await ensureDemoClient(tenant.id);
      const { invoice } = await createDraftInvoice(tenant, client, tenant.currency || "EUR");

      // request PDF from your Netlify function
      const res = await fetch("/.netlify/functions/invoice-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant: tenant.slug, invoice_id: invoice.id, invoice_number: invoice.number }),
      });
      const data = await res.json();

      if (res.ok && (data?.signedUrl || data?.pdfUrl)) {
        window.open(data.signedUrl || data.pdfUrl, "_blank");
        setHasInvoice(true);
        setToast("PDF generated");
      } else {
        throw new Error(data?.error || "PDF failed");
      }
    } catch (e) {
      console.error(e);
      setToast("Could not generate PDF");
    } finally {
      setWorking(false);
    }
  }

  const items = [
    { label: "Set business basics", done: !!(tenant?.business_name && tenant?.currency && tenant?.invoice_prefix) },
    { label: "Add brand (logo/color/footer)", done: !!(tenant?.brand_color || tenant?.logo_url || tenant?.footer_note) },
    { label: "Add a client", done: hasClient },
    { label: "Send your first invoice", done: hasInvoice },
  ];

  if (!tenant) {
    return (
      <div className="p-10 text-center text-gray-600">
        <div className="animate-pulse inline-block h-3 w-3 rounded-full bg-gray-300 mr-2" />
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <span className="font-semibold text-gray-900">Onboarding</span>
          <span className="text-gray-400">·</span>
          <Stepper step={step} setStep={setStep} />
          <div className="ml-auto text-sm text-gray-500">
            {toast && <span className="rounded-md bg-gray-100 px-2 py-1">{toast}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
        {/* Left column: cards */}
        <div className="space-y-6">
          {step === 1 && (
            <Card title="Basics" subtitle="We’ll use these to generate invoices.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Text label="Business name" value={tenant.business_name || ""} onChange={(v) => patch("business_name", v)} />
                <Text label="Invoice prefix" value={tenant.invoice_prefix || "INV"} onChange={(v) => patch("invoice_prefix", v.toUpperCase())} />
                <Text label="Default currency" value={tenant.currency || "EUR"} onChange={(v) => patch("currency", v.toUpperCase())} />
                <Text label="WhatsApp country code" placeholder="+254" value={tenant.whatsapp_country || ""} onChange={(v) => patch("whatsapp_country", v)} />
              </div>
              <div className="flex justify-end">
                <NextButton onClick={() => setStep(2)} />
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card title="Brand" subtitle="Make it yours. You can change this anytime.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Text label="Footer note" placeholder="e.g. Thank you for your business." value={tenant.footer_note || ""} onChange={(v) => patch("footer_note", v)} />
                <Text label="Brand color" value={tenant.brand_color || cBrand} onChange={(v) => patch("brand_color", v)} type="color" />
                <div>
                  <label className="text-sm text-gray-600">Logo</label>
                  <div className="mt-1 flex items-center gap-3">
                    {tenant.logo_url ? (
                      <img src={tenant.logo_url} alt="logo" className="h-10 w-10 rounded object-cover ring-1 ring-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-100 ring-1 ring-gray-200" />
                    )}
                    <input type="file" accept="image/*" onChange={onUploadLogo} className="text-sm" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Tip: We auto-pick a brand color from your logo. You can tweak it.
                  </p>
                </div>
              </div>
              <div className="flex justify-between">
                <BackButton onClick={() => setStep(1)} />
                <NextButton onClick={() => setStep(3)} />
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card title="Add a client" subtitle="Add one client (or import a CSV) and you’re ready to send.">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={addDemoClient}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
                    disabled={working}
                  >
                    Add demo client
                  </button>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                    title="Open app to add real clients"
                  >
                    Open app to add real client →
                  </a>
                </div>

                {/* CSV importer */}
                <CsvClientImport
                  tenantId={tenant.id}
                  onDone={() => {
                    setHasClient(true);
                    setToast("Clients imported");
                  }}
                />
              </div>
              <div className="flex justify-between mt-4">
                <BackButton onClick={() => setStep(2)} />
                <NextButton onClick={() => setStep(4)} />
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card title="Send your first invoice" subtitle="We’ll create a tiny draft and show you the PDF.">
              <div className="flex flex-col md:flex-row items-start gap-3">
                <button
                  type="button"
                  onClick={createAndPdf}
                  className="inline-flex items-center gap-2 rounded-lg bg-[--finovo] px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
                  style={{ ["--finovo"]: tenant.brand_color || cBrand }}
                  disabled={working}
                >
                  Create draft & open PDF
                </button>
                <a href="/" className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">I’ll do it later</a>
              </div>
              <div className="flex justify-start mt-4">
                <BackButton onClick={() => setStep(3)} />
              </div>
            </Card>
          )}
        </div>

        {/* Right column: live preview + checklist */}
        <div className="space-y-6">
          <InvoicePreview tenant={tenant} />
          <ProgressChecklist progress={progress} items={[
            { label: "Set business basics", done: !!(tenant?.business_name && tenant?.currency && tenant?.invoice_prefix) },
            { label: "Add brand (logo/color/footer)", done: !!(tenant?.brand_color || tenant?.logo_url || tenant?.footer_note) },
            { label: "Add a client", done: hasClient },
            { label: "Send your first invoice", done: hasInvoice },
          ]} />
        </div>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */

function Stepper({ step, setStep }) {
  const steps = ["Basics", "Brand", "Client", "Send"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <button
            key={label}
            onClick={() => setStep(n)}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm transition ${
              active ? "bg-[--finovo]/10 text-[--finovo]" : done ? "text-gray-600" : "text-gray-400"
            }`}
            style={{ ["--finovo"]: cBrand }}
          >
            <span
              className={`inline-grid place-content-center h-5 w-5 rounded-full text-xs ${
                active ? "bg-[--finovo] text-white" : done ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
              }`}
              style={{ ["--finovo"]: cBrand }}
            >
              {n}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/70 backdrop-blur p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Text({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[--finovo]/30"
        style={{ ["--finovo"]: cBrand }}
      />
    </label>
  );
}

function NextButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-[--finovo] px-4 py-2 text-white hover:opacity-90"
      style={{ ["--finovo"]: cBrand }}
    >
      Continue →
    </button>
  );
}
function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
    >
      ← Back
    </button>
  );
}

function InvoicePreview({ tenant }) {
  const clr = tenant.brand_color || cBrand;
  const foot = tenant.footer_note || "Thank you for your business.";
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
      <div className="h-2" style={{ backgroundColor: clr }} />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt="logo" className="h-10 w-10 rounded object-cover ring-1 ring-gray-200" />
            ) : (
              <div className="h-10 w-10 rounded bg-gray-100 ring-1 ring-gray-200" />
            )}
            <div>
              <div className="font-semibold text-gray-900">{tenant.business_name || "Your Business"}</div>
              <div className="text-xs text-gray-500">{tenant.currency || "EUR"} · {tenant.invoice_prefix || "INV"}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Invoice</div>
            <div className="font-semibold text-gray-800">{(tenant.invoice_prefix || "INV")}-000001</div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Unit</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">Service A</td>
                <td className="px-3 py-2 text-right">1</td>
                <td className="px-3 py-2 text-right">100.00</td>
                <td className="px-3 py-2 text-right">100.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-6">
          <dl className="text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium text-gray-800">100.00 {(tenant.currency || "EUR")}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-gray-500">Tax</dt>
              <dd className="font-medium text-gray-800">23.00 {(tenant.currency || "EUR")}</dd>
            </div>
            <div className="mt-1 border-t pt-1 flex justify-between gap-6">
              <dt className="text-gray-900 font-semibold">Total</dt>
              <dd className="text-gray-900 font-semibold">123.00 {(tenant.currency || "EUR")}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 px-3 py-2 text-center text-sm text-gray-600">{foot}</div>
      </div>
      <div className="h-2" style={{ backgroundColor: cBrandLight }} />
    </div>
  );
}
