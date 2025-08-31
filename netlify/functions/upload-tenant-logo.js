import { supaAdmin } from "./_supa.js";

function extFromName(name="") {
  const m = String(name).toLowerCase().match(/\.(png|jpg|jpeg|webp|svg)$/);
  return m ? m[1] : "png";
}
function mimeFromExt(ext) {
  return { png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", webp:"image/webp", svg:"image/svg+xml" }[ext] || "application/octet-stream";
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const b = JSON.parse(event.body || "{}");
    const slug = (b.slug || "").trim().toLowerCase();
    const filename = (b.filename || "logo.png").trim();
    const base64 = (b.file_base64 || "").trim(); // raw base64 (no data:;base64, prefix)
    if (!slug) return bad("missing slug");
    if (!base64) return bad("missing file_base64");

    const ext = extFromName(filename);
    const mime = mimeFromExt(ext);
    const path = `${slug}/logo.${ext}`;
    const bytes = Buffer.from(base64, "base64");

    const supa = supaAdmin();

    // ensure bucket exists (public)
    const lb = await supa.storage.listBuckets();
    if (lb.error) return bad("storage listBuckets: " + lb.error.message);
    const exists = (lb.data || []).some(b => b.name === "branding");
    if (!exists) {
      const mk = await supa.storage.createBucket("branding", { public: true });
      if (mk.error && !/already exists/i.test(mk.error.message || "")) return bad("createBucket: " + mk.error.message);
    }

    const up = await supa.storage.from("branding").upload(path, bytes, { contentType: mime, upsert: true });
    if (up.error) return bad(up.error.message);

    const pub = await supa.storage.from("branding").getPublicUrl(path);
    const logo_url = pub?.data?.publicUrl || null;

    return ok({ path, logo_url });
  } catch (e) { return bad(e.message || "error"); }
}
function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
