import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { loadMyTenants, getActiveTenant, saveActiveTenant } from "../lib/tenantState";

export default function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();

  const [session, setSession] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [tenant, setTenantState] = useState(getActiveTenant());
  const setTenant = (t) => { setTenantState(t); try { saveActiveTenant(t); } catch {} };

  // hydrate auth + subscribe
  useEffect(() => {
    let sub;
    (async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      setSession(session || null);
      sub = supabase.auth.onAuthStateChange((_e, s) => setSession(s || null));
    })();
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // load my tenants (membership)
  useEffect(() => {
    (async () => {
      try {
        const rows = await loadMyTenants();
        setTenants(rows || []);
        // choose active if none
        if (!tenant && rows && rows.length) setTenant(rows[0]);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try { await supabase.auth.signOut(); } catch {}
    nav("/login", { replace: true });
  }

  const isActive = (p) => (loc.pathname === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-white/70");

  return (
    <div className="min-h-screen bg-[#ECF5F0] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#F3F8F6] border-r border-black/10 hidden md:flex flex-col">
        <div className="px-4 py-4 text-lg font-extrabold">Finovo</div>

        <nav className="px-2 space-y-2">
          <NavLink to="/app" className={({isActive}) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl ${isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-white/70"}`
          }>
            <span>🏠</span><span>Dashboard</span>
          </NavLink>

          <NavLink to="/app/lab" className={({isActive}) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl ${isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-white/70"}`
          }>
            <span>🧪</span><span>Back Office (Lab)</span>
          </NavLink>

          <button
            type="button"
            onClick={() => nav("/app/invoices/new")}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
          >
            <span>➕</span><span>New Invoice</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
          >
            <span>🚪</span><span>Logout</span>
          </button>
        </nav>

        {/* Current tenant card */}
        <div className="mt-auto p-3">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-3">
            <div className="text-sm font-medium">{tenant?.business_name || "—"}</div>
            <div className="text-xs text-black/60">Currency: {tenant?.currency || "EUR"}</div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-[#ECF5F0]/80 backdrop-blur border-b border-black/10">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5">
              <svg className="h-4 w-4 text-black/50" viewBox="0 0 24 24" fill="currentColor"><path d="M21 21l-4.3-4.3M10 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
              <input placeholder="Search..." className="bg-transparent outline-none text-sm w-56"/>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nav("/app/invoices/new")}
                className="hidden md:inline-flex items-center rounded-xl bg-white/70 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-white"
              >
                + New
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center rounded-xl bg-white/70 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-white"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Outlet context={{ session, tenant, tenants, setTenant }} />
          </div>
        </main>
      </div>
    </div>
  );
}
