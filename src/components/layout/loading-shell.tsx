export function LoadingShell() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-gradient-to-br from-primary/30 to-secondary text-4xl shadow-soft">🧾</div>
        <div className="text-sm font-semibold">正在翻开你的小票夹…</div>
        <div className="text-xs text-muted-foreground">数据只存在本机</div>
      </div>
    </div>
  );
}
