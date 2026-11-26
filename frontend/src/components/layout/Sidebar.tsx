"use client";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  FileSpreadsheet,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV_ITEMS, PUBLIC_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PUBLIC_ICONS: Record<string, typeof LayoutDashboard> = {
  "/": LayoutDashboard,
  "/pola-parkir": CalendarClock,
  "/panduan": BookOpen,
  "/tentang": Info,
};

const ADMIN_ICONS: Record<string, typeof SlidersHorizontal> = {
  "/admin": SlidersHorizontal,
  "/admin/monitoring": Activity,
  "/admin/laporan": FileSpreadsheet,
};

export type SidebarVariant = "public" | "admin";

interface SidebarContentProps {
  variant: SidebarVariant;
  onNavigate?: () => void;
}

function SidebarContent({ variant, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    window.localStorage.removeItem("parkinsight_admin_token");
    window.dispatchEvent(new Event("parkinsight-auth-change"));
    onNavigate?.();
    router.push("/admin/login");
  };

  const navItems = variant === "admin" ? ADMIN_NAV_ITEMS : PUBLIC_NAV_ITEMS;
  const iconMap = variant === "admin" ? ADMIN_ICONS : PUBLIC_ICONS;
  const rootHref = variant === "admin" ? "/admin" : "/";

  return (
    <div className="flex h-full flex-col bg-[#0F1D3A] text-slate-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-blue-600 shadow-sm ring-1 ring-white/20">
          <Image
            src="/images/logo-parkinsight.jpeg"
            alt="Logo ParkInsight"
            fill
            sizes="44px"
            priority
            className="scale-[1.34] object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold tracking-tight text-white">
            ParkInsight
          </p>
          <p className="truncate text-xs text-blue-200/80">
            {variant === "admin" ? "Panel Pengelola" : "Parkir Triguna UIN"}
          </p>
        </div>
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3.5 py-5"
        aria-label="Navigasi Utama"
      >
        {navItems.map((item) => {
          const Icon = iconMap[item.href] ?? LayoutDashboard;
          const active =
            item.href === rootHref
              ? pathname === rootHref
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-blue-600 font-semibold text-white shadow-xs"
                  : "font-medium text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-white" : "text-blue-300/80",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3.5 pb-14">
        {variant === "admin" ? (
          <>
            <Link
              href="/"
              onClick={onNavigate}
              className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span>Lihat Halaman Publik</span>
              <ArrowUpRight className="h-4 w-4 text-blue-300/80" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/15 hover:text-rose-200"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Keluar</span>
            </button>
          </>
        ) : (
          <Link
            href="/admin/login"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogIn className="h-4 w-4 shrink-0 text-blue-300/80" />
            <span>Masuk Pengelola</span>
          </Link>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  variant: SidebarVariant;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ variant, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:block md:w-64">
        <SidebarContent variant={variant} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />
          <aside className="relative z-10 flex h-full w-64 max-w-[82vw] flex-col bg-[#0F1D3A] shadow-xl">
            <button
              type="button"
              aria-label="Tutup navigasi"
              onClick={onCloseMobile}
              className="absolute top-4 right-3 z-20 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent variant={variant} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
