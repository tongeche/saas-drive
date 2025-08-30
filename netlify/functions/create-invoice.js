// netlify/functions/create-invoice.js
import { supaAdmin } from "./_supa.js";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const b = JSON.parse(event.body || "{}");

    // required fields (do NOT require client_id here)
    const need = ["tenant", "issue_date", "due_date", "currency", "subtotal", "tax_total", "total"];
    const miss = need.filter(k => b[k] === undefined || b[k] === "");
    if (miss.length) return bad(`Missing: ${miss.join(", ")}`);

    const supa = supaAdmin();

    // tenant lookup
    const { data: tenant, error: tErr } = await supa
      .from("tenants")
      .select("id, currency")
      .eq("slug", b.tenant)
      .single();
    if (tErr || !tenant) return bad("tenant not found");

    // ---- resolve client ----
    // prefer explicit UUID from UI, else allow external_id lookup
    let clientId = b.client_uuid || null;

    if (!clientId && b.client_external_id) {
      const { data: c, error: cErr } = await supa
        .from("clients")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("external_id", b.client_external_id)
        .maybeSingle();
      if (cErr) return bad(cErr.message);
      clientId = c?.id || null;
    }

    if (!clientId) {
      return bad("Missing client: provide 'client_uuid' (preferred) or 'client_external_id'.");
    }

    // ---- atomic invoice number via SQL function ----
    const { data: num, error: nErr } = await supa
      .rpc("next_invoice_number", { p_tenant_slug: b.tenant });
    if (nErr || !num) return bad(nErr?.message || "numbering failed");

    // ---- insert invoice ----
    const payload = {
      tenant_id: tenant.id,
      client_id: clientId,
      number: num,
      issue_date: b.issue_date,
      due_date: b.due_date,
      currency: b.currency || tenant.currency || "EUR",
      status: "draft",
      subtotal: Number(b.subtotal) || 0,
      tax_total: Number(b.tax_total) || 0,
      total: Number(b.total) || 0,
      balance_due: Number(b.total) || 0,
      from_quote_id: b.from_quote_id || null,
    };

    const { data: inv, error: iErr } = await supa
      .from("invoices")
      .insert(payload)
      .select("id, number")
      .single();
    if (iErr) return bad(iErr.message);

    // ---- optional: insert line items if provided ----
    if (Array.isArray(b.lines) && b.lines.length) {
      const items = b.lines.map((l, idx) => ({
        invoice_id: inv.id,
        description: String(l.description ?? ""),
        qty: Number(l.qty) || 0,
        unit_price: Number(l.unit_price) || 0,
        line_total: Number(l.line_total) || 0,
        position: idx + 1,
      }));
      const { error: itemsErr } = await supa.from("invoice_items").insert(items);
      if (itemsErr) return bad(`items: ${itemsErr.message}`);
    }

    return ok(inv); // { id, number }
  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(body) { return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }; }
function bad(msg) { return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: msg }) }; }
