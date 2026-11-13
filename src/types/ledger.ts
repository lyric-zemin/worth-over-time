export const DATA_VERSION = 1;

export type SortKey = "recent" | "oldest" | "daily-high" | "price-high";

export interface ExpiryInfo {
  reason: string;
  expiredOn: string;
  expiredAt: number;
  finalDaysOwned: number;
  finalDailyCostCents: number;
}

export interface Purchase {
  id: string;
  name: string;
  priceCents: number;
  purchasedAt: string;
  iconKey: string;
  iconImageDataUrl?: string;
  createdAt: number;
  expiry?: ExpiryInfo;
}

export interface SnapshotItem {
  id: string;
  daysOwned: number;
  dailyCostCents: number;
}

export interface ViewSnapshot {
  viewedAt: number;
  todayKey: string;
  items: SnapshotItem[];
  totalDailyCostCents: number;
  totalCents: number;
  purchaseCount: number;
}

export interface ItemDelta {
  id: string;
  name: string;
  fromDays: number;
  toDays: number;
  fromDailyCostCents: number;
  toDailyCostCents: number;
}

export interface DeltaSummary {
  elapsedDays: number;
  daysGained: number;
  dailyCostSavedCents: number;
  changedItems: ItemDelta[];
  newPurchaseCount: number;
  isFirstVisit: boolean;
  hasChange: boolean;
  lastViewedAt?: number;
  previousDailyCostCents: number;
  currentDailyCostCents: number;
}

export interface LedgerSettings {
  sortBy: SortKey;
  haptics: boolean;
  showArchived: boolean;
}

export interface LedgerData {
  purchases: Purchase[];
  settings: LedgerSettings;
  lastView: ViewSnapshot | null;
}

export interface AppData extends LedgerData {
  app: "worth-over-time";
  version: number;
  exportedAt: number;
  accent?: string;
  themeMode?: string;
}
