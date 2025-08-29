import { getGoogleClients } from "./_google.js";
let cache = {}; // { slug: rowObj }

export async function getTenantBySlug(slug) {
  if (!slug) throw new Error("Missing tenant");
  if (cache[slug]) return cache[slug];
  const { sheets } = getGoogleClients();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.TENANTS_SHEET_ID,
    range: "Tenants!A:Q",
  });
  const [header, ...rows] = res.data.values || [];
  const idx = k => header.indexOf(k);
  const row = rows.find(r => r[idx("tenant_slug")] === slug);
  if (!row) throw new Error("Tenant not found");
  const t = {
    slug: row[idx("tenant_slug")],
    clients_sheet_id: row[idx("clients_sheet_id")],
    items_sheet_id: row[idx("items_sheet_id")],
    quotes_sheet_id: row[idx("quotes_sheet_id")],
    quote_lines_sheet_id: row[idx("quote_lines_sheet_id")],
    invoices_sheet_id: row[idx("invoices_sheet_id")],
    payments_sheet_id: row[idx("payments_sheet_id")],
    settings_sheet_id: row[idx("settings_sheet_id")],
    template_quote_id: row[idx("template_quote_id")],
    template_invoice_id: row[idx("template_invoice_id")],
    template_receipt_id: row[idx("template_receipt_id")],
    exports_folder_id: row[idx("exports_folder_id")],
    currency: row[idx("currency")] || "EUR",
    timezone: row[idx("timezone")] || "Europe/Lisbon",
  };
  cache[slug] = t;
  return t;
}
