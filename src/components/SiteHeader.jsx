// src/components/SiteHeader.jsx
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";

const SECTION_LINKS = [
  { label: "Home", id: "home", to: "/#home", type: "hash" },
  { label: "Product", id: "features", to: "/#features", type: "hash" },
  // { label: "Pricing", to: "/pricing", type: "route" },
  { label: "Company", id: "about", to: "/#about", type: "hash" },
  { label: "Resources", id: "productivity", to: "/#productivity", type: "hash" },
  { label: "Contact", id: "contact", to: "/#contact", type: "hash" },
];

function MobileDrawer({ open, onClose, loggedIn, onLogout }) {
  if (!open) return null;

  // Render at <body> level to escape header stacking context
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] md:hidden">
      {/* Soft overlay to block background */}
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 z-[10000] bg-black/40 transition-opacity opacity-100"
      />
      {/* Drawer panel */}
      <div
        className={`
          absolute inset-y-0 left-0 z-[10001] w-80 max-w-[85vw]
          bg-white border-r shadow-[0_10px_30px_rgba(0,0,0,0.20)]
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-finovo" />
            <span className="font-semibold">Finovo</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="px-5 py-4 overflow-y-auto">
          <ul className="space-y-3 text-[15px]">
            {SECTION_LINKS.map((link) => (
              <li key={`m-${link.label}`}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  className="block px-2 py-2 rounded-md hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {loggedIn && (
              <li>
                <Link
                  to="/app"
                  onClick={onClose}
                  className="block px-2 py-2 rounded-md hover:bg-gray-50"
                >
                  Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* Divider */}
          <div className="my-5 h-px bg-gray-200" />

          {/* Auth + CTA */}
          {!loggedIn ? (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="block w-full text-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="block w-full text-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Sign Up
              </Link>
              <Link
                to="/#contact"
                onClick={onClose}
                className="block w-full text-center px-4 py-2 rounded-md text-white bg-finovo hover:opacity-95"
              >
                Book a demo
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/app"
                onClick={onClose}
                className="block w-full text-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={async () => { await onLogout?.(); onClose(); }}
                className="block w-full text-center px-4 py-2 rounded-md bg-gray-900 text-white hover:opacity-90"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>,
    document.body
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const location = useLocation();
  const nav = useNavigate();

  // Auth state
  useEffect(() => {
    let sub;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      sub = supabase.auth.onAuthStateChange((_e, sess) => setLoggedIn(!!sess));
    })();
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Scroll spy on landing only
  const observedIds = useMemo(
    () => SECTION_LINKS.filter(l => l.type === "hash" && l.id).map(l => l.id),
    []
  );
  useEffect(() => {
    if (location.pathname !== "/") return;
    const opts = { root: null, rootMargin: "0px 0px -55% 0px", threshold: 0.25 };
    const handler = (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveId(visible.target.id);
    };
    const io = new IntersectionObserver(handler, opts);
    observedIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [observedIds, location.pathname]);

  // Lock body scroll + ESC to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const navLinkClass = (isActive) =>
    `px-3 py-2 rounded-md transition-colors ${
      isActive ? "text-finovo font-semibold" : "text-gray-700 hover:text-finovo"
    }`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  };

  return (
    <header
      className={
        `sticky top-0 z-50 border-b border-gray-200
         ${mobileOpen ? "bg-[#26BA99]" : "bg-white/90"}
         md:bg-white/90 backdrop-blur`
      }
    >
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/#home" className="flex items-center">
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">
              Finovo
            </span>
          </Link>
        </div>

        {/* Centered desktop nav */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
          {SECTION_LINKS.map((link) =>
            link.type === "route" ? (
              <li key={link.label}>
                <Link to={link.to} className={navLinkClass(false)}>
                  {link.label}
                </Link>
              </li>
            ) : (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className={navLinkClass(activeId === link.id && location.pathname === "/")}
                >
                  {link.label}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {!loggedIn ? (
            <>
              <Link
                to="/login"
                className="hidden md:inline-block text-sm font-medium text-gray-700 hover:text-finovo"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="hidden md:inline-block text-sm font-medium text-gray-700 hover:text-finovo"
              >
                Sign Up
              </Link>
              <Link
                to="/#contact"
                className="hidden md:inline-block px-5 py-2 rounded-full bg-finovo text-white font-semibold shadow-md hover:opacity-95"
              >
                Book a demo
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/app"
                className="hidden md:inline-block text-sm font-medium text-gray-700 hover:text-finovo"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:inline-block text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:opacity-90"
              >
                Logout
              </button>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-finovo focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer rendered via portal */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        loggedIn={loggedIn}
        onLogout={handleLogout}
      />
    </header>
  );
}
