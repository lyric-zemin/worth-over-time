"use client";

import { useTheme } from "next-themes";
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  Vibrate,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ACCENTS,
  ACCENT_LABELS,
  ACCENT_SWATCHES,
  readAccent,
  useAccent,
  type AccentTheme,
} from "@/components/theme-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportCsv, exportJsonBackup, mergePurchases, readImportFile } from "@/lib/io";
import { buildAppData, getStorageUsageBytes, LOCAL_STORAGE_BUDGET_BYTES } from "@/lib/storage";
import { useLedgerStore } from "@/store/use-ledger-store";
import { cn } from "@/lib/utils";

type ImportMode = "merge" | "replace";

function formatBytes(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const purchases = useLedgerStore((state) => state.purchases);
  const settings = useLedgerStore((state) => state.settings);
  const lastView = useLedgerStore((state) => state.lastView);
  const replaceData = useLedgerStore((state) => state.replaceData);
  const clearAll = useLedgerStore((state) => state.clearAll);
  const setSettings = useLedgerStore((state) => state.setSettings);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [busy, setBusy] = useState(false);
  const usage = getStorageUsageBytes();
  const usageRatio = Math.min(100, (usage / LOCAL_STORAGE_BUDGET_BYTES) * 100);

  const handleExportJson = () => {
    const content = buildAppData(
      { purchases, settings, lastView },
      { accent: readAccent(), themeMode: theme ?? "system" },
    );
    exportJsonBackup(JSON.stringify(content, null, 2));
    toast.success("备份已下载", { description: "小票、图标与偏好均已包含" });
  };

  const handleExportCsv = () => {
    exportCsv(purchases);
    toast.success("CSV 表格已下载", { description: "可用 Excel 或表格软件打开" });
  };

  const handleImport = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setBusy(true);
      try {
        const result = await readImportFile(file);
        const current = useLedgerStore.getState();
        if (importMode === "replace") {
          replaceData(result.data);
          if (result.accent && ACCENTS.includes(result.accent as AccentTheme)) {
            setAccent(result.accent as AccentTheme);
          }
          if (result.themeMode && ["light", "dark", "system"].includes(result.themeMode)) {
            setTheme(result.themeMode);
          }
          toast.success("已按备份恢复", { description: `共 ${result.data.purchases.length} 张小票` });
        } else {
          const merged = mergePurchases(current.purchases, result.data.purchases);
          replaceData({
            purchases: merged.purchases,
            settings: result.kind === "json" ? result.data.settings : current.settings,
            lastView: current.lastView,
          });
          toast.success(`合并了 ${merged.added} 张新小票`, {
            description: merged.added === 0 ? "备份里的都已在" : `现在共 ${merged.purchases.length} 张`,
          });
        }
      } catch (error) {
        console.error("导入备份失败", error);
        toast.error(error instanceof Error ? error.message : "导入失败，请检查文件");
      } finally {
        setBusy(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [importMode, replaceData, setAccent, setTheme],
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">外观</h3>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sun className="h-3.5 w-3.5" /> 明暗
            <Moon className="h-3.5 w-3.5" />
          </div>
          <Tabs value={theme ?? "system"} onValueChange={setTheme}>
            <TabsList>
              <TabsTrigger value="light">浅色</TabsTrigger>
              <TabsTrigger value="dark">深色</TabsTrigger>
              <TabsTrigger value="system">跟随</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {ACCENTS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={accent === item}
              aria-label={`切换到${ACCENT_LABELS[item]}配色`}
              onClick={() => setAccent(item)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all active:scale-95",
                accent === item ? "border-primary bg-primary/8 shadow-soft" : "border-transparent bg-secondary/60",
              )}
            >
              <span
                className="h-9 w-9 rounded-full shadow-sm"
                style={{ background: ACCENT_SWATCHES[item] }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold">{ACCENT_LABELS[item]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Vibrate className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">手感与小票墙</h3>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">轻震动反馈</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">记一笔、盖章时轻轻震一下</div>
          </div>
          <Switch
            checked={settings.haptics}
            onCheckedChange={(checked) => setSettings({ haptics: checked })}
            aria-label="轻震动反馈"
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div>
            <div className="text-sm font-medium">显示已失效小票</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">关闭后归档区收为折叠入口</div>
          </div>
          <Switch
            checked={settings.showArchived}
            onCheckedChange={(checked) => setSettings({ showArchived: checked })}
            aria-label="显示已失效小票"
          />
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">备份与带走</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-auto gap-1 py-3" onClick={handleExportJson}>
            <FileJson className="h-4 w-4" />
            <span className="text-xs">JSON 全量备份</span>
          </Button>
          <Button variant="outline" className="h-auto gap-1 py-3" onClick={handleExportCsv}>
            <FileSpreadsheet className="h-4 w-4" />
            <span className="text-xs">CSV 表格</span>
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Select value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)}>
            <SelectTrigger className="w-[124px]" aria-label="导入方式">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="merge">合并追加</SelectItem>
              <SelectItem value="replace">覆盖恢复</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> {busy ? "正在读文件…" : "导入文件"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="sr-only"
            aria-label="选择备份文件"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          JSON 含图标、偏好与失效记录，可完整恢复；CSV 仅供查阅，导入只取前三列，跳过已失效行。
        </p>
      </section>

      <section className="rounded-3xl border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">设备占用</h3>
          </div>
          <span className="text-[11px] tabular text-muted-foreground">{formatBytes(usage)} / 约 5 MB</span>
        </div>
        <Progress value={usageRatio} className="mt-3" aria-label="本地存储占用" />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          图片自动压缩；快满时先备份，再删几张上传图标。
        </p>
      </section>

      <section className="rounded-3xl border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-positive" />
          <h3 className="text-sm font-semibold">关于数据</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          无账号、无服务器，数据存在本机浏览器。换设备或清缓存前先导出备份。
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="h-4 w-4" /> 先备份一下
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" /> 清空数据
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>清空所有小票？</AlertDialogTitle>
                <AlertDialogDescription>
                  {purchases.length} 张小票、图标与上次查看记录都会从这台设备移除。建议先备份，此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>再想想</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:brightness-110"
                  onClick={() => {
                    clearAll();
                    toast.success("小票夹已清空");
                  }}
                >
                  确认清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}
