"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";

type Role = "ceo" | "board" | "agent" | "customer" | "vendor";

interface Props {
  children: React.ReactNode;
  role: Role;
  userName: string;
}

export function MobileNavWrapper({ children, role, userName }: Props) {
  const [open, setOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="dash-shell">
      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — gets the .sidebar-open class on mobile when open */}
      <div className={`dash-sidebar${open ? " sidebar-open" : ""}`}>
        {/* Mobile close button */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 z-50 p-2 rounded-lg hover:bg-white/10 text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <AppSidebar role={role} userName={userName} onClose={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <main className="dash-content">
        {/* Mobile topbar — shows only on small screens */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20"
          style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => setOpen(true)}
            className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <span className="font-black text-base" style={{ color: "#3B0764" }}>
            Local<span style={{ color: "#7C3AED" }}>Mart</span>
          </span>
        </div>

        {children}
      </main>
    </div>
  );
}
