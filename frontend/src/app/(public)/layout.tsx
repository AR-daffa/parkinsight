import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="public">{children}</AppShell>;
}
