"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

const emptySubscribe = () => () => {};

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("parkinsight-auth-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("parkinsight-auth-change", callback);
  };
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const hasToken = useSyncExternalStore(
    subscribeStorage,
    () => Boolean(window.localStorage.getItem("parkinsight_admin_token")),
    () => false,
  );

  useEffect(() => {
    if (isClient && !hasToken) {
      router.replace("/admin/login");
    }
  }, [isClient, hasToken, router]);

  if (!isClient || !hasToken) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Memeriksa sesi pengelola...
      </div>
    );
  }

  return <>{children}</>;
}
