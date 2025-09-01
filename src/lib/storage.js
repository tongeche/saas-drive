import supabase from "./supabase";

export async function uploadInvoicePdf(blob, path) {
  const { error } = await supabase.storage
    .from("invoices")
    .upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  return { path };
}

export async function signInvoicePath(path, expiresSeconds = 60 * 60 * 24 * 30) {
  const { data, error } = await supabase.storage
    .from("invoices")
    .createSignedUrl(path, expiresSeconds);
  if (error) throw error;
  return data.signedUrl;
}
