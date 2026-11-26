"use client";

import {
  BookOpen,
  CalendarClock,
  Info,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PUBLIC_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/": LayoutDashboard,
  "/pola-parkir": CalendarClock,
  "/panduan": BookOpen,
  "/tentang": Info,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
    >
      <div className="grid grid-cols-4">
        {PUBLIC_NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-blue-700" : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-blue-600" : "text-slate-400",
                )}
              />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
