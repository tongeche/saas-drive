import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import App from "./App.jsx";                 // Back Office (Lab)
import Onboard from "./Onboard.jsx";
import TenantProfile from "./TenantProfile.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";

import AppShell from "./app/AppShell.jsx";
import Dashboard from "./app/Dashboard.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* New nested App area */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
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
