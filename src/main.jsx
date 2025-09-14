import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import App from "./App.jsx";                 // Back Office (Lab)
import Onboard from "./Onboard.jsx";
import TenantProfile from "./TenantProfile.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import AfterLogin from "./pages/AfterLogin.jsx";

import AppShell from "./app/AppShell.jsx";
import Dashboard from "./app/Dashboard.jsx";
import InvoiceNew from "./app/InvoiceNew.jsx";
import ClientNew from "./app/ClientNew.jsx";
import InvoiceWizard from "./app/InvoiceWizard";
import InvoicePay from "./app/InvoicePay";
import QuoteNew from "./app/QuoteNew.jsx";
import QuotePreview from "./app/QuotePreview.jsx";
import QuotationNew from "./app/QuotationNew.jsx";
import QuotationPreview from "./app/QuotationPreview.jsx";
import ReceiptNew from "./app/ReceiptNew.jsx";
import ItemNew from "./app/ItemNew.jsx";
import Settings from "./app/Settings.jsx";
import Cashflow from "./app/Cashflow.jsx";
import CashflowNew from "./app/CashflowNew.jsx";
import DocumentGeneration from "./app/DocumentGeneration.jsx";
import Invoices from "./app/Invoices.jsx";
import Receipts from "./app/Receipts.jsx";
import ReportsUnderDevelopment from "./app/ReportsUnderDevelopment.jsx";
import InventoryUnderDevelopment from "./app/InventoryUnderDevelopment.jsx";
import CRMUnderDevelopment from "./app/CRMUnderDevelopment.jsx";





createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/after-login" element={<AfterLogin />} />
        <Route path="/app/invoices/new" element={<InvoiceWizard />} />


        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceNew />} />
          <Route path="invoices/wizard" element={<InvoiceWizard />} />
          <Route path="invoices/:id/pay" element={<InvoicePay />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="receipts/new" element={<ReceiptNew />} />
          <Route path="quotes/new" element={<QuoteNew />} />
          <Route path="quotes/preview" element={<QuotePreview />} />
          <Route path="quotations/new" element={<QuotationNew />} />
          <Route path="quotations/preview" element={<QuotationPreview />} />
          <Route path="clients/new" element={<ClientNew />} />
          <Route path="items/new" element={<ItemNew />} />
          <Route path="cashflow" element={<Cashflow />} />
          <Route path="cashflow/new" element={<CashflowNew />} />
          <Route path="business/documents" element={<DocumentGeneration />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<ReportsUnderDevelopment />} />
          <Route path="inventory" element={<InventoryUnderDevelopment />} />
          <Route path="crm" element={<CRMUnderDevelopment />} />
          <Route path="lab" element={<App />} />
        </Route>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/tenant-profile" element={<TenantProfile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
