import type { MetadataRoute } from "next";

// 静态导出时 manifest 路由必须显式声明为静态，否则 next build 会在收集页面数据时报错。
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "时间小票 · 陪伴账本",
    short_name: "时间小票",
    description: "记下每一件东西，看它陪了你多久、每天值多少钱。",
    start_url: ".",
    display: "standalone",
    background_color: "#FFF9F2",
    theme_color: "#FF7A59",
    lang: "zh-CN",
    icons: [
      { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
