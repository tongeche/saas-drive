import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHome, 
  faFlask, 
  faFileInvoice, 
  faReceipt, 
  faFileContract, 
  faClipboardList, 
  faUserPlus, 
  faBoxes,
  faCog,
  faSignOutAlt,
  faBars,
  faTimes,
  faChevronDown,
  faChevronRight,
  faBuilding,
  faPlus,
  faList,
  faMoneyBillWave,
  faExchangeAlt,
  faBriefcase,
  faFileAlt,
  faCopy,
  faSync,
  faLayerGroup,
  faChartLine,
  faFileExport
} from "@fortawesome/free-solid-svg-icons";
import supabase from "../lib/supabase";
import { loadMyTenants, getActiveTenant, saveActiveTenant } from "../lib/tenantState";

export default function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();

  const [session, setSession] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [tenantsLoaded, setTenantsLoaded] = useState(false);
  const [tenant, setTenantState] = useState(getActiveTenant());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Menu groups state
  const [expandedGroups, setExpandedGroups] = useState({
    business: false,
    invoices: false,
    receipts: false,
    quotes: false,
    inventory: false,
    clients: false,
    cashflow: false
  });

  const setTenant = (t) => {
    setTenantState(t);
    try { saveActiveTenant(t); } catch {}
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [loc.pathname]);

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

  // load my tenants
  useEffect(() => {
    (async () => {
      try {
        const rows = await loadMyTenants();
        setTenants(rows || []);
        setTenantsLoaded(true);
        if (!tenant && rows && rows.length) setTenant(rows[0]);
      } catch {
        setTenantsLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // guards: not logged in → login; no tenant on /app → onboard
  useEffect(() => {
    if (session === null) return; // not hydrated yet
    if (!session) { nav("/login", { replace: true }); return; }
    if (loc.pathname.startsWith("/app") && tenantsLoaded && tenants.length === 0) {
      nav("/onboard", { replace: true });
    }
  }, [session, tenantsLoaded, tenants.length, loc.pathname, nav]);

  async function logout() {
    try { await supabase.auth.signOut(); } catch {}
    nav("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#ECF5F0] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#F3F8F6] border-r border-black/10 transform transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0 md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 py-4 md:justify-start">
          <div className="text-lg font-extrabold">Finovo</div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-white/70"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-2 space-y-2">
          <NavLink
            to="/app"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-white/70"
              }`
            }
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/app/lab"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-white/70"
              }`
            }
          >
            <FontAwesomeIcon icon={faFlask} className="w-4 h-4" />
            <span>Back Office (Lab)</span>
          </NavLink>

          {/* Business Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('business')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4" />
                <span>Business</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.business ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.business && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/business/templates")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                  <span>Invoice Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/recurring")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faSync} className="w-3 h-3" />
                  <span>Recurring Invoices</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/bulk-operations")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" />
                  <span>Bulk Operations</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/documents")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="w-3 h-3" />
                  <span>Document Generation</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/analytics")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faChartLine} className="w-3 h-3" />
                  <span>Business Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/reports")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faFileExport} className="w-3 h-3" />
                  <span>Reports & Export</span>
                </button>
              </div>
            )}
          </div>

          {/* Invoices Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('invoices')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4" />
                <span>Invoices</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.invoices ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.invoices && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/invoices/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  <span>New Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/invoices")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faList} className="w-3 h-3" />
                  <span>View Invoices</span>
                </button>
              </div>
            )}
          </div>

          {/* Receipts Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('receipts')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="w-4 h-4" />
                <span>Receipts</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.receipts ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.receipts && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/receipts/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  <span>New Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/receipts")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faList} className="w-3 h-3" />
                  <span>View Receipts</span>
                </button>
              </div>
            )}
          </div>

          {/* Quotes Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('quotes')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileContract} className="w-4 h-4" />
                <span>Quotes</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.quotes ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.quotes && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/quotes/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  <span>New Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/quotations/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faClipboardList} className="w-3 h-3" />
                  <span>New Quotation</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/quotes")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faList} className="w-3 h-3" />
                  <span>View Quotes</span>
                </button>
              </div>
            )}
          </div>

          {/* Inventory Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('inventory')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxes} className="w-4 h-4" />
                <span>Inventory</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.inventory ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.inventory && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/items/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  <span>Add Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/items")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faList} className="w-3 h-3" />
                  <span>Manage Items</span>
                </button>
              </div>
            )}
          </div>

          {/* Clients Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('clients')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
                <span>Clients</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.clients ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.clients && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/clients/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-3 h-3" />
                  <span>Add Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/clients")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faList} className="w-3 h-3" />
                  <span>Manage Clients</span>
                </button>
              </div>
            )}
          </div>

          {/* Cashflow Group */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('cashflow')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMoneyBillWave} className="w-4 h-4" />
                <span>Cashflow</span>
              </div>
              <FontAwesomeIcon 
                icon={expandedGroups.cashflow ? faChevronDown : faChevronRight} 
                className="w-3 h-3" 
              />
            </button>
            {expandedGroups.cashflow && (
              <div className="ml-6 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => nav("/app/cashflow")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faList} className="w-3 h-3" />
                  <span>View Transactions</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/cashflow/new")}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  <span>Add Transaction</span>
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            type="button"
            onClick={() => nav("/app/settings")}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
          >
            <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-white/70"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
            <span>Logout</span>
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
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-[#ECF5F0]/80 backdrop-blur border-b border-black/10">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/70"
              >
                <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
              </button>
              
              {/* Mobile app title */}
              <div className="md:hidden text-lg font-bold">Finovo</div>
              
              {/* Desktop search */}
              <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5">
                <svg className="h-4 w-4 text-black/50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 21l-4.3-4.3M10 18a8 8 0 110-16 8 8 0 010 16z" />
                </svg>
                <input placeholder="Search..." className="bg-transparent outline-none text-sm w-56" />
              </div>
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
