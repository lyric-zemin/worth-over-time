"use client";

import { toast } from "sonner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ExpireSheet } from "@/components/sheets/expire-sheet";
import { PurchaseDetailSheet } from "@/components/sheets/purchase-detail-sheet";
import { PurchaseFormSheet } from "@/components/sheets/purchase-form-sheet";
import { todayKey } from "@/lib/date";
import { haptic } from "@/lib/feedback";
import {
  computeArchivedStats,
  computeStats,
  type LedgerTotals,
  type PurchaseStat,
} from "@/lib/money";
import { createSnapshot, diffSnapshots } from "@/lib/snapshot";
import { useLedgerStore } from "@/store/use-ledger-store";
import type { DeltaSummary, ExpiryInfo, Purchase } from "@/types/ledger";

interface LedgerUiValue {
  dayKey: string;
  delta: DeltaSummary | null;
  deltaMap: Map<string, number>;
  stats: LedgerTotals;
  archivedStats: PurchaseStat[];
  openCreate: () => void;
  openEdit: (purchase: Purchase) => void;
  openDetail: (id: string) => void;
  deletePurchase: (id: string) => void;
}

const LedgerUiContext = createContext<LedgerUiValue | null>(null);

export function useLedgerUi(): LedgerUiValue {
  const value = useContext(LedgerUiContext);
  if (!value) throw new Error("useLedgerUi 必须在 AppUiProvider 内使用");
  return value;
}

export function AppUiProvider({ children }: { children: ReactNode }) {
  const [dayKey, setDayKey] = useState("");
  const [delta, setDelta] = useState<DeltaSummary | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [expireId, setExpireId] = useState<string | null>(null);
  const initialCaptured = useRef(false);
  const lastCaptureAt = useRef(0);

  const purchases = useLedgerStore((state) => state.purchases);
  const hapticsEnabled = useLedgerStore((state) => state.settings.haptics);
  const expirePurchase = useLedgerStore((state) => state.expirePurchase);
  const restoreExpired = useLedgerStore((state) => state.restoreExpired);

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
    if (initialCaptured.current) return;
    initialCaptured.current = true;
    captureView();
  }, [captureView]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCaptureAt.current < 1500) {
        setDayKey(todayKey());
        return;
      }
      captureView();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => setDayKey(todayKey()), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
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

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((purchase: Purchase) => {
    setEditing(purchase);
    setFormOpen(true);
  }, []);

  const openDetail = useCallback(
    (id: string) => {
      haptic(hapticsEnabled);
      setDetailId(id);
    },
    [hapticsEnabled],
  );

  const deletePurchase = useCallback(
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
    toast.success("已恢复有效", { description: "数字会按原购买日继续更新" });
  };

  const value = useMemo<LedgerUiValue>(
    () => ({
      dayKey,
      delta,
      deltaMap,
      stats,
      archivedStats,
      openCreate,
      openEdit,
      openDetail,
      deletePurchase,
    }),
    [dayKey, delta, deltaMap, stats, archivedStats, openCreate, openEdit, openDetail, deletePurchase],
  );

  return (
    <LedgerUiContext.Provider value={value}>
      {children}
      <PurchaseFormSheet open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <PurchaseDetailSheet
        stat={detailStat}
        fromDailyCostCents={detailFrom}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          if (!detailStat) return;
          openEdit(detailStat.purchase);
          setDetailId(null);
        }}
        onExpire={() => {
          setExpireId(detailId);
          setDetailId(null);
        }}
        onRestore={handleRestore}
        onDelete={() => detailId && deletePurchase(detailId)}
      />
      <ExpireSheet purchase={expireTarget} onClose={() => setExpireId(null)} onConfirm={handleExpire} />
    </LedgerUiContext.Provider>
  );
}
