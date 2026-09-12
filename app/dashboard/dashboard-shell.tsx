"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Home, Menu, X } from "lucide-react";
import SidebarNav from "./sidebar-nav";

function SidebarContent({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin?: boolean }) {
  return (
    <div className="flex min-h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
            <Home size={15} className="text-white" />
          </div>
          <span className="font-display text-lg font-medium text-gray-900">Ruang Kita</span>
        </div>
        <SidebarNav onNavigate={onNavigate} isAdmin={isAdmin} />
      </div>
      <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4">
        <UserButton afterSignOutUrl="/" />
        <span className="text-xs text-gray-500">Account</span>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar — includes the account button directly, so signing
          out never requires opening the drawer first. */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
            <Home size={15} className="text-white" />
          </div>
          <span className="font-display text-lg font-medium text-gray-900">Ruang Kita</span>
        </div>
        <div className="flex items-center gap-1">
          <UserButton afterSignOutUrl="/" />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile off-canvas drawer — now scrollable, so short screens or a
          growing nav list can never push the sign-out button off-screen. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-white shadow-lg">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} isAdmin={isAdmin} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
        <SidebarContent isAdmin={isAdmin} />
      </nav>

      <main className="flex-1 bg-[#FAF8F4] p-4 md:p-8">{children}</main>
    </div>
  );
}
