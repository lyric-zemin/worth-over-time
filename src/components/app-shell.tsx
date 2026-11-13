"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { BarChart3, Home, Moon, Plus, Settings2, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DeltaBanner } from "@/components/delta-banner";
import { ExpireSheet } from "@/components/expire-sheet";
import { PurchaseDetailSheet } from "@/components/purchase-detail-sheet";
import { PurchaseFormSheet } from "@/components/purchase-form-sheet";
import { ReceiptList } from "@/components/receipt-list";
import { SettingsView } from "@/components/settings-view";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { formatDateCN, greetingForHour, todayKey } from "@/lib/date";
import { haptic } from "@/lib/feedback";
import { computeArchivedStats, computeStats } from "@/lib/money";
import { createSnapshot, diffSnapshots } from "@/lib/snapshot";
import { STORAGE_ERROR_EVENT, STORAGE_KEY } from "@/lib/storage";
import { useLedgerStore } from "@/store/use-ledger-store";
import type { DeltaSummary, ExpiryInfo, Purchase, SortKey } from "@/types/ledger";

const InsightsView = dynamic(
  () => import("@/components/insights-view").then((module) => module.InsightsView),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-3xl bg-card/60" aria-hidden="true" /> },
);

type TabKey = "home" | "insights" | "settings";
const NAV_ITEMS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "小票墙", icon: Home },
  { key: "insights", label: "回顾", icon: BarChart3 },
  { key: "settings", label: "我的", icon: Settings2 },
];

function LoadingShell() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-gradient-to-br from-primary/30 to-secondary text-4xl shadow-soft">🧾</div>
        <div className="text-sm font-semibold">正在翻开你的小票夹…</div>
        <div className="text-xs text-muted-foreground">数据只留在这台设备上</div>
      </div>
    </div>
  );
}

