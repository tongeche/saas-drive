import { supaAdmin } from "./_supa.js";

async function ensureSignedUrl(supa, tenantSlug, number) {
  const path = `${tenantSlug}/${number}.pdf`;
  let signed = await supa.storage.from("invoices").createSignedUrl(path, 60 * 60 * 24 * 30);
  if (!signed.error && signed.data?.signedUrl) return { path, signedUrl: signed.data.signedUrl };

  const base = process.env.URL || process.env.DEPLOY_URL || "http://localhost:8888";
  const res = await fetch(`${base}/.netlify/functions/invoice-pdf`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ tenant: tenantSlug, invoice_number: number })
  });
  const data = await res.json().catch(async () => ({ error: await res.text() }));
  if (!res.ok) throw new Error(data?.error || "pdf generation failed");
  return { path: data.pdfPath, signedUrl: data.signedUrl };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const b = JSON.parse(event.body || "{}");
    const tenantSlug = (b.tenant || "").trim();
    const invoiceId = (b.invoice_id || "").trim();
    const invoiceNumber = (b.invoice_number || "").trim();
    const overrideEmail = (b.to_email || "").trim();
    if (!tenantSlug) return bad("Missing 'tenant'");

    const supa = supaAdmin();

    // tenant (with branding)
    const tQ = await supa.from("tenants")
      .select("id, slug, business_name, currency, email_from, brand_color, logo_url")
      .eq("slug", tenantSlug).limit(1);
    if (tQ.error) return bad(tQ.error.message);
    const tenant = (tQ.data || [])[0];
    if (!tenant) return bad("tenant not found");

    // invoice
    let inv = null;
    if (invoiceId) {
      const q = await supa.from("invoices")
        .select("id, number, client_id, currency, subtotal, tax_total, total, issue_date, due_date")
        .eq("tenant_id", tenant.id).eq("id", invoiceId).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv && invoiceNumber) {
      const q = await supa.from("invoices")
        .select("id, number, client_id, currency, subtotal, tax_total, total, issue_date, due_date")
        .eq("tenant_id", tenant.id).eq("number", invoiceNumber).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv) return bad("invoice not found");

    // client
    const cQ = await supa.from("clients").select("name, email, billing_address").eq("id", inv.client_id).limit(1);
    const client = (cQ.data || [])[0] || {};
    const toEmail = overrideEmail || client.email;
    if (!toEmail) return bad("client has no email; provide 'to_email'");

    // signed URL
    const { signedUrl } = await ensureSignedUrl(supa, tenant.slug, inv.number);

    // compose email
    const brandColor = (tenant.brand_color || "#111111").trim();
    const subject = `Invoice ${inv.number} — ${tenant.business_name || tenant.slug}`;
    const money = (v) => Number(v || 0).toFixed(2) + (inv.currency ? ` ${inv.currency}` : "");

    const logoHtml = tenant.logo_url
      ? `<div style="margin-bottom:12px;"><img src="${tenant.logo_url}" alt="logo" style="max-height:40px"/></div>`
      : "";

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#222;">
        ${logoHtml}
        <div style="background:${brandColor}; color:#fff; padding:10px 12px; font-weight:700;">
          Invoice ${inv.number} — ${tenant.business_name || tenant.slug}
        </div>
        <div style="padding:12px;">
          <p>Hi ${client.name || ""},</p>
          <p>Please find your invoice <strong>${inv.number}</strong>.</p>
          <ul>
            <li>Issue date: ${inv.issue_date || ""}</li>
            <li>Due date: ${inv.due_date || ""}</li>
            <li>Total: <strong>${money(inv.total)}</strong></li>
          </ul>
          <p><a href="${signedUrl}">View / Download PDF</a></p>
          <p>Thank you.</p>
        </div>
      </div>
    `;

    // send via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = tenant.email_from || process.env.EMAIL_FROM || "no-reply@example.com";
    if (!RESEND_API_KEY) return bad("Missing RESEND_API_KEY");
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [toEmail],
        subject,
        html
      })
    });
    const rj = await r.json().catch(async () => ({ error: await r.text() }));
    const okSend = r.ok && rj?.id;

    // log
    const log = {
      tenant_id: tenant.id,
      invoice_id: inv.id,
      kind: "invoice",
      to_email: toEmail,
      subject,
      status: okSend ? "sent" : "error",
      provider: "resend",
      provider_id: rj?.id || null,
      error: okSend ? null : (rj?.error || rj?.message || "send failed"),
      payload: { signedUrl }
    };
    await supa.from("email_logs").insert(log);

    if (!okSend) return bad(log.error || "send failed");
    return ok({ sent: true, to: toEmail, subject, signedUrl, provider_id: rj.id });
  } catch (e) {
    return bad(e.message || "error");
  }
}
function ok(body){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}}
function bad(msg){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify(typeof msg==='string'?{error:msg}:msg)}}
