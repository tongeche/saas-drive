// src/components/FaqSection.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function FaqSection() {
  const [open, setOpen] = useState(() => new Set());

  const groups = useMemo(
    () => [
      {
        title: "Finovo",
        items: [
          {
            q: "What is Finovo?",
            a: "Finovo is a lightweight financial OS for founders: invoices, quotes, expenses, and a real-time cashflow dashboard—without the bloat or enterprise pricing.",
          },
          {
            q: "Why use Finovo instead of spreadsheets?",
            a: "Because spreadsheets don't chase payments, remind clients, or reconcile in real time. Finovo automates busywork so you spend time on product, not paperwork.",
          },
          {
            q: "Who is Finovo for?",
            a: "Early-stage startups, indie founders, and small teams that need clear cash visibility, simple billing, and shareable quotes—without hiring a finance team.",
          },
        ],
      },
      {
        title: "The Finovo difference",
        items: [
          {
            q: "How does Finovo help me get paid faster?",
            a: "Smart quotes → invoices, instant share links (WhatsApp/email), auto-reminders, and status tracking. Teams using Finovo typically reduce days-to-pay in their first month.",
          },
          {
            q: "Do I need another payment provider?",
            a: "No. You can keep your existing rails or plug in a supported processor. Finovo focuses on quoting, invoicing, reminders, and cash visibility.",
          },
          {
            q: "Does Finovo integrate with accounting tools?",
            a: "Yes. Finovo exports clean data and connects to common bookkeeping stacks. If you're on Xero/QuickBooks, syncing takes minutes.",
          },
          {
            q: "Is there an API?",
            a: "We're shipping a public API soon. Webhooks and CSV exports are already available for most workflows.",
          },
        ],
      },
      {
        title: "Pricing & billing",
        items: [
          {
            q: "Is there a free plan?",
            a: "Yes. Start free to issue quotes and invoices and explore cashflow basics. Upgrade when you need advanced automations and integrations.",
          },
          {
            q: "Can I cancel anytime?",
            a: "Of course. No lock-in. Your data is yours—you can export everything in a couple of clicks.",
          },
          {
            q: "Do you offer discounts for startups or nonprofits?",
            a: "We do. Early-stage and nonprofit discounts are available—book a quick demo and we'll set you up.",
          },
        ],
      },
      {
        title: "Security & data",
        items: [
          {
            q: "How secure is my data?",
            a: "We use industry-standard encryption in transit and at rest, role-based access controls, and least-privilege principles across our stack.",
          },
          {
            q: "Where is my data stored?",
            a: "In EU or US regions based on your workspace settings. Backups are frequent and encrypted.",
          },
          {
            q: "Are you GDPR compliant?",
            a: "Yes. We follow GDPR and support DSRs (export/delete). A DPA is available for customers upon request.",
          },
        ],
      },
    ],
    []
  );

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <section id="faq" className="bg-gray-50 dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            We know you have questions.
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Straight answers to the most common questions founders ask about a
            financial SaaS. No fluff, just clarity.
          </p>
        </div>

        <div className="space-y-12">
          {groups.map((group, gi) => (
            <div key={group.title}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {group.title}
              </h3>

              <ul className="space-y-3">
                {group.items.map((item, ii) => {
                  const key = "group-" + gi + ":item-" + ii;
                  const isOpen = open.has(key);
                  const panelId = "faq-panel-" + gi + "-" + ii;
                  const btnId = "faq-btn-" + gi + "-" + ii;
                  return (
                    <li key={key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        id={btnId}
                        aria-controls={panelId}
                        aria-expanded={isOpen}
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between text-left px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-finovo/60 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.q}
                        </span>
                        <span
                          className={"ml-4 inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform " + (
                            isOpen ? "rotate-45 bg-finovo text-white" : "bg-finovo text-white"
                          )}
                          aria-hidden="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </button>

                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        className={"px-4 pt-0 pb-4 text-gray-700 dark:text-gray-300 transition-[max-height,opacity] duration-200 ease-out " + (
                          isOpen ? "opacity-100" : "opacity-0 max-h-0 overflow-hidden"
                        )}
                      >
                        <p className="leading-relaxed">{item.a}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4">
          <p className="text-gray-700 dark:text-gray-300">
            Didn't find what you need?{" "}
            <span className="font-medium">We'll walk you through it live.</span>
          </p>
          <div className="flex gap-3">
            <Link
              to="/#contact"
              className="inline-flex items-center justify-center rounded-full bg-finovo px-5 py-2 text-white font-semibold hover:opacity-95"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