export function AppShell() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabKey>("home");
  const [dayKey, setDayKey] = useState("");
  const [delta, setDelta] = useState<DeltaSummary | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [expireId, setExpireId] = useState<string | null>(null);
  const initialCaptured = useRef(false);
  const lastCaptureAt = useRef(0);

  const { resolvedTheme, setTheme } = useTheme();
  const purchases = useLedgerStore((state) => state.purchases);
  const sortBy = useLedgerStore((state) => state.settings.sortBy);
  const hapticsEnabled = useLedgerStore((state) => state.settings.haptics);
  const showArchived = useLedgerStore((state) => state.settings.showArchived);
  const setSettings = useLedgerStore((state) => state.setSettings);
  const expirePurchase = useLedgerStore((state) => state.expirePurchase);
  const restoreExpired = useLedgerStore((state) => state.restoreExpired);

  useEffect(() => {
    void useLedgerStore.persist.rehydrate().then(() => setMounted(true));
  }, []);

  const captureView = useCallback(() => {
    const state = useLedgerStore.getState();
    const key = todayKey();
    setDayKey(key);
    const current = createSnapshot(state.purchases, key);
    setDelta(diffSnapshots(state.lastView, current, state.purchases));
    state.setLastView(current);
    lastCaptureAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!mounted || initialCaptured.current) return;
    initialCaptured.current = true;
    captureView();
  }, [mounted, captureView]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCaptureAt.current < 1500) {
        setDayKey(todayKey());
        return;
      }
      captureView();
    };
    const onStorageError = (event: Event) => toast.error((event as CustomEvent<string>).detail);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) void useLedgerStore.persist.rehydrate();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    const timer = window.setInterval(() => setDayKey(todayKey()), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
      window.clearInterval(timer);
    };
  }, [captureView]);

  const stats = useMemo(() => computeStats(purchases, dayKey || todayKey()), [purchases, dayKey]);
  const archivedStats = useMemo(() => computeArchivedStats(purchases), [purchases]);
  const deltaMap = useMemo(
    () => new Map(delta?.changedItems.map((item) => [item.id, item.fromDailyCostCents]) ?? []),
    [delta],
  );
  const detailStat = detailId
    ? [...stats.stats, ...archivedStats].find((item) => item.purchase.id === detailId) ?? null
    : null;
  const detailFrom = detailId ? deltaMap.get(detailId) : undefined;
  const expireTarget = expireId ? purchases.find((item) => item.id === expireId) ?? null : null;

  const openForm = (purchase: Purchase | null) => {
    setEditing(purchase);
    setFormOpen(true);
  };

  const navButton = (item: (typeof NAV_ITEMS)[number]) => {
    const active = tab === item.key;
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          setTab(item.key);
          haptic(hapticsEnabled);
        }}
        className={`flex h-14 w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-colors ${
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
        {item.label}
      </button>
    );
  };

  const handleDelete = useCallback(
    (id: string) => {
      const removed = useLedgerStore.getState().removePurchase(id);
      if (!removed) return;
      haptic(hapticsEnabled, 18);
      setDetailId((current) => (current === id ? null : current));
      toast("小票已撕下", {
        description: removed.name,
        action: {
          label: "撤销",
          onClick: () => {
            useLedgerStore.getState().restorePurchase(removed);
            toast.success("小票贴回来了");
          },
        },
      });
    },
    [hapticsEnabled],
  );

  const handleExpire = (expiry: ExpiryInfo) => {
    if (!expireId) return;
    expirePurchase(expireId, expiry);
    haptic(hapticsEnabled, 16);
    setExpireId(null);
    setDetailId(null);
    toast.success("失效章盖好了", {
      description: `${expiry.reason} · 共陪伴 ${expiry.finalDaysOwned} 天，数字已定格`,
    });
  };

  const handleRestore = () => {
    if (!detailId) return;
    restoreExpired(detailId);
    haptic(hapticsEnabled);
    setDetailId(null);
    toast.success("已恢复有效", { description: "天数会继续按原购买日往前走" });
  };

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

      <header className="glass-bar fixed left-1/2 top-0 z-30 w-full max-w-[440px] -translate-x-1/2">
        <div className="flex h-[72px] items-center justify-between gap-3 px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tabular text-muted-foreground">
              {formatDateCN(dayKey || todayKey())} · 时间小票
            </p>
            <h1 className="truncate text-lg font-bold tracking-tight">
              {greetingForHour(new Date().getHours())}，来看看小票
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-card/70"
            aria-label={resolvedTheme === "dark" ? "切换到浅色" : "切换到深色"}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="relative px-4 pb-[126px] pt-[88px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            {tab === "home" ? (
              <>
                <DeltaBanner
                  delta={delta}
                  activeCount={stats.count}
                  archivedCount={archivedStats.length}
                  onStart={() => openForm(null)}
                />
                <SummaryCard
                  totalCents={stats.totalCents}
                  totalDailyCostCents={stats.totalDailyCostCents}
                  count={stats.count}
                  archivedCount={archivedStats.length}
                />
                <ReceiptList
                  stats={stats.stats}
                  archivedStats={archivedStats}
                  sortBy={sortBy}
                  showArchived={showArchived}
                  onSortChange={(value: SortKey) => setSettings({ sortBy: value })}
                  onToggleArchived={() => setSettings({ showArchived: !showArchived })}
                  onOpen={(id) => {
                    haptic(hapticsEnabled);
                    setDetailId(id);
                  }}
                  onDelete={handleDelete}
                  onAdd={() => openForm(null)}
                  deltaMap={deltaMap}
                />
              </>
            ) : null}
            {tab === "insights" ? (
              <InsightsView stats={stats.stats} archivedCount={archivedStats.length} onAdd={() => openForm(null)} />
            ) : null}
            {tab === "settings" ? <SettingsView /> : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[440px] -translate-x-1/2 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="flex h-[76px] items-center px-2">
          <div className="flex flex-1 items-center justify-around">{NAV_ITEMS.slice(0, 2).map(navButton)}</div>
          <div className="w-[72px] shrink-0" aria-hidden="true" />
          <div className="flex flex-1 items-center justify-around">{NAV_ITEMS.slice(2).map(navButton)}</div>
        </div>
        <button
          type="button"
          aria-label="记一笔"
          onClick={() => {
            haptic(hapticsEnabled);
            openForm(null);
          }}
          className="absolute -top-7 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </nav>

      <PurchaseFormSheet open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <PurchaseDetailSheet
        stat={detailStat}
        fromDailyCostCents={detailFrom}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          if (!detailStat) return;
          openForm(detailStat.purchase);
          setDetailId(null);
        }}
        onExpire={() => {
          setExpireId(detailId);
          setDetailId(null);
        }}
        onRestore={handleRestore}
        onDelete={() => detailId && handleDelete(detailId)}
      />
      <ExpireSheet purchase={expireTarget} onClose={() => setExpireId(null)} onConfirm={handleExpire} />
    </div>
  );
}
