import { getGoogleClients } from "./_google.js";

let cache = {}; // { slug: rowObj, _row, _header }

function colToA1(colIndex0) {
  let n = colIndex0 + 1, s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

export async function getTenantBySlug(slug) {
  if (!slug) throw new Error("Missing tenant");
  if (cache[slug]) return cache[slug];

  const { sheets } = getGoogleClients();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.TENANTS_SHEET_ID,
    range: "Tenants!A:Z",
  });
  const [header=[], ...rows] = res.data.values || [];
  const idx = (k) => header.indexOf(k);
  const r = rows.find(rr => rr[idx("tenant_slug")] === slug);
  if (!r) throw new Error("Tenant not found");

  const t = {
    slug: r[idx("tenant_slug")],
    business_name: r[idx("business_name")] || "",
    owner_email: r[idx("owner_email")] || "",
    owner_refresh_token_encrypted: r[idx("owner_refresh_token_encrypted")] || "",
    clients_sheet_id: r[idx("clients_sheet_id")],
    invoices_sheet_id: r[idx("invoices_sheet_id")],
    settings_sheet_id: r[idx("settings_sheet_id")],
    template_invoice_id: r[idx("template_invoice_id")],
    exports_folder_id: r[idx("exports_folder_id")],
    currency: r[idx("currency")] || "EUR",
    timezone: r[idx("timezone")] || "Europe/Lisbon",
    _row: rows.indexOf(r) + 2, // 1-based row number incl. header
    _header: header,
  };
  cache[slug] = t;
  return t;
}

export async function saveTenantRefreshToken(slug, encrypted) {
  const t = await getTenantBySlug(slug);
  const col = t._header.indexOf("owner_refresh_token_encrypted");
  if (col < 0) throw new Error("Tenants header missing 'owner_refresh_token_encrypted'");
  const range = `Tenants!${colToA1(col)}${t._row}`;
  const { sheets } = getGoogleClients();
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.TENANTS_SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[encrypted]] }
  });
  // update cache
  t.owner_refresh_token_encrypted = encrypted;
  cache[slug] = t;
  return t;
}
