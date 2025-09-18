import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import supabase from "../lib/supabase";
import SiteHeader from "../components/SiteHeader.jsx";
import Testimonials from "../components/testimonials.jsx";
import FaqSection from "../components/FaqSection.jsx";

const defaultHighlights = [
  {
    slug: "startups-served",
    title: "Startups Served",
    description: "Empowering founders across borders with intuitive financial tools.",
    value: 10,
    value_prefix: "",
    value_suffix: "+",
    value_display: "",
    value_decimals: 0,
  },
  {
    slug: "total-invoiced",
    title: "Total Invoiced",
    description: "Helping startups secure crucial funding to fuel their big ideas.",
    value: 10000,
    value_prefix: "$",
    value_suffix: "",
    value_display: "10K+",
    value_decimals: 0,
  },
  {
    slug: "time-saved",
    title: "Time Saved",
    description: "Automating busy work, giving founders more time to innovate and grow.",
    value: 30,
    value_prefix: "",
    value_suffix: "%",
    value_display: "",
    value_decimals: 0,
  },
  {
    slug: "client-reviews",
    title: "Client Reviews",
    description: "A dedicated team building the future of startup finance.",
    value: 15,
    value_prefix: "",
    value_suffix: "+",
    value_display: "",
    value_decimals: 0,
  },
];

const defaultHighlightsBySlug = defaultHighlights.reduce((acc, highlight) => {
  acc[highlight.slug] = highlight;
  return acc;
}, {});

/**
 * Smoothly scroll to the current hash, with optional offset for sticky headers.
 * Usage: <ScrollToHash offset={0} />
 */
