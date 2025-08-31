import React, { useEffect, useState } from 'react';
import supabase from './lib/supabase';

export default function TenantProfile({ tenantId, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [err, setErr] = useState('');
  const [ok,  setOk]  = useState('');

  const [form, setForm] = useState({
    business_name: '',
    currency: 'KES',
    email_from: '',
    phone: '',
    website: '',
    address: '',
    tax_id: '',
    invoice_prefix: '',
    brand_color: '#222222',
    brand_accent: '#999999',
    pdf_footer: '',
    logo_url: '',
  });

  function setField(k) {
    return (e) => setForm(s => ({ ...s, [k]: e.target.value }));
  }

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setErr(''); setOk('');
    (async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('business_name,currency,email_from,phone,website,address,tax_id,invoice_prefix,brand_color,brand_accent,pdf_footer,logo_url')
        .eq('id', tenantId)
        .single();
      if (error) { setErr(error.message); setLoading(false); return; }
      setForm({
        business_name: data.business_name || '',
        currency: data.currency || 'KES',
        email_from: data.email_from || '',
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || '',
        tax_id: data.tax_id || '',
        invoice_prefix: data.invoice_prefix || '',
        brand_color: data.brand_color || '#222222',
        brand_accent: data.brand_accent || '#999999',
        pdf_footer: data.pdf_footer || '',
        logo_url: data.logo_url || '',
      });
      setLoading(false);
    })();
  }, [tenantId]);

  async function save() {
    if (!tenantId) return;
    setSaving(true); setErr(''); setOk('');
    const payload = { ...form };
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(payload)
        .eq('id', tenantId)
        .select('id,business_name,currency,brand_color,brand_accent,invoice_prefix')
        .single();
      if (error) throw error;
      setOk('Saved.');
      onUpdated?.(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!tenantId) return <div style={{opacity:.7}}>Select a tenant to edit its profile.</div>;
  if (loading) return <div>Loading tenant…</div>;

  return (
    <div style={{border:'1px solid #e5e7eb', borderRadius:8, padding:16, marginTop:16}}>
      <h3>Tenant Profile</h3>
      {err && <p style={{color:'#b00'}}>{err}</p>}
      {ok  && <p style={{color:'#067d26'}}>{ok}</p>}

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <label>Business Name
          <input value={form.business_name} onChange={setField('business_name')} />
        </label>

        <label>Currency
          <select value={form.currency} onChange={setField('currency')}>
            <option value="KES">KES</option><option value="EUR">EUR</option><option value="USD">USD</option>
          </select>
        </label>

        <label>Email From
          <input value={form.email_from} onChange={setField('email_from')} placeholder="billing@company.com" />
        </label>

        <label>Phone
          <input value={form.phone} onChange={setField('phone')} placeholder="+254..." />
        </label>

        <label>Website
          <input value={form.website} onChange={setField('website')} placeholder="https://..." />
        </label>

        <label>Tax ID
          <input value={form.tax_id} onChange={setField('tax_id')} />
        </label>

        <label>Address
          <input value={form.address} onChange={setField('address')} />
        </label>

        <label>Invoice Prefix
          <input value={form.invoice_prefix} onChange={setField('invoice_prefix')} placeholder="INV-" />
        </label>

        <label>Brand Color
          <input type="color" value={form.brand_color || '#222222'} onChange={setField('brand_color')} />
        </label>

        <label>Accent Color
          <input type="color" value={form.brand_accent || '#999999'} onChange={setField('brand_accent')} />
        </label>

        <label style={{gridColumn:'1 / -1'}}>PDF Footer
          <textarea value={form.pdf_footer} onChange={setField('pdf_footer')} rows={3} />
        </label>

        <label style={{gridColumn:'1 / -1'}}>Logo URL (optional)
          <input value={form.logo_url} onChange={setField('logo_url')} placeholder="https://..." />
        </label>
      </div>

      <div style={{marginTop:12}}>
        <button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  );
}
