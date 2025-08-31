// netlify/functions/invoice-pdf.js
import { supaAdmin } from "./_supa.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function money(v, cur) { const n = Number(v || 0); return `${n.toFixed(2)}${cur ? ` ${cur}` : ""}`; }
function hexToRgb(hex, fallback = rgb(0,0,0)) {
  if (!hex) return fallback;
  const m = String(hex).trim().replace('#','');
  if (![3,6].includes(m.length)) return fallback;
  const to = (s)=>parseInt(s.length===1?s+s:s,16)/255;
  const r = to(m.length===3?m[0]:m.slice(0,2));
  const g = to(m.length===3?m[1]:m.slice(2,4));
  const b = to(m.length===3?m[2]:m.slice(4,6));
  return rgb(r,g,b);
}
async function fetchImageBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}
// Lightweight QR: use Google Chart PNG (no extra deps)
async function fetchQrPng(link, size=200) {
  const u = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&choe=UTF-8&chl=${encodeURIComponent(link)}`;
  return fetchImageBytes(u);
}
// simple word-wrap for centered text
function wrapText(text, font, size, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function makePdfBuffer({ tenant, inv, client, items, linkForQr }) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28;
  const margin = 50;
  let y = 812;
  const lh = 14;

  const brand = {
    color: hexToRgb(tenant.brand_color, rgb(0,0,0)),
    accent: hexToRgb(tenant.brand_accent, rgb(0.1,0.1,0.1)),
  };

  // Try logo
  let logoImg = null, logoDims = { width: 0, height: 0 };
  if (tenant.logo_url) {
    try {
      const bytes = await fetchImageBytes(tenant.logo_url);
      try { logoImg = await pdfDoc.embedPng(bytes); } catch { logoImg = await pdfDoc.embedJpg(bytes); }
      const maxH = 40, maxW = 160;
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1);
      logoDims = { width: logoImg.width * scale, height: logoImg.height * scale };
    } catch { logoImg = null; }
  }

  // Header
  if (logoImg) page.drawImage(logoImg, { x: margin, y: y - logoDims.height, width: logoDims.width, height: logoDims.height });
  const rightX = pageW - margin;
  const name = tenant.business_name || tenant.slug;
  page.drawText(name, { x: rightX - fontBold.widthOfTextAtSize(name, 18), y: y - 2, size: 18, font: fontBold, color: brand.color });
  y -= Math.max(logoDims.height, 24) + 6;

  // Contact
  const contact = [tenant.address, tenant.phone, tenant.website, tenant.email_from].filter(Boolean);
  for (const line of contact) {
    const w = font.widthOfTextAtSize(line, 9);
    page.drawText(line, { x: rightX - w, y, size: 9, font, color: rgb(0,0,0) });
    y -= 11;
  }
  y -= 6;

  // Accent
  page.drawLine({ start:{x:margin, y}, end:{x:pageW-margin, y}, thickness:2, color: brand.accent });
  y -= 12;

  // Invoice meta (right)
  const meta = [
    [`INVOICE ${inv.number}`, 12, fontBold, brand.color],
    [`Issue: ${inv.issue_date || ""}`, 10, font, rgb(0,0,0)],
    [`Due:   ${inv.due_date   || ""}`, 10, font, rgb(0,0,0)]
  ];
  for (const [text, size, f, color] of meta) {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: rightX - w, y, size, font: f, color });
    y -= size + 4;
  }
  y -= 4;

  // Bill To
  page.drawText("Bill To:", { x: margin, y, size: 12, font: fontBold, color: brand.color }); y -= lh;
  if (client?.name)            { page.drawText(String(client.name),            { x: margin, y, size: 11, font }); y -= lh; }
  if (client?.billing_address) { page.drawText(String(client.billing_address), { x: margin, y, size: 11, font }); y -= lh; }
  if (client?.email)           { page.drawText(String(client.email),           { x: margin, y, size: 11, font }); y -= lh; }
  y -= 6;

  // Items header
  const line = (x1,y1,x2,y2)=>page.drawLine({ start:{x:x1,y:y1}, end:{x:x2,y:y2}, thickness:1, color: brand.accent });
  line(margin, y, pageW - margin, y); y -= lh;
  const header = (label, x)=>page.drawText(label, { x, y, size: 10, font: fontBold, color: brand.color });
  header("Description", margin);
  header("Qty",   300);
  header("Unit",  360);
  header("Total", 450);
  y -= lh;

  // Items
  const addPageIfNeeded = () => { if (y < 140) { page = pdfDoc.addPage([595.28, 841.89]); y = 812; } };
  for (const it of (items || [])) {
    addPageIfNeeded();
    page.drawText(String(it.description ?? ""), { x: margin, y, size: 10, font, maxWidth: 240 });
    page.drawText(String(Number(it.qty || 0)),  { x: 300,   y, size: 10, font });
    page.drawText(money(it.unit_price, inv.currency), { x: 360, y, size: 10, font });
    page.drawText(money(it.line_total, inv.currency), { x: 450, y, size: 10, font });
    y -= lh;
  }

  // Totals
  y -= 6; line(350, y, pageW - margin, y); y -= lh;
  const totalRow = (label, val, bold=false) => {
    const f = bold ? fontBold : font;
    const labelW = f.widthOfTextAtSize(label, 10);
    const valueW = f.widthOfTextAtSize(money(val, inv.currency), 10);
    page.drawText(label, { x: 360 + (80 - labelW), y, size: 10, font: f, color: brand.color });
    page.drawText(money(val, inv.currency), { x: 450 + (95 - valueW), y, size: 10, font: f });
    y -= lh;
  };
  totalRow("Subtotal", inv.subtotal);
  totalRow("Tax",      inv.tax_total);
  totalRow("Total",    inv.total, true);

  // --- Centered Notes ---
  if (inv.notes) {
    y -= 14;
    const title = "Notes";
    const titleW = fontBold.widthOfTextAtSize(title, 11);
    page.drawText(title, { x: (pageW - titleW)/2, y, size: 11, font: fontBold, color: brand.color });
    y -= lh;

    const maxW = pageW - margin*2; // center across full page
    const lines = wrapText(String(inv.notes), font, 10, maxW);
    for (const ln of lines) {
      const w = font.widthOfTextAtSize(ln, 10);
      page.drawText(ln, { x: (pageW - w)/2, y, size: 10, font, color: rgb(0,0,0) });
      y -= lh;
    }
  }

  // --- QR Code (centered) ---
  if (linkForQr) {
    y -= 16;
    try {
      const qrBytes = await fetchQrPng(linkForQr, 240);
      const qrImg = await pdfDoc.embedPng(qrBytes);
      const size = 120; // draw size
      const x = (pageW - size) / 2;
      page.drawImage(qrImg, { x, y: y - size, width: size, height: size });
      y -= (size + 6);

      const label = "Scan to view online";
      const w = font.widthOfTextAtSize(label, 9);
      page.drawText(label, { x: (pageW - w)/2, y, size: 9, font, color: rgb(0.2,0.2,0.2) });
      y -= lh;
    } catch { /* ignore QR failures */ }
  }

  // Footer
  const footer = tenant.pdf_footer || "";
  if (footer) {
    const fy = 40;
    page.drawLine({ start:{x:margin, y: fy + 14}, end:{x:pageW-margin, y: fy + 14}, thickness: 0.5, color: brand.accent });
    page.drawText(footer, { x: margin, y: fy, size: 8, font, color: rgb(0,0,0) });
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

    // Tenant with branding
    const tQ = await supa.from("tenants")
      .select("id, slug, business_name, currency, address, phone, website, email_from, brand_color, brand_accent, logo_url, pdf_footer")
      .eq("slug", tenantSlug).limit(1);
    if (tQ.error) return bad(tQ.error.message);
    const tenant = (tQ.data || [])[0];
    if (!tenant) return bad("tenant not found");

    // Invoice lookup
    let inv = null; const tried = [];
    if (invoiceId) {
      tried.push({ by: "tenant+id", value: `${tenant.id}+${invoiceId}` });
      const q = await supa.from("invoices").select("id, tenant_id, client_id, number, issue_date, due_date, currency, subtotal, tax_total, total, notes")
        .eq("tenant_id", tenant.id).eq("id", invoiceId).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv && invoiceNumber) {
      tried.push({ by: "tenant+number", value: `${tenant.id}+${invoiceNumber}` });
      const q = await supa.from("invoices").select("id, tenant_id, client_id, number, issue_date, due_date, currency, subtotal, tax_total, total, notes")
        .eq("tenant_id", tenant.id).eq("number", invoiceNumber).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv && invoiceId) {
      tried.push({ by: "id-only", value: invoiceId });
      const q = await supa.from("invoices").select("id, tenant_id, client_id, number, issue_date, due_date, currency, subtotal, tax_total, total, notes")
        .eq("id", invoiceId).limit(1);
      if (q.error) return bad(q.error.message);
      inv = (q.data || [])[0] || null;
    }
    if (!inv) {
      const recent = await supa.from("invoices").select("id, number, tenant_id, created_at")
        .eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(5);
      return bad({ message: "invoice not found", looked_for: { tenant_slug: tenantSlug, tenant_id: tenant.id, invoice_id: invoiceId || null, invoice_number: invoiceNumber || null, tried }, recent_invoices: recent.data || [] });
    }

    // Client + items
    const cQ = await supa.from("clients").select("name, billing_address, email").eq("id", inv.client_id).limit(1);
    if (cQ.error) return bad(cQ.error.message);
    const client = (cQ.data || [])[0] || null;

    const itQ = await supa.from("invoice_items").select("description, qty, unit_price, line_total, position")
      .eq("invoice_id", inv.id).order("position", { ascending: true });
    if (itQ.error) return bad(itQ.error.message);
    const items = itQ.data || [];

    // Ensure bucket exists
    const BUCKET = process.env.INVOICE_BUCKET || "invoices";
    const lb = await supa.storage.listBuckets();
    if (lb.error) return bad("storage listBuckets: " + lb.error.message);
    const hasBucket = (lb.data || []).some(b => b.name === BUCKET);
    if (!hasBucket) {
      const mk = await supa.storage.createBucket(BUCKET, { public: false });
      if (mk.error && !/already exists/i.test(mk.error.message || "")) return bad("storage createBucket: " + mk.error.message);
    }

    // Stable link for QR (redirects to fresh signed URL)
    const base = process.env.PUBLIC_BASE_URL || process.env.URL || process.env.DEPLOY_URL || "http://localhost:8888";
    const linkForQr = `${base}/.netlify/functions/invoice-link?tenant=${encodeURIComponent(tenant.slug)}&number=${encodeURIComponent(inv.number)}`;

    // Build & store PDF
    const pdfBuffer = await makePdfBuffer({ tenant, inv, client, items, linkForQr });
    const path = `${tenant.slug}/${inv.number}.pdf`;
    const up = await supa.storage.from(BUCKET).upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (up.error) return bad(up.error.message);

    const signed = await supa.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signed.error) return bad(signed.error.message);

    return ok({ id: inv.id, number: inv.number, pdfPath: path, signedUrl: signed.data.signedUrl, qrLink: linkForQr });
  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(body){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}}
function bad(msg){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify(typeof msg==='string'?{error:msg}:msg)}}
