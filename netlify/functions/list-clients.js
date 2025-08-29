import { getGoogleClients } from "./_google.js";
import { getTenantBySlug } from "./_tenant.js";

export async function handler(event) {
  try {
    const tenantSlug = (event.queryStringParameters?.tenant || "").trim();
    const tenant = await getTenantBySlug(tenantSlug);
    const { sheets } = getGoogleClients();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: tenant.clients_sheet_id,
      range: "Clients!A:Z",
    });
    const [header = [], ...rows] = res.data.values || [];
    const items = rows.map(r => Object.fromEntries(header.map((h,i)=>[h, r[i] ?? ""])));
    return { statusCode: 200, body: JSON.stringify(items) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message || "error" }) };
  }
}
