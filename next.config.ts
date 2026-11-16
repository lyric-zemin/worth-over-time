import type { NextConfig } from "next";

// 本地 dev / build 不做静态导出；仅 GitHub Actions 注入 STATIC_EXPORT=true 时导出到 out/。
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: "export", basePath, trailingSlash: true } : {}),
};

export default nextConfig;
