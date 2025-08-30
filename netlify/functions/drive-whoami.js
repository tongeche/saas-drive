import { getTenantBySlug } from "./_tenant.js";
import { getGoogleClients, getGoogleClientsWithUser } from "./_google.js";
import { decrypt } from "./_crypto.js";

export async function handler(event) {
  try {
    const tenant = (event.queryStringParameters?.tenant || "").trim();
    if (!tenant) return res(400, { error: "missing tenant" });
    const t = await getTenantBySlug(tenant);

    let mode = "service_account";
    let drive;

    if (t.owner_refresh_token_encrypted) {
      const refresh_token = decrypt(t.owner_refresh_token_encrypted);
      ({ drive } = getGoogleClientsWithUser(refresh_token));
      mode = "user_oauth";
    } else {
      ({ drive } = getGoogleClients());
    }

    const about = await drive.about.get({
      fields: "user(displayName,emailAddress),storageQuota(limit,usage,usageInDrive,usageInDriveTrash)"
    });

    return res(200, { mode, about: about.data });
  } catch (e) {
    return res(400, { error: e.message || "error" });
  }
}

function res(code, body) {
  return { statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

