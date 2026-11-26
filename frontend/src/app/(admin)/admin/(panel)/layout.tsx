import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminGuard>
      <AppShell variant="admin">{children}</AppShell>
    </AdminGuard>
  );
}
