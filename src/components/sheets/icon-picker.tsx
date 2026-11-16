"use client";

import { ImagePlus, RotateCcw, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { QUICK_ICON_KEYS, getIcon } from "@/lib/icons";
import { compressImageFile } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IconChoice {
  iconKey: string;
  iconImageDataUrl?: string;
}

export function IconPicker({
  value,
  onChange,
}: {
  value: IconChoice;
  onChange: (choice: IconChoice) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const current = getIcon(value.iconKey);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      onChange({ iconKey: value.iconKey, iconImageDataUrl: dataUrl });
      toast.success("图片已收进小票");
    } catch (error) {
      console.error("处理上传图标失败", error);
      toast.error(error instanceof Error ? error.message : "图片处理失败");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border bg-card/70 p-3">
        <div
          className="icon-candy flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-3xl"
          style={{ background: current.gradient }}
          aria-hidden="true"
        >
          {value.iconImageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.iconImageDataUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{current.emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{current.label}图标</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            按名称自动匹配，也可以手动挑一个
          </div>
        </div>
        {value.iconImageDataUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="移除上传的图片"
            onClick={() => onChange({ iconKey: value.iconKey })}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {QUICK_ICON_KEYS.map((key) => {
          const icon = getIcon(key);
          const selected = key === value.iconKey && !value.iconImageDataUrl;
          return (
            <button
              key={key}
              type="button"
              aria-label={`选择${icon.label}图标`}
              aria-pressed={selected}
              title={icon.label}
              onClick={() => onChange({ iconKey: key })}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border text-xl transition-all active:scale-90",
                selected ? "border-primary ring-2 ring-primary/40" : "border-transparent bg-secondary/70 hover:bg-secondary",
              )}
            >
              {icon.emoji}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id="icon-upload"
          onChange={(event) => void handleUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-4 w-4" /> {busy ? "正在压小图片…" : "上传本机图片"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="恢复默认图标"
          onClick={() => onChange({ iconKey: value.iconKey })}
        >
          <RotateCcw className="h-4 w-4" /> 重置
        </Button>
      </div>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <ImagePlus className="h-3 w-3" /> 图片会裁方压缩，存在本机浏览器里
      </p>
    </div>
  );
}
