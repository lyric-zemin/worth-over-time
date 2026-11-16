"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { AppUiProvider } from "@/components/layout/app-ui-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingShell } from "@/components/layout/loading-shell";
import { STORAGE_ERROR_EVENT, STORAGE_KEY } from "@/lib/storage";
import { useLedgerStore } from "@/store/use-ledger-store";

export function AppLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    void useLedgerStore.persist.rehydrate().then(() => setMounted(true));
  }, []);

  useEffect(() => {
    const onStorageError = (event: Event) => toast.error((event as CustomEvent<string>).detail);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) void useLedgerStore.persist.rehydrate();
    };
    document.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current && y > 8) setCollapsed(true);
      else if (y < lastY.current - 4) setCollapsed(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return <LoadingShell />;

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="pointer-events-none fixed inset-y-0 left-[calc(50%-420px)] hidden w-40 flex-col justify-center gap-8 lg:flex" aria-hidden="true">
        <div className="receipt-paper h-56 rotate-[-9deg] rounded-2xl border opacity-45 shadow-receipt" />
        <div className="receipt-paper h-40 rotate-[7deg] rounded-2xl border opacity-30 shadow-receipt" />
      </div>
      <div className="pointer-events-none fixed inset-y-0 right-[calc(50%-420px)] hidden w-40 items-center lg:flex" aria-hidden="true">
        <div className="receipt-paper h-64 rotate-[11deg] rounded-2xl border opacity-35 shadow-receipt" />
      </div>

      <AppUiProvider>
        <AppHeader collapsed={collapsed} />
        <main className="relative px-4 pb-[126px] pt-[88px]">{children}</main>
        <BottomNav onNavigate={() => setCollapsed(false)} />
      </AppUiProvider>
    </div>
  );
}
