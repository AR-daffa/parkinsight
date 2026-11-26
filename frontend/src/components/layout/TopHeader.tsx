"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { OPERATIONAL_HOURS } from "@/lib/constants";

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

export function TopHeader({ onOpenMobileMenu }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5 md:hidden">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-blue-600">
              <Image
                src="/images/logo-parkinsight.jpeg"
                alt="Logo ParkInsight"
                fill
                sizes="32px"
                className="scale-[1.34] object-cover"
              />
            </div>
            <span className="text-sm font-bold text-slate-900">
              ParkInsight
            </span>
          </div>

          <span className="hidden text-xs font-medium text-slate-500 md:inline">
            Lahan Parkir Triguna — UIN Syarif Hidayatullah Jakarta
          </span>
        </div>

        <span className="text-xs font-medium text-slate-500 tabular-nums">
          {OPERATIONAL_HOURS.label}
        </span>
      </div>
    </header>
  );
}
