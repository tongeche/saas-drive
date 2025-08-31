import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import supabase from "../lib/supabase";
import { loadMyTenants, getActiveTenant, saveActiveTenant } from "../lib/tenantState";

export default function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();

  const [checking, setChecking] = useState(true);
  const [session, setSession]   = useState(null);
  const [tenants, setTenants]   = useState([]);
  const [tenant, setTenant]     = useState(getActiveTenant());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth + tenant guard
  useEffect(() => {
    (async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      setSession(session || null);
      if (!session) { nav("/login", { replace: true }); return; }

      try {
        const t = await loadMyTenants();
        setTenants(t);
        let active = tenant;
        if (!active && t.length) active = t[0];
        if (active) { setTenant(active); saveActiveTenant(active); }
        if (!active) { nav("/onboard", { replace: true }); return; }
      } finally {
        setChecking(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s || null);
      if (!s) nav("/login", { replace: true });
    });
    return () => sub?.subscription?.unsubscribe?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
          Preparing your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#E9F5EE 0%, #F3F4F6 100%)" }}>
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed z-40 inset-y-0 left-0 w-64 border-r border-black/5 bg-[#F3F4F6] transition-transform duration-200 md:static md:translate-x-0 md:flex md:flex-col`}>
          <div className="px-6 py-5 text-xl font-semibold tracking-tight flex items-center justify-between">
            <Link to="/app" onClick={() => setSidebarOpen(false)}>Finovo</Link>
            <button className="md:hidden text-sm" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <nav className="px-3 pb-6 space-y-1 text-sm">
            <NavItem to="/app" label="Dashboard" icon="home" exact onClick={()=>setSidebarOpen(false)} />
            <NavItem to="/app/lab" label="Back Office (Lab)" icon="beaker" onClick={()=>setSidebarOpen(false)} />
            <NavItem to="/tenant-profile" label="Settings" icon="cog" onClick={()=>setSidebarOpen(false)} />
          </nav>

          {/* Balance / tenant snippet */}
          <div className="mt-auto p-4 text-xs">
            <div className="rounded-xl p-4 shadow-sm ring-1 ring-black/5 bg-white/70">
              <div className="font-semibold mb-1">{tenant?.business_name || "Workspace"}</div>
              <div className="text-black/60">Currency: {(tenant?.currency || "").toUpperCase()}</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="flex items-center justify-between px-4 md:px-5 py-3">
            <div className="flex items-center gap-2">
              <button className="md:hidden rounded-lg px-2 py-1 ring-1 ring-black/10 bg-white/70" onClick={() => setSidebarOpen(true)}>☰</button>
            
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[420px]">
              <div className="flex items-center gap-2 flex-1 md:flex-none rounded-xl bg-white/70 backdrop-blur px-3 py-2 shadow-sm ring-1 ring-black/5">
                <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="currentColor"><path d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
                <input className="w-full bg-transparent outline-none text-sm" placeholder="Search…" />
              </div>
              <button className="hidden md:inline-flex items-center rounded-xl bg-white/70 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-white">
                + New
              </button>
              <button onClick={logout} className="rounded-xl bg-white/70 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-white">
                Logout
              </button>
            </div>
          </div>

          {/* Content outlet */}
          <div className="pb-10">
            <Outlet context={{ session, tenant, tenants, setTenant }} />
          </div>
        </section>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon, exact=false, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? "bg-white shadow-sm" : "hover:bg-white/70"}`
      }
      onClick={onClick}
    >
      <Icon name={icon} />
      {label}
    </NavLink>
  );
}

function Icon({ name }) {
  const map = {
    home: <svg className="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12l9-9 9 9-1.5 1.5L12 5.5 4.5 13.5 3 12z"/><path d="M5 11h14v9H5z"/></svg>,
    beaker: <svg className="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12v2H6zM9 4h6v4l5 10v2H4v-2l5-10z"/></svg>,
    cog: <svg className="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6zm8.94-2.06l2.12 1.22-1 1.73-2.44-.28a7.98 7.98 0 01-1.48 1.48l.28 2.44-1.73 1-1.22-2.12a8.14 8.14 0 01-1.86 0L9.3 22.93l-1.73-1 .28-2.44a7.98 7.98 0 01-1.48-1.48l-2.44.28-1-1.73 2.12-1.22a8.14 8.14 0 010-1.86L.93 9.3l1-1.73 2.44.28a7.98 7.98 0 011.48-1.48L5.57 3.93l1.73-1 1.22 2.12c.61-.09 1.24-.09 1.86 0L12 2.07l1.73 1-.28 2.44a7.98 7.98 0 011.48 1.48l2.44-.28 1 1.73-2.12 1.22c.09.61.09 1.24 0 1.86z"/></svg>,
  };
  return map[name] ?? <span className="h-4 w-4" />;
}
