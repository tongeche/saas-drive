// netlify/functions/invoice-pdf.js
import { supaAdmin } from "./_supa.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function money(v, cur) {
  const n = Number(v || 0);
  return `${n.toFixed(2)}${cur ? ` ${cur}` : ""}`;
}

async function makePdfBuffer({ tenant, inv, client, items }) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 812;
  const lh = 14;

  // Header
  page.drawText(tenant.business_name || tenant.slug, { x: margin, y, size: 20, font: fontBold });
  const invTitle = `INVOICE ${inv.number}`;
  const wTitle = font.widthOfTextAtSize(invTitle, 10);
  page.drawText(invTitle, { x: 595.28 - margin - wTitle, y: y + 6, size: 10, font });
  y -= 28;

  const right = (txt) => {
    const w = font.widthOfTextAtSize(txt, 10);
    page.drawText(txt, { x: 595.28 - margin - w, y, size: 10, font });
    y -= lh;
  };
  right(`Issue: ${inv.issue_date || ""}`);
  right(`Due:   ${inv.due_date || ""}`);
  y -= 8;

  // Bill To
  page.drawText("Bill To:", { x: margin, y, size: 12, font: fontBold }); y -= lh;
  if (client?.name)            { page.drawText(String(client.name),            { x: margin, y, size: 11, font }); y -= lh; }
  if (client?.billing_address) { page.drawText(String(client.billing_address), { x: margin, y, size: 11, font }); y -= lh; }
  if (client?.email)           { page.drawText(String(client.email),           { x: margin, y, size: 11, font }); y -= lh; }
  y -= 6;

  // Items header
  const line = (x1,y1,x2,y2)=>page.drawLine({ start:{x:x1,y:y1}, end:{x:x2,y:y2}, thickness:1, color: rgb(0,0,0) });
  line(margin, y, 595.28 - margin, y); y -= lh;
  page.drawText("Description", { x: margin, y, size: 10, font: fontBold });
  page.drawText("Qty",         { x: 300,   y, size: 10, font: fontBold });
  page.drawText("Unit",        { x: 360,   y, size: 10, font: fontBold });
  page.drawText("Total",       { x: 450,   y, size: 10, font: fontBold });
  y -= lh;

  // Items
  const addPageIfNeeded = () => {
    if (y < 80) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 812;
    }
  };
  for (const it of (items || [])) {
    addPageIfNeeded();
    page.drawText(String(it.description ?? ""),             { x: margin, y, size: 10, font, maxWidth: 240 });
    page.drawText(String(Number(it.qty || 0)),              { x: 300,    y, size: 10, font });
    page.drawText(money(it.unit_price, inv.currency),       { x: 360,    y, size: 10, font });
    page.drawText(money(it.line_total, inv.currency),       { x: 450,    y, size: 10, font });
    y -= lh;
  }

  // Totals
  y -= 6; line(350, y, 595.28 - margin, y); y -= lh;
  const totalRow = (label, val, bold=false) => {
    const f = bold ? fontBold : font;
    const lw = f.widthOfTextAtSize(label, 10);
    const vw = f.widthOfTextAtSize(money(val, inv.currency), 10);
    page.drawText(label,                { x: 360 + (80 - lw), y, size: 10, font: f });
    page.drawText(money(val, inv.currency), { x: 450 + (95 - vw), y, size: 10, font: f });
    y -= lh;
  };
  totalRow("Subtotal", inv.subtotal);
  totalRow("Tax",      inv.tax_total);
  totalRow("Total",    inv.total, true);

  if (inv.notes) {
    y -= 10;
    page.drawText(`Notes: ${String(inv.notes)}`, { x: margin, y, size: 10, font, maxWidth: 495 });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const b = JSON.parse(event.body || "{}");

    const tenantSlug = (b.tenant || "").trim();
    const invoiceId = (b.invoice_id || "").trim();
    const invoiceNumber = (b.invoice_number || b.number || "").trim();
    if (!tenantSlug) return bad("Missing 'tenant'");

    const supa = supaAdmin();

    // Tenant
    const tQ = await supa.from("tenants")
      .select("id, slug, business_name, currency")
      .eq("slug", tenantSlug).limit(1);
    if (tQ.error) return bad(tQ.error.message);
    const tenant = (tQ.data || [])[0];
    if (!tenant) return bad("tenant not found");

    // Invoice lookup (arrays + limit(1))
    let inv = null; const tried = [];
    if (invoiceId) {
      tried.push({ by: "tenant+id", value: `${tenant.id}+${invoiceId}` });
      const q = await supa.from("invoices")
        .select("id, tenant_id, client_id, number, issue_date, due_date, currency, subtotal, tax_total, total, notes")
        .eq("tenant_id", tenant.id).eq("id", invoiceId).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv && invoiceNumber) {
      tried.push({ by: "tenant+number", value: `${tenant.id}+${invoiceNumber}` });
      const q = await supa.from("invoices")
        .select("id, tenant_id, client_id, number, issue_date, due_date, currency, subtotal, tax_total, total, notes")
        .eq("tenant_id", tenant.id).eq("number", invoiceNumber).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv && invoiceId) {
      tried.push({ by: "id-only", value: invoiceId });
      const q = await supa.from("invoices")
        .select("id, tenant_id, client_id, number, issue_date, due_date, currency, subtotal, tax_total, total, notes")
        .eq("id", invoiceId).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv) {
      const recent = await supa.from("invoices")
        .select("id, number, tenant_id, created_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return bad({ message: "invoice not found", looked_for: { tenant_slug: tenantSlug, tenant_id: tenant.id, invoice_id: invoiceId || null, invoice_number: invoiceNumber || null, tried }, recent_invoices: recent.data || [] });
    }

    // Client + items
    const cQ = await supa.from("clients")
      .select("name, billing_address, email")
      .eq("id", inv.client_id).limit(1);
    if (cQ.error) return bad(cQ.error.message);
    const client = (cQ.data || [])[0] || null;

    const itQ = await supa.from("invoice_items")
      .select("description, qty, unit_price, line_total, position")
      .eq("invoice_id", inv.id)
      .order("position", { ascending: true });
    if (itQ.error) return bad(itQ.error.message);
    const items = itQ.data || [];

    // Ensure bucket exists (idempotent) -----
    const BUCKET = process.env.INVOICE_BUCKET || "invoices";
    let exists = false;

    // Try getBucket; if error, probe listBuckets; if still missing, create
    const g = await supa.storage.getBucket(BUCKET);
    if (!g.error && g.data) {
      exists = true;
    } else {
      const lb = await supa.storage.listBuckets();
      if (lb.error) return bad("storage listBuckets: " + lb.error.message);
      exists = (lb.data || []).some(b => b.name === BUCKET);
      if (!exists) {
        const mk = await supa.storage.createBucket(BUCKET, { public: false });
        if (mk.error && !/already exists/i.test(mk.error.message || "")) {
          return bad("storage createBucket: " + mk.error.message);
        }
      }
    }
    // ---------------------------------------

    // Build & store PDF
    const pdfBuffer = await makePdfBuffer({ tenant, inv, client, items });
    const path = `${tenant.slug}/${inv.number}.pdf`;
    const up = await supa.storage.from(BUCKET).upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true
    });
    if (up.error) return bad(up.error.message);

    const signed = await supa.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signed.error) return bad(signed.error.message);

    return ok({ id: inv.id, number: inv.number, pdfPath: path, signedUrl: signed.data.signedUrl });
  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(body){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}}
function bad(msg){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify(typeof msg==='string'?{error:msg}:msg)}}
