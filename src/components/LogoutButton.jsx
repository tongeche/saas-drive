import React from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";

export default function LogoutButton({ className = "" }) {
  const nav = useNavigate();
  const doLogout = async () => {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  };
  return (
    <button
      onClick={doLogout}
      className={`px-4 py-2 rounded-md bg-gray-900 text-white hover:opacity-90 ${className}`}
    >
      Logout
    </button>
  );
}
