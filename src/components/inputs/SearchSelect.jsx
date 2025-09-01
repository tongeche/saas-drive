import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SearchSelect
 * Props:
 *  - placeholder: string
 *  - fetchOptions: async (q: string) => [{ id, label, subLabel?, data? }]
 *  - onSelect: (option) => void
 *  - onCreate?: (query: string) => void
 *  - valueLabel?: string (optional, to show current selection)
 */
export default function SearchSelect({
  placeholder = "Search…",
  fetchOptions,
  onSelect,
  onCreate,
  valueLabel = "",
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opts, setOpts] = useState([]);
  const [err, setErr] = useState("");
  const rootRef = useRef(null);
  const debRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    if (!fetchOptions) return;
    setErr("");
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setOpts([]); return; }
      try {
        setBusy(true);
        const res = await fetchOptions(term);
        setOpts(Array.isArray(res) ? res : []);
      } catch (e) {
        setErr(e.message || "Search failed");
        setOpts([]);
      } finally {
        setBusy(false);
      }
    }, 220);
    return () => clearTimeout(debRef.current);
  }, [q, fetchOptions]);

  const showCreate = useMemo(() => {
    return onCreate && q.trim() && (opts || []).length === 0;
  }, [onCreate, q, opts]);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e)=>{ setQ(e.target.value); setOpen(true); }}
          onFocus={()=>setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-finovo"
        />
      </div>

      {/* helper text */}
      {valueLabel && !q && (
        <div className="mt-1 text-xs text-gray-500">Selected: <span className="font-medium">{valueLabel}</span></div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-auto">
          {busy && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}
          {err && (
            <div className="px-3 py-2 text-sm text-red-600">{err}</div>
          )}
          {!busy && !err && (opts || []).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onSelect?.(opt); setOpen(false); setQ(""); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              <div className="text-sm text-gray-900">{opt.label}</div>
              {opt.subLabel && <div className="text-xs text-gray-500">{opt.subLabel}</div>}
            </button>
          ))}
          {!busy && !err && showCreate && (
            <button
              type="button"
              onClick={() => { onCreate?.(q.trim()); setOpen(false); setQ(""); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
            >
              Create “<span className="font-medium">{q.trim()}</span>”
            </button>
          )}
          {!busy && !err && !showCreate && (opts || []).length === 0 && q.trim() && (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
