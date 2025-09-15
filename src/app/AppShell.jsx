import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ThemeToggleMini } from "../components/ThemeToggle.jsx";
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
  faFileExport,
  faUsers,
  faHandshake,
  faCommentDots,
  faBell
} from "@fortawesome/free-solid-svg-icons";
import supabase from "../lib/supabase";
import { loadMyTenants, getActiveTenant, saveActiveTenant } from "../lib/tenantState";
import AIAssistant from "../components/AIAssistant";

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
    crm: true, // CRM expanded by default since it's a key feature
    business: false,
    reports: false
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 flex transition-all duration-500">
      {/* Modern Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-700/60 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col
        md:relative md:translate-x-0 md:z-auto md:shadow-lg
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="relative px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Finovo
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Business Suite</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Modern Theme Toggle */}
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <ThemeToggleMini />
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Dashboard - Quick Access */}
          <NavLink
            to="/app"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:transform hover:scale-[1.01]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-colors ${
                  isActive ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600"
                }`}>
                  <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
                </div>
                <span className="font-medium">Dashboard</span>
              </>
            )}
          </NavLink>

          {/* CRM Group */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('crm')}
              className="w-full group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-300 hover:transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium">CRM</span>
              </div>
              <div className="p-1 rounded-lg bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                <FontAwesomeIcon 
                  icon={expandedGroups.crm ? faChevronDown : faChevronRight} 
                  className="w-3 h-3 transition-transform duration-200" 
                />
              </div>
            </button>
            {expandedGroups.crm && (
              <div className="ml-6 mt-2 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                <button
                  type="button"
                  onClick={() => nav("/app/crm")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faChartLine} className="w-3 h-3 text-emerald-500" />
                  <span>CRM Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/clients")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faUsers} className="w-3 h-3 text-emerald-500" />
                  <span>Manage Clients</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/clients/new")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-3 h-3 text-emerald-500" />
                  <span>Add New Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/crm/communications")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faCommentDots} className="w-3 h-3 text-emerald-500" />
                  <span>Communications</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/crm/activities")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faHandshake} className="w-3 h-3 text-emerald-500" />
                  <span>Activities</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/crm/reminders")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faBell} className="w-3 h-3 text-emerald-500" />
                  <span>Follow-up Reminders</span>
                </button>
              </div>
            )}
          </div>

          {/* BUSINESS Group */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('business')}
              className="w-full group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-300 hover:transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                  <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium">BUSINESS</span>
              </div>
              <div className="p-1 rounded-lg bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                <FontAwesomeIcon 
                  icon={expandedGroups.business ? faChevronDown : faChevronRight} 
                  className="w-3 h-3 transition-transform duration-200" 
                />
              </div>
            </button>
            {expandedGroups.business && (
              <div className="ml-6 mt-2 space-y-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                {/* Invoices Subsection */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Invoices</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("/app/invoices/new")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-blue-500" />
                    <span>New Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/invoices")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faFileInvoice} className="w-3 h-3 text-blue-500" />
                    <span>View Invoices</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/business/recurring")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faSync} className="w-3 h-3 text-blue-500" />
                    <span>Recurring Invoices</span>
                  </button>
                </div>

                {/* Receipts Subsection */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Receipts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("/app/receipts/new")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-green-500" />
                    <span>New Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/receipts")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-green-500" />
                    <span>View Receipts</span>
                  </button>
                </div>

                {/* Quotes Subsection */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Quotes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("/app/quotes/new")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-purple-500" />
                    <span>New Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/quotations/new")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="w-3 h-3 text-purple-500" />
                    <span>New Quotation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/quotes")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faFileContract} className="w-3 h-3 text-purple-500" />
                    <span>View Quotes</span>
                  </button>
                </div>

                {/* Inventory Subsection */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Inventory</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("/app/items/new")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-orange-500" />
                    <span>Add Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/inventory")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faBoxes} className="w-3 h-3 text-orange-500" />
                    <span>Manage Items</span>
                  </button>
                </div>

                {/* Cashflow Subsection */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Cashflow</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("/app/cashflow")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faMoneyBillWave} className="w-3 h-3 text-teal-500" />
                    <span>View Transactions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/cashflow/new")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-teal-500" />
                    <span>Add Transaction</span>
                  </button>
                </div>

                {/* Operations Subsection */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Operations</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("/app/lab")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faFlask} className="w-3 h-3 text-gray-500" />
                    <span>Back Office (Lab)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/business/templates")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3 text-gray-500" />
                    <span>Invoice Templates</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nav("/app/business/bulk-operations")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                  >
                    <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3 text-gray-500" />
                    <span>Bulk Operations</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* REPORTS Group */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('reports')}
              className="w-full group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-300 hover:transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/60 transition-colors">
                  <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium">REPORTS</span>
              </div>
              <div className="p-1 rounded-lg bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                <FontAwesomeIcon 
                  icon={expandedGroups.reports ? faChevronDown : faChevronRight} 
                  className="w-3 h-3 transition-transform duration-200" 
                />
              </div>
            </button>
            {expandedGroups.reports && (
              <div className="ml-6 mt-2 space-y-1 pl-4 border-l-2 border-amber-200 dark:border-amber-800">
                <button
                  type="button"
                  onClick={() => nav("/app/reports")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faChartLine} className="w-3 h-3 text-amber-500" />
                  <span>Business Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/analytics")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faChartLine} className="w-3 h-3 text-amber-500" />
                  <span>Advanced Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => nav("/app/business/reports")}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-200 hover:transform hover:translate-x-1"
                >
                  <FontAwesomeIcon icon={faFileExport} className="w-3 h-3 text-amber-500" />
                  <span>Reports & Export</span>
                </button>
              </div>
            )}
          </div>

          {/* SETTINGS */}
          <button
            type="button"
            onClick={() => nav("/app/settings")}
            className="w-full group flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-300 hover:transform hover:scale-[1.01]"
          >
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
              <FontAwesomeIcon icon={faCog} className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="font-medium">SETTINGS</span>
          </button>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={logout}
            className="w-full group flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:transform hover:scale-[1.01]"
          >
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-800/60 transition-colors">
              <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
            </div>
            <span className="font-medium">LOGOUT</span>
          </button>
        </nav>

        {/* Tenant Profile Card */}
        <div className="p-4 mt-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-700/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {tenant?.business_name || "—"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Currency: <span className="font-bold text-blue-600 dark:text-blue-400">{tenant?.currency || "EUR"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Modern Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Modern Mobile hamburger button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden group p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <FontAwesomeIcon icon={faBars} className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </button>
              
              {/* Mobile app title with gradient */}
              <div className="md:hidden flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">F</span>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                  Finovo
                </div>
              </div>
              
              {/* Modern Desktop search */}
              <div className="hidden md:flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 px-4 py-3 shadow-sm border border-gray-200/60 dark:border-gray-600/60 hover:shadow-md transition-all duration-300 min-w-[320px]">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  placeholder="Search invoices, clients, transactions..." 
                  className="bg-transparent outline-none text-sm flex-1 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 font-medium" 
                />
                <div className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-500 dark:text-gray-400 font-mono">
                  ⌘K
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Modern Quick Action Button */}
              <button
                type="button"
                onClick={() => nav("/app/invoices/new")}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 font-medium"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span>New Invoice</span>
              </button>

              {/* Modern Theme Toggle */}
              <div className="group p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <ThemeToggleMini />
              </div>

              {/* Modern Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shadow-sm hover:shadow-md hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/40 dark:hover:to-red-800/40 transition-all duration-300 hover:scale-105 font-medium"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="flex-1 bg-gradient-to-br from-transparent to-gray-50/30 dark:to-gray-800/20">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <Outlet context={{ session, tenant, tenants, setTenant }} />
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistant 
        context="Business Management Assistant" 
        tenant={tenant}
        currentPage={loc.pathname}
      />
    </div>
  );
}
