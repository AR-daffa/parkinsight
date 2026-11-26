"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar, type SidebarVariant } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function AppShell({
  children,
  variant = "public",
}: {
  children: ReactNode;
  variant?: SidebarVariant;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        variant={variant}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-screen flex-col md:pl-64">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-12">
          {children}
        </main>
      </div>

      {variant === "public" && <BottomNav />}
    </div>
  );
}
