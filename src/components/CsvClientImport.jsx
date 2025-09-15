import React, { useMemo, useState } from "react";
import supabase from "../lib/supabase";

/**
 * CSV Client Import (no external libs)
 * Expected headers (case-insensitive): name, email, phone, billing_address, notes (optional), external_id (optional)
 * Minimal CSV parser that handles quoted fields. Avoid newlines inside quotes for now.
 */
export default function CsvClientImport({ tenantId, onDone }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  function normalizeHeader(h = "") {
    return String(h).trim().toLowerCase().replace(/\s+/g, "_");
  }

  function parseCSV(text) {
    const out = [];
    let cur = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          field += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          cur.push(field);
          field = "";
        } else if (ch === "\n" || ch === "\r") {
          if (ch === "\r" && next === "\n") i++; // CRLF
          cur.push(field);
          out.push(cur);
          cur = [];
          field = "";
        } else {
          field += ch;
        }
      }
    }
    // flush last line
    if (field.length || cur.length) {
      cur.push(field);
      out.push(cur);
    }
    return out.filter((r) => r.some((v) => v !== "")); // drop blank lines
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    const text = await file.text();
    const matrix = parseCSV(text);
    if (!matrix.length) return setStatus("Empty CSV");

    const hdr = matrix[0].map(normalizeHeader);
    setHeaders(hdr);

    const body = matrix.slice(1).map((row) => {
      const obj = {};
      hdr.forEach((h, i) => (obj[h] = row[i] ?? ""));
      return obj;
    });
    setRows(body);
  }

  const preview = useMemo(() => rows.slice(0, 5), [rows]);

  async function importNow() {
    if (!rows.length || !tenantId) return;
    setBusy(true);
    setStatus(null);
    try {
      const must = ["name"];
      for (const r of rows) {
        for (const m of must) {
          if (!r[m] || String(r[m]).trim() === "") {
            throw new Error(`Missing required '${m}' in one or more rows`);
          }
        }
      }
      const payload = rows.map((r, i) => ({
        tenant_id: tenantId,
        external_id:
          (r.external_id && String(r.external_id).trim()) ||
          `csv-${Date.now()}-${i + 1}`,
        name: (r.name || "").trim(),
        email: (r.email || "").trim(),
        phone: (r.phone || "").trim(),
        billing_address: (r.billing_address || "").trim(),
        notes: (r.notes || "").trim(),
      }));

      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw error;

      setStatus(`Imported ${payload.length} client(s)`);
      setRows([]);
      onDone && onDone(payload.length);
    } catch (e) {
      console.error(e);
      setStatus(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const csv = [
      "name,email,phone,billing_address,notes,external_id",
      "Jane Doe,jane@example.com,+254700000000,\"123 Example Rd, City\",VIP client,client-001",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clients_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white/70 backdrop-blur">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 dark:text-white">Import clients (CSV)</h4>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm text-[#3c6b5b] hover:underline"
        >
          Download template
        </button>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="text-sm"
        />
        <button
          type="button"
          disabled={!rows.length || busy}
          onClick={importNow}
          className="inline-flex items-center gap-2 rounded-lg bg-[#3c6b5b] px-3 py-1.5 text-white disabled:opacity-50"
        >
          Import {rows.length ? `(${rows.length})` : ""}
        </button>
      </div>

      {status && (
        <div className="mt-3 text-sm text-gray-600">
          {status}
        </div>
      )}

      {!!preview.length && (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-2 py-1 text-left font-medium text-gray-600 border-b border-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  {headers.map((h) => (
                    <td key={h} className="px-2 py-1 text-gray-800 dark:text-white">
                      {r[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && (
            <div className="mt-1 text-xs text-gray-500">
              Showing first 5 of {rows.length} rows.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