function ScrollToHash({ offset = 0 }) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, [hash, offset]);
  return null;
}

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [highlights, setHighlights] = useState(defaultHighlights);

  useEffect(() => {
    let sub;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      sub = supabase.auth.onAuthStateChange((_e, sess) => setLoggedIn(!!sess));
    })();
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function fetchHighlights() {
      try {
        const { data, error } = await supabase
          .from("landing_highlights")
          .select(
            "slug,title,description,value,value_prefix,value_suffix,value_display,value_decimals,sort_order"
          )
          .order("sort_order", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isCancelled && data && data.length > 0) {
          const normalized = data.map((item, index) => {
            const fallback =
              defaultHighlightsBySlug[item.slug] ??
              defaultHighlights[index] ??
              defaultHighlights[0];

            const decimalsRaw =
              typeof item.value_decimals === "number"
                ? item.value_decimals
                : Number(item.value_decimals);
            const valueDecimals = Number.isFinite(decimalsRaw)
              ? decimalsRaw
              : fallback?.value_decimals ?? 0;

            const rawValue =
              typeof item.value === "number"
                ? item.value
                : item.value !== null && item.value !== undefined
                ? Number(item.value)
                : NaN;
            const value = Number.isFinite(rawValue)
              ? rawValue
              : fallback?.value ?? 0;

            return {
              slug: item.slug ?? fallback.slug ?? `highlight-${index}`,
              title: item.title ?? fallback.title,
              description: item.description ?? fallback.description,
              value,
              value_prefix: item.value_prefix ?? fallback.value_prefix ?? "",
              value_suffix: item.value_suffix ?? fallback.value_suffix ?? "",
              value_display:
                typeof item.value_display === "string"
                  ? item.value_display
                  : fallback.value_display ?? "",
              value_decimals: valueDecimals,
            };
          });

          setHighlights(normalized);
        }
      } catch (err) {
        console.error("Failed to load landing highlights", err);
      }
    }

    fetchHighlights();

    return () => {
      isCancelled = true;
    };
  }, []);

  const formatHighlightValue = (highlight) => {
    const prefix = highlight.value_prefix ?? "";
    const suffix = highlight.value_suffix ?? "";
    const display =
      typeof highlight.value_display === "string" && highlight.value_display.trim().length > 0
        ? highlight.value_display.trim()
        : null;

    if (display) {
      return `${prefix}${display}${suffix}`;
    }

    const decimals = Number.isFinite(highlight.value_decimals)
      ? highlight.value_decimals
      : 0;

    const numericValue =
      typeof highlight.value === "number"
        ? highlight.value
        : Number(highlight.value);

    if (!Number.isFinite(numericValue)) {
      return `${prefix}${suffix}`.trim() || "—";
    }

    const formattedNumber = numericValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${prefix}${formattedNumber}${suffix}`;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
      {/* If SiteHeader is fixed, pass its height (e.g., 72) */}
      <ScrollToHash offset={0} />
      <SiteHeader />

      {/* Hero */}
      <main>
        <section
          id="home"
          className="relative py-20 bg-finovo-light/50 dark:bg-gray-800/50 overflow-hidden"
        >
          {/* soft radial wash */}
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,rgba(60,107,91,0.10),rgba(217,240,225,0.40))]" />

          <div className="absolute inset-0 -z-10 overflow-hidden opacity-25">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 1200 800"
            >
              <defs>
                <linearGradient id="finovoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3c6b5b" />
                  <stop offset="100%" stopColor="#9ad0bb" />
                </linearGradient>
              </defs>
              <g fill="none" stroke="url(#finovoGrad)" strokeWidth="1.2">
                <circle cx="160" cy="140" r="110" />
                <circle cx="1040" cy="220" r="140" />
                <circle cx="600" cy="680" r="200" />
                <path d="M0,420 C300,300 900,540 1200,420" />
              </g>
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center relative">
            <div className="md:max-w-3xl mx-auto">
              <p className="text-finovo text-lg font-semibold mb-2">
                From one startup to another
              </p>
              {/* H1 for SEO */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight text-gray-900 dark:text-white">
                <span className="text-finovo">Finovo</span> gives you a clear
                view of your money
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90 text-gray-700 dark:text-gray-300">
                Less time on books, more time on breakthrough ideas.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center mb-12">
                {!loggedIn ? (
                  <Link
                    to="/register"
                    className="px-8 py-3 rounded-full bg-finovo text-white font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Get started for free
                  </Link>
                ) : (
                  <Link
                    to="/app"
                    className="px-8 py-3 rounded-full bg-finovo text-white font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Open your workspace
                  </Link>
                )}
                <a
                  href="#features"
                  className="px-8 py-3 rounded-full border border-finovo/30 text-finovo font-semibold hover:bg-white transition"
                >
                  Explore features
                </a>
              </div>
            </div>

            {/* Screenshot — larger, transparent, big width, nice shadow */}
            <div className="relative mx-auto max-w-7xl p-4 bg-transparent">
              <div className="w-full flex items-center justify-center">
                <img
                  src="/assets/imgs/hero-main.png"
                  alt="Finovo preview"
                  className="w-[1800px] max-w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Us */}
        <section id="about" className="relative py-20 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 text-center md:text-left">
                <p className="text-finovo text-lg font-semibold mb-2">
                  Our Story
                </p>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-gray-900 dark:text-white">
                  Built on a foundation of{" "}
                  <span className="text-finovo">trust</span> and innovation.
                </h2>
                <p className="text-lg md:text-xl mb-6 opacity-90 text-gray-700 dark:text-gray-300">
                  We're innovating for you. Finovo was born out of our own
                  startup journey, built to be the clear and simple solution we
                  needed.
                </p>
                <p className="text-lg md:text-xl mb-8 opacity-90 text-gray-700 dark:text-gray-300">
                  We get it. We're founders, too. We built Finovo because we
                  couldn't find financial tools that were simple and affordable.
                </p>
                <Link
                  to="/about"
                  className="px-8 py-3 rounded-full bg-finovo text-white font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200"
                >
                  Learn more about us
                </Link>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <img
                  src="/assets/imgs/sc-about.png"
                  alt="About Finovo"
                  className="rounded-2xl shadow-xl max-w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature: Invoices */}
        <section id="features" className="bg-white dark:bg-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center lg:space-x-12">
              {/* Image */}
              <div className="lg:w-1/2 mb-10 lg:mb-0 relative">
                <img
                  src="/assets/imgs/sc-invoice.png"
                  alt="Smart invoices feature"
                  className="rounded-lg shadow-xl"
                />
              </div>

              {/* Copy */}
              <div className="lg:w-1/2 text-center lg:text-left">
                <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                  Smart invoices. Simple payments.
                </h2>
                <div className="mb-4">
                  {/* Demo Invoices Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Demo data - See how easy invoice management can be</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">INV-2024-001</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Web Development</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">TechCorp Ltd</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">tech@techcorp.com</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">$2,500.00</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Paid</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Sep 15, 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">INV-2024-002</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Consultation Services</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">StartupXYZ</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">hello@startupxyz.io</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">$1,200.00</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">Pending</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Sep 20, 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">INV-2024-003</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Subscription</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">Creative Agency</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">billing@creative.co</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">$450.00</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Overdue</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Sep 10, 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">INV-2024-004</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Design & Branding</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">Local Business</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">contact@localbiz.com</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">$800.00</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">Draft</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Sep 25, 2024</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 px-4 sm:px-0 py-6 ">
                    Generate custom invoices in seconds and share them directly
                    with clients. Finovo is designed to make the entire process
                    effortless, from creation to collection. It’s invoicing,
                    simplified.
                  </p>
                </div>

                <div className=" px-4 py-2 mt-8 flex gap-3 items-center justify-center">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-md text-white bg-finovo hover:opacity-90"
                  >
                    Talk to sales
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature: Quotations */}
        <section className="bg-gray-50 dark:bg-gray-700 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row-reverse items-center lg:space-x-12">
              {/* Image */}
              <div className="lg:w-1/2 mb-10 lg:mb-0 relative">
                <img
                  src="/assets/imgs/quatation-happy-client.png"
                  alt="Smart shareable quotations feature"
                  className="rounded-lg"
                />
              </div>

              {/* Copy */}
              <div className="lg:w-1/2 text-center lg:text-left">
                <p className="text-sm font-semibold text-finovo uppercase tracking-wider">
                  OUR FEATURE
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                  Smart Sharable Quotations
                </h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                  Just build it, send it with a single tap to WhatsApp, and get
                  feedback from your client in the cloud. It's quoting,
                  simplified.
                </p>
                <div className="mt-8">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-md text-white bg-finovo hover:opacity-90"
                  >
                    Get in touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Finovo */}
        <section id="why" className="bg-gray-100 dark:bg-gray-700 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-finovo text-lg font-semibold mb-2 uppercase">
              Why Finovo
            </h3>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-16">
              Designed for the future of your business.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Card 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-full max-w-sm rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg mb-6">
                  <img
                    src="/assets/imgs/sc-smart_analysis.png"
                    alt="Real-Time Analytics UI"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Real-Time Analytics
                </h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Get a clear, real-time view of your finances.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-full max-w-sm rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg mb-6">
                  <img
                    src="/assets/imgs/sc-real_time.png"
                    alt="Seamless Integrations UI"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Seamless Integrations
                </h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Connected ecosystem that works the way you do.
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-full max-w-sm rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg mb-6">
                  <img
                    src="/assets/imgs/sc-manage-quotes.png"
                    alt="Request Payments UI"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Smart Finances Manager
                </h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Get your proposals going in seconds and share seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Boost Productivity */}
        <section
          id="productivity"
          className="bg-white dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* LEFT: copy */}
            <div className="max-w-xl">
              <span className="inline-flex items-center rounded-full bg-finovo/10 text-finovo px-4 py-1.5 text-sm font-semibold">
                Boost Your Work
              </span>

              <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
                Boost Your Productivity
              </h2>

              <p className="mt-4 text-gray-600 dark:text-white leading-relaxed">
                Finovo cuts admin time to minutes. Create invoices, track
                expenses, and see cashflow in real time—so you can focus on
                growth, not paperwork.
              </p>

              <ul className="mt-6 space-y-3 text-gray-700 dark:text-white">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-finovo text-white text-xs">
                    ✓
                  </span>
                  Automated quotes → invoice workflows with reminders.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-finovo text-white text-xs">
                    ✓
                  </span>
                  Live dashboard for payments, AR/AP, and runway.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-finovo text-white text-xs">
                    ✓
                  </span>
                  Share via WhatsApp or email with smart links.
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg bg-finovo px-5 py-3 text-white font-semibold shadow hover:bg-finovo-dark"
                >
                  Explore Features
                </a>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold border border-gray-300 dark:border-gray-400 text-gray-800 dark:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-100 dark:bg-white"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* RIGHT: analytic card */}
            <div className="relative">
              {/* soft backdrop “blob” */}
              <div
                className="absolute -inset-6 rounded-3xl bg-finovo/5 blur-2xl"
                aria-hidden
              />
              <div className="relative mx-auto w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                {/* Card header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <div className="text-sm text-gray-500">Cashflow</div>
                    <div className="text-lg font-semibold text-gray-900">
                      This Week
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Paid</div>
                    <div className="text-base font-bold text-finovo">
                      €12,460
                    </div>
                  </div>
                </div>

                {/* Chart (inline SVG) */}
                <div className="px-5 py-6">
                  <svg viewBox="0 0 420 180" className="w-full h-40">
                    {/* grid */}
                    <g stroke="#e5e7eb" strokeWidth="1">
                      <line x1="40" y1="30" x2="400" y2="30" />
                      <line x1="40" y1="70" x2="400" y2="70" />
                      <line x1="40" y1="110" x2="400" y2="110" />
                      <line x1="40" y1="150" x2="400" y2="150" />
                    </g>
                    {/* axes */}
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#9ca3af" />
                    <line x1="40" y1="160" x2="400" y2="160" stroke="#9ca3af" />
                    {/* bars */}
                    <g>
                      <rect
                        x="60"
                        y="95"
                        width="36"
                        height="65"
                        fill="#d9f0e1"
                      />
                      <rect
                        x="106"
                        y="70"
                        width="36"
                        height="90"
                        fill="#3c6b5b"
                      />
                      <rect
                        x="152"
                        y="85"
                        width="36"
                        height="75"
                        fill="#d9f0e1"
                      />
                      <rect
                        x="198"
                        y="120"
                        width="36"
                        height="40"
                        fill="#d9f0e1"
                      />
                      <rect
                        x="244"
                        y="60"
                        width="36"
                        height="100"
                        fill="#3c6b5b"
                      />
                      <rect
                        x="290"
                        y="45"
                        width="36"
                        height="115"
                        fill="#d9f0e1"
                      />
                      <rect
                        x="336"
                        y="30"
                        width="36"
                        height="130"
                        fill="#3c6b5b"
                      />
                    </g>
                    {/* labels */}
                    <g fill="#6b7280" fontSize="12" textAnchor="middle">
                      <text x="78" y="175">
                        Mon
                      </text>
                      <text x="124" y="175">
                        Tue
                      </text>
                      <text x="170" y="175">
                        Wed
                      </text>
                      <text x="216" y="175">
                        Thu
                      </text>
                      <text x="262" y="175">
                        Fri
                      </text>
                      <text x="308" y="175">
                        Sat
                      </text>
                      <text x="354" y="175">
                        Sun
                      </text>
                    </g>
                  </svg>

                  {/* Legend */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{ background: "#3c6b5b" }}
                      />
                      Paid
                    </span>
                    <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{ background: "#d9f0e1" }}
                      />
                      Outstanding
                    </span>
                  </div>
                </div>

                {/* Footer stats */}
                <div className="grid grid-cols-2 gap-0 border-t">
                  <div className="p-4">
                    <div className="text-xs text-gray-500">Invoices Sent</div>
                    <div className="text-lg font-semibold text-gray-900">
                      28
                    </div>
                  </div>
                  <div className="p-4 border-l">
                    <div className="text-xs text-gray-500">
                      Avg. Days to Pay
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      3.2
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-white dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
        <Testimonials />
        </section>


        <section
          id="we-do-it-differently"
          className="bg-white dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 py-16 sm:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-12">
                  We do this differently
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {highlights.map((highlight) => (
                    <div
                      key={highlight.slug}
                      className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center h-full"
                    >
                      <p className="text-5xl font-extrabold text-finovo mb-2">
                        {formatHighlightValue(highlight)}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {highlight.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <FaqSection />
          </div>
        </section>

        {/* Contact Us – Finovo */}
        <section id="contact" className="bg-white dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT: headline + meta + form */}
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white">
                Have a Project in Mind?
                <span className="block text-finovo">Contact Us</span>
              </h2>

              <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-xl">
                Tell us what you’re building. We’ll show how Finovo cuts admin
                time, clarifies cashflow, and keeps you focused on growth.
              </p>

              {/* quick contacts */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  {/* mail icon */}
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-finovo/10 text-finovo">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 6h16v12H4z" />
                      <path d="m22 6-10 7L2 6" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">
                      Email Us
                    </div>
                    <a
                      href="mailto:support@finovo.app"
                      className="text-gray-700 dark:text-gray-300 hover:text-finovo dark:hover:text-finovo"
                    >
                      support@finovo.app
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {/* phone icon */}
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-finovo/10 text-finovo">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.88.31 1.73.57 2.55a2 2 0 0 1-.45 2.11L7.1 9.9a16 16 0 0 0 6 6l1.52-1.12a2 2 0 0 1 2.11-.45c.82.26 1.67.45 2.55.57A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">
                      Phone Us
                    </div>
                    <a
                      href="tel:+351931608896"
                      className="text-gray-700 dark:text-gray-300 hover:text-finovo dark:hover:text-finovo"
                    >
                      +351 931 608 896
                    </a>
                  </div>
                </div>
              </div>

              {/* form */}
              <form
                className="mt-8 space-y-4 max-w-xl"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-finovo focus:border-finovo"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-finovo focus:border-finovo"
                  />
                </div>

                <textarea
                  rows="4"
                  placeholder="Write Message"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-finovo focus:border-finovo"
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-finovo px-6 py-3 text-white font-semibold shadow hover:bg-finovo-dark"
                >
                  Send Us Message
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              </form>
            </div>

            {/* RIGHT: image card with Finovo glow + accent */}
            <div className="relative">
              {/* accent lines */}
              <div className="absolute -top-6 -right-3 h-24 w-24 rotate-12">
                <div className="h-full w-full rounded-2xl bg-[repeating-linear-gradient(90deg,theme(colors.emerald.600/.25)_0_3px,transparent_3px_8px)]" />
              </div>

              <div className="relative mx-auto max-w-md rounded-[10px] p-1">
                <div className="rounded-[14px]">
                  <img
                    src="/assets/imgs/contact-us-finovo.png"
                    alt="Finovo consultation"
                    className="block w-full h-[580px] object-cover"
                  />
                </div>
                {/* soft glow */}
                <div className="absolute inset-0 -z-10 blur-3xl rounded-[32px] bg-finovo/20" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-finovo text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* top grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 border-b border-white/20 pb-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <a href="#home" className="flex items-center space-x-2">
                <span className="text-2xl font-bold">Finovo</span>
              </a>
              <p className="mt-4 text-white/80 max-w-xs">
                Designed by small business for small business like yours.
              </p>

              {/* Newsletter form */}
              <form
                className="mt-6 flex max-w-md"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-l-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-finovo-dark"
                />
                <button
                  type="submit"
                  className="rounded-r-lg bg-finovo-dark px-5 py-3 font-semibold hover:bg-finovo-light transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-2 text-xs text-white/60">
                Stay updated with our latest features and insights.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                {/* Only show Pricing if you have a /pricing route */}
                {/* <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li> */}
                <li>
                  <a href="#why" className="hover:text-white transition-colors">
                    Why Finovo
                  </a>
                </li>
                <li>
                  <a
                    href="#productivity"
                    className="hover:text-white transition-colors"
                  >
                    Productivity
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <a
                    href="#about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/culture"
                    className="hover:text-white transition-colors"
                  >
                    Culture
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link
                    to="/getting-started"
                    className="hover:text-white transition-colors"
                  >
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/status"
                    className="hover:text-white transition-colors"
                  >
                    Server Status
                  </Link>
                </li>
                <li>
                  <Link
                    to="/bug"
                    className="hover:text-white transition-colors"
                  >
                    Report a Bug
                  </Link>
                </li>
                <li>
                  <Link
                    to="/chat"
                    className="hover:text-white transition-colors"
                  >
                    Chat Support
                  </Link>
                </li>
              </ul>

              <h3 className="font-bold mt-8 mb-4">Social</h3>
              <div className="flex space-x-3 text-2xl">
                <a
                  href="https://facebook.com"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f" />
                </a>
                <a
                  href="https://twitter.com"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <i className="fab fa-twitter" />
                </a>
                <a
                  href="https://instagram.com"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram" />
                </a>
                <a
                  href="https://linkedin.com"
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <i className="fab fa-linkedin-in" />
                </a>
              </div>
            </div>
          </div>

          {/* bottom */}
          <div className="text-center text-sm text-white/70">
            &copy; {new Date().getFullYear()} Finovo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
