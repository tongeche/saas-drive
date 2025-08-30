// netlify/functions/send-invoice.js
import { getGoogleClients, getGoogleClientsWithUser } from "./_google.js";
import { getTenantBySlug } from "./_tenant.js";
import { decrypt } from "./_crypto.js";

/**
 * POST JSON body:
 * {
 *   "tenant": "acme-co",
 *   "invoice": {
 *      "number": "INV-000123",
 *      "issue_date": "2025-09-01",
 *      "due_date": "2025-09-15",
 *      "currency": "EUR",
 *      "subtotal": 100,
 *      "tax_total": 23,
 *      "total": 123,
 *      "notes": "Thank you."
 *   },
 *   "business": { "name": "Acme Co Ltd" },
 *   "client":   { "name": "Rosa Maria", "address": "Rua Exemplo 123, Lisboa" },
 *   "lines": [
 *     { "description": "Service A", "qty": 1, "unit_price": 100, "line_total": 100 },
 *     { "description": "VAT 23%",   "qty": 1, "unit_price": 23,  "line_total": 23  }
 *   ]
 * }
 */
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const req = (k) => {
      if (!body[k]) throw new Error(`Missing '${k}' in request body`);
      return body[k];
    };

    const tenantSlug = req("tenant");
    const tenant = await getTenantBySlug(tenantSlug);

    // Prefer acting as the human (OAuth refresh token). Fallback to service account.
    let docs, drive;
    if (tenant.owner_refresh_token_encrypted) {
      const refresh_token = decrypt(tenant.owner_refresh_token_encrypted);
      ({ docs, drive } = getGoogleClientsWithUser(refresh_token));
    } else {
      ({ docs, drive } = getGoogleClients());
    }

    const inv = req("invoice");
    const biz = body.business || { name: tenant.business_name || "" };
    const cli = body.client || { name: "", address: "" };
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const currency = inv.currency || tenant.currency || "EUR";

    // Render lines as simple text inside the Doc
    const linesText = lines.map((l) =>
      `${l.description ?? ""} — ${n(l.qty)} × ${fmt(l.unit_price, currency)} = ${fmt(l.line_total, currency)}`
    ).join("\n");

    // 1) Copy the template into the tenant's exports folder
    const copy = await drive.files.copy({
      fileId: tenant.template_invoice_id,
      requestBody: {
        name: `Invoice ${inv.number}`,
        parents: [tenant.exports_folder_id],
      },
      fields: "id"
    });
    const newDocId = copy.data.id;

    // 2) Replace placeholders
    const repl = (token, value) => ({
      replaceAllText: {
        containsText: { text: `{{${token}}}`, matchCase: false },
        replaceText: value == null ? "" : String(value)
      }
    });

    const requests = [
      repl("BUSINESS_NAME", biz.name || tenant.business_name || ""),
      repl("INVOICE_NUMBER", inv.number),
      repl("ISSUE_DATE", inv.issue_date),
      repl("DUE_DATE", inv.due_date),
      repl("CLIENT_NAME", cli.name || ""),
      repl("CLIENT_ADDRESS", cli.address || ""),
      repl("CURRENCY", currency),
      repl("SUBTOTAL", fmt(inv.subtotal, currency)),
      repl("TAX_TOTAL", fmt(inv.tax_total, currency)),
      repl("TOTAL", fmt(inv.total, currency)),
      repl("NOTES", inv.notes || ""),
      repl("LINES", linesText || "")
    ];

    await docs.documents.batchUpdate({
      documentId: newDocId,
      requestBody: { requests }
    });

    // 3) Get the PDF export link (or fallback to bytes)
    const meta = await drive.files.get({
      fileId: newDocId,
      fields: "webViewLink, exportLinks"
    });

    const pdfUrl = meta.data.exportLinks?.["application/pdf"] || null;
    const docUrl = meta.data.webViewLink || null;

    if (!pdfUrl) {
      const pdf = await drive.files.export(
        { fileId: newDocId, mimeType: "application/pdf" },
        { responseType: "arraybuffer" }
      );
      const base64 = Buffer.from(pdf.data).toString("base64");
      return ok({ docId: newDocId, docUrl, pdfBase64: base64 });
    }

    return ok({ docId: newDocId, docUrl, pdfUrl });

  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(body) { return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }; }
function bad(msg) { return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: msg }) }; }

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : ""; }
function fmt(v, currency) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "";
  return x.toFixed(2) + (currency ? ` ${currency}` : "");
}
