import React from "react";

export default function InvoicePreview({ tenant, client, details, items, totals, notes }) {
  const brand = tenant?.brand_color || "#26BA99";
  const fmt = (n,c=details.currency||tenant?.currency||"EUR")=>{
    try { return new Intl.NumberFormat(undefined,{style:"currency",currency:c}).format(Number(n||0)); }
    catch { return `${c} ${Number(n||0).toFixed(2)}`; }
  };

  return (
    <div id="invoice-pdf-root" className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold" style={{color:brand}}>Invoice (preview)</div>
        {tenant?.logo_url ? (
          <img src={tenant.logo_url} alt="logo" className="h-8 object-contain" />
        ) : (
          <div className="h-8 px-3 grid place-items-center rounded-md" style={{background:brand, color:"#fff"}}>
            {tenant?.business_name?.slice(0,2)?.toUpperCase() || "FN"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="font-medium">{tenant?.business_name}</div>
          <div className="text-black/70 dark:text-gray-300 whitespace-pre-line">{tenant?.address}</div>
          {tenant?.tax_id && <div className="text-black/70 dark:text-gray-300">Tax ID: {tenant.tax_id}</div>}
        </div>
        <div className="text-right">
          <div className="font-medium">{client?.name || "Client name"}</div>
          {client?.email && <div className="text-black/70 dark:text-gray-300">{client.email}</div>}
          {client?.phone && <div className="text-black/70 dark:text-gray-300">{client.phone}</div>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm mt-4">
        <div><span className="text-black/60 dark:text-gray-400">Issue:</span> {details.issueDate}</div>
        <div><span className="text-black/60 dark:text-gray-400">Due:</span> {details.dueDate}</div>
        <div className="text-right"><span className="text-black/60 dark:text-gray-400">Currency:</span> {details.currency}</div>
      </div>

      {(details.poNumber) && (
        <div className="mt-2 text-sm">
          <span className="text-black/60 dark:text-gray-400">PO:</span> {details.poNumber}
        </div>
      )}

      <div className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/60 dark:text-gray-400 border-b border-black/10">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Tax %</th>
              <th className="py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r=>{
              const line = Number(r.qty||0)*Number(r.price||0);
              const tax  = line*Number(r.tax||0)/100;
              const tot  = line+tax;
              return (
                <tr key={r.id} className="border-b border-black/5">
                  <td className="py-2">{r.description || <span className="text-black/40 dark:text-gray-500">Item</span>}</td>
                  <td className="py-2 text-right">{r.qty||0}</td>
                  <td className="py-2 text-right">{fmt(r.price)}</td>
                  <td className="py-2 text-right">{r.tax||0}</td>
                  <td className="py-2 text-right">{fmt(tot)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-end gap-8">
            <div className="text-black/60 dark:text-gray-400">Subtotal</div>
            <div>{fmt(totals.subtotal)}</div>
          </div>
          <div className="flex justify-end gap-8">
            <div className="text-black/60 dark:text-gray-400">Tax</div>
            <div>{fmt(totals.tax)}</div>
          </div>
          <div className="flex justify-end gap-8 text-base font-semibold" style={{color:brand}}>
            <div>Total</div>
            <div>{fmt(totals.total)}</div>
          </div>
        </div>

        {(notes.note || notes.terms || tenant?.pdf_footer) && (
          <div className="mt-5 border-t border-black/10 pt-3 text-sm text-black/70 dark:text-gray-300 space-y-2">
            {notes.note && <div>{notes.note}</div>}
            {notes.terms && <div><b>Terms: </b>{notes.terms}</div>}
            {tenant?.pdf_footer && <div className="whitespace-pre-line">{tenant.pdf_footer}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
