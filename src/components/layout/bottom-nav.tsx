"use client";

import { BarChart3, Home, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLedgerUi } from "@/components/layout/app-ui-provider";
import { haptic } from "@/lib/feedback";
import { useLedgerStore } from "@/store/use-ledger-store";

const NAV_ITEMS = [
  { href: "/", label: "小票墙", icon: Home },
  { href: "/insights", label: "回顾", icon: BarChart3 },
  { href: "/settings", label: "我的", icon: Settings2 },
];

export function BottomNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname() ?? "/";
  const route = pathname.replace(/\/+$/, "") || "/";
  const hapticsEnabled = useLedgerStore((state) => state.settings.haptics);
  const { openCreate } = useLedgerUi();

  const navLink = (item: (typeof NAV_ITEMS)[number]) => {
    const active = route === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          onNavigate();
          haptic(hapticsEnabled);
        }}
        className={`flex h-14 w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-colors ${
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[440px] -translate-x-1/2 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="flex h-[76px] items-center px-2">
        <div className="flex flex-1 items-center justify-around">{NAV_ITEMS.slice(0, 2).map(navLink)}</div>
        <div className="w-[72px] shrink-0" aria-hidden="true" />
        <div className="flex flex-1 items-center justify-around">{NAV_ITEMS.slice(2).map(navLink)}</div>
      </div>
      <button
        type="button"
        aria-label="记一笔"
        onClick={() => {
          haptic(hapticsEnabled);
          openCreate();
        }}
        className="absolute -top-7 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
    </nav>
  );
}
