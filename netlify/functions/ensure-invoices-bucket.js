import { supaAdmin } from "./_supa.js";

export async function handler() {
  try {
    const supa = supaAdmin();
    const bucket = "invoices";

    // Does it exist?
    const { data: info, error: gErr } = await supa.storage.getBucket(bucket);
    if (gErr) return bad(gErr.message);
    if (info) return ok({ bucket, status: "exists" });

    // Create it (private)
    const { error: cErr } = await supa.storage.createBucket(bucket, { public: false });
    if (cErr && cErr.statusCode !== "409") return bad(cErr.message);

    return ok({ bucket, status: "created" });
  } catch (e) { return bad(e.message || "error"); }
}

function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
