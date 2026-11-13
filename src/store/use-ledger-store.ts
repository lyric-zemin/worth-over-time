"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DATA_VERSION,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  createId,
  ledgerStorage,
  normalizeLedgerData,
} from "@/lib/storage";
import type {
  ExpiryInfo,
  LedgerData,
  LedgerSettings,
  Purchase,
  ViewSnapshot,
} from "@/types/ledger";

export type NewPurchase = Omit<Purchase, "id" | "createdAt">;
export type PurchasePatch = Partial<Omit<Purchase, "id" | "createdAt">>;

export interface LedgerStore extends LedgerData {
  addPurchase: (input: NewPurchase) => Purchase;
  updatePurchase: (id: string, patch: PurchasePatch) => void;
  removePurchase: (id: string) => Purchase | undefined;
  restorePurchase: (purchase: Purchase) => void;
  expirePurchase: (id: string, expiry: ExpiryInfo) => void;
  restoreExpired: (id: string) => void;
  replaceData: (data: LedgerData) => void;
  clearAll: () => void;
  setLastView: (snapshot: ViewSnapshot | null) => void;
  setSettings: (patch: Partial<LedgerSettings>) => void;
}

export const useLedgerStore = create<LedgerStore>()(
  persist<LedgerStore, [], [], LedgerData>(
    (set, get) => ({
      purchases: [],
      settings: { ...DEFAULT_SETTINGS },
      lastView: null,

      addPurchase: (input) => {
        const purchase: Purchase = { ...input, id: createId(), createdAt: Date.now() };
        set((state) => ({ purchases: [purchase, ...state.purchases] }));
        return purchase;
      },

      updatePurchase: (id, patch) =>
        set((state) => ({
          purchases: state.purchases.map((purchase) =>
            purchase.id === id ? { ...purchase, ...patch } : purchase,
          ),
        })),

      removePurchase: (id) => {
        const target = get().purchases.find((purchase) => purchase.id === id);
        if (!target) return undefined;
        set((state) => ({ purchases: state.purchases.filter((purchase) => purchase.id !== id) }));
        return target;
      },

      restorePurchase: (purchase) =>
        set((state) => ({
          purchases: state.purchases.some((item) => item.id === purchase.id)
            ? state.purchases
            : [...state.purchases, purchase].sort((a, b) => b.createdAt - a.createdAt),
        })),

      expirePurchase: (id, expiry) =>
        set((state) => ({
          purchases: state.purchases.map((purchase) =>
            purchase.id === id ? { ...purchase, expiry } : purchase,
          ),
        })),

      restoreExpired: (id) =>
        set((state) => ({
          purchases: state.purchases.map((purchase) => {
            if (purchase.id !== id) return purchase;
            const restored = { ...purchase };
            delete restored.expiry;
            return restored;
          }),
        })),

      replaceData: (data) =>
        set({
          purchases: data.purchases,
          settings: data.settings,
          lastView: data.lastView,
        }),

      clearAll: () => set({ purchases: [], lastView: null, settings: { ...DEFAULT_SETTINGS } }),

      setLastView: (snapshot) => set({ lastView: snapshot }),

      setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      name: STORAGE_KEY,
      version: DATA_VERSION,
      storage: createJSONStorage(() => ledgerStorage),
      skipHydration: true,
      partialize: (state) => ({
        purchases: state.purchases,
        settings: state.settings,
        lastView: state.lastView,
      }),
      migrate: (persisted) => normalizeLedgerData(persisted),
    },
  ),
);
