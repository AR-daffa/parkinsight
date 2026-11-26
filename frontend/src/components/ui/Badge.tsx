import type { ReactNode } from "react";
import { STATUS_META } from "@/lib/constants";
import type { ParkingStatusKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ParkingStatusKey;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function PillBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
