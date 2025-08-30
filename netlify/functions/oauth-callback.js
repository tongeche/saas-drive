import { google } from "googleapis";
import { encrypt } from "./_crypto.js";
import { saveTenantRefreshToken } from "./_tenant.js";

export async function handler(event) {
  try {
    const q = new URLSearchParams(event.rawQuery || "");
    const code = q.get("code");
    const state = JSON.parse(q.get("state") || "{}");
    const tenant = (state.tenant || "").trim();
    if (!code || !tenant) return html(400, "Missing code or tenant");

    const host = event.headers["x-forwarded-host"] || event.headers.host;
    const proto = event.headers["x-forwarded-proto"] || "https";
    const redirect_uri = `${proto}://${host}/.netlify/functions/oauth-callback`;

    const oAuth2 = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri
    );

    const { tokens } = await oAuth2.getToken({ code, redirect_uri });
    if (!tokens.refresh_token) {
      return html(400, "No refresh_token received. Try again with 'prompt=consent' or revoke previous grant in your Google Account.");
    }

    const encrypted = encrypt(tokens.refresh_token);
    await saveTenantRefreshToken(tenant, encrypted);

    return html(200, `✅ Connected ${tenant}. You can close this tab.`);
  } catch (e) {
    return html(500, `Error: ${e.message || "unknown"}`);
  }
}

function html(code, body) {
  return { statusCode: code, headers: { "Content-Type": "text/html" }, body: `<!doctype html><meta charset=utf-8><pre>${body}</pre>` };
}
