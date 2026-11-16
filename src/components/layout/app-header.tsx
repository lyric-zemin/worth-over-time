"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { formatDateCN, todayKey } from "@/lib/date";
import { useLedgerUi } from "@/components/layout/app-ui-provider";

export function AppHeader({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname() ?? "/";
  const route = pathname.replace(/\/+$/, "") || "/";
  const { dayKey } = useLedgerUi();

  const headerTitle = route === "/" ? "时间小票" : route === "/insights" ? "回顾" : "我的";
  const headerSubtitle =
    route === "/"
      ? `${formatDateCN(dayKey || todayKey())} · 小票墙`
      : route === "/insights"
        ? "仅统计有效小票"
        : "外观、数据与偏好";

  return (
    <motion.header
      className="glass-bar fixed left-1/2 top-0 z-30 w-full max-w-[440px] -translate-x-1/2 overflow-hidden"
      initial={false}
      animate={{ height: collapsed ? 52 : 72 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
    >
      <div className="flex h-full items-center px-5">
        <div className="min-w-0">
          {!collapsed ? (
            <p className="text-[11px] font-medium tabular text-muted-foreground">{headerSubtitle}</p>
          ) : null}
          <h1 className="truncate text-lg font-bold tracking-tight">{headerTitle}</h1>
        </div>
      </div>
    </motion.header>
  );
}
