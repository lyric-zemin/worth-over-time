# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Commands

**安装依赖**: `npm install`
安装 Next.js、shadcn 组件依赖、framer-motion、recharts、zustand 等。安装后 `npm run dev` 即可本地开发，无需额外全局工具。

**本地开发**: `npm run dev`
启动 Next.js 开发服务器，访问 http://localhost:3000。移动端优先，验证请用 390×844 视口。常规构建不做静态导出、不注入 basePath。

**类型检查**: `npm run typecheck` （即 `tsc --noEmit`）
改动任何 TS/TSX 后必须运行，确保无类型错误。配合 `npm run build` 一起作为提交前的基线。

**生产构建**: `npm run build`
常规生产构建（非静态导出）。验证组件与预渲染是否正常，捕获 SSR/类型问题。

**静态导出构建**: `cmd /c "set STATIC_EXPORT=true && set NEXT_PUBLIC_BASE_PATH=/worth-over-time && npm run build"`
仅 GitHub Actions 使用此模式。导出到 `out/`，注入 basePath、`public/.nojekyll`，HTML 资源路径带 `/worth-over-time`。本地复现 Pages 产物用此命令。

**视觉回归（强制，每次修改后必须执行）**: 完整流程见下方「Workflow 验收」一节。基于 `agent-browser` 自动化，以 390×844 移动视口覆盖记一笔/详情/失效盖章/恢复/设置导出/深色主题等关键路径，逐项截图并确认 `agent-browser errors` 与 `console` 为空、刷新后状态持久化。

## Architecture

**核心约束**：纯前端、无服务器、无数据库、无 API Route。所有数据存于浏览器 `localStorage`；上传的图标经 Canvas 压缩为 data URL 一并存储，受 `LOCAL_STORAGE_BUDGET_BYTES`（5MB）保护。由此派生：金额全程以整数「分」运算避免浮点误差；图片必须离线内联；任何服务端能力都不可用。

**构建与部署形态**：Next.js 15 App Router + TypeScript + Tailwind 3.4 + shadcn/ui（new-york/stone、CSS 变量主题）。`next.config.ts` 仅在环境变量 `STATIC_EXPORT=true` 时设为 `output: "export"` 并注入 `basePath`，因此本地 `dev`/`build` 与 Pages 静态导出共用同一份源码，互不干扰。`.github/workflows/deploy.yml` 按仓库名自动推导 basePath（用户站点仓库用根路径），换仓库名无需改配置。回顾页 `recharts` 用 `next/dynamic` 动态导入，`ssr:false`，缩小首屏体积。静态导出分支同时注入 `trailingSlash: true`，多路由会生成 `out/insights/index.html`、`out/settings/index.html`，GitHub Pages 可直达；本地 `dev`/`build` 不带尾斜杠，导航激活判断需归一化 `usePathname()`。

**金额与时间模型**：`src/lib/money.ts` 定义整数分解析/格式化与统计；`src/lib/date.ts` 提供 UTC 归一化的天数计算。`已购天数 = 日历天数差 + 1`（购买当天算第 1 天），`日均成本 = round(价格分 / 天数)`。`computeStats()` 单次遍历只产生活跃小票统计；失效小票走独立的 `computeArchivedStats()`，只读固化字段，不再按今天折旧。

**数据模型与存储层**：`src/types/ledger.ts` 定义 `Purchase`（含可选 `expiry`）、`LedgerData`、`ViewSnapshot`、`LedgerSettings`、`AppData`。`DATA_VERSION` 当前为 **1，未发布，不要升版**；旧数据/旧备份缺字段时由 `src/lib/storage.ts` 的 `normalize*` 做字段级容错（按有效小票处理），不引入迁移逻辑。`storage.ts` 同时是 zustand persist 的安全适配器，配额失败时保留内存态并广播 `STORAGE_ERROR_EVENT`。

**状态管理与水合**：`src/store/use-ledger-store.ts`（zustand + persist，`skipHydration: true`，persist 版本 1）持有全部 CRUD 与 `setLastView`/`setSettings`。因 `skipHydration`，首屏在 `src/components/layout/app-layout.tsx` 内显式 `rehydrate()` 后再渲染，避免 SSR 水合不一致；跨标签页同步通过 `storage` 事件重新水合而非误触发查看快照。

**上次查看与变化横幅**：`src/lib/snapshot.ts` 记录查看快照，`diffSnapshots` 只对比两批快照共有的 id，产出天数增加与日均成本下降。`DeltaBanner` 用 framer-motion 把数字从旧值滚到新值（遵循 `prefers-reduced-motion`）；首次访问建基线，同日重开提示「今天的小票没有变化」，全归档时给兜底文案。失效项自然不进入快照与变化动画。

**失效与归档**：`src/lib/expiry.ts` 负责日期边界（购买日～今天）、`buildExpiry()` 在确认瞬间一次性固化「共陪伴天数」与整数分「定格日均」，并记操作时间戳；之后即使刷新、跨天、导入导出都不再变化。失效小票在主列表剔除，收进 `archived-section.tsx` 独立区，区头「显示/隐藏已失效」开关与设置页同源持久化（`showArchived`）。`receipt-card.tsx` 失效变体呈褪色纸张、图标去饱和、斜盖「已失效」印章（带落下动效），展示原因、失效时间与定格值，金额静止不滚动。详情抽屉可一键恢复有效（清空失效字段）。

**界面外壳与路由**：`src/app/layout.tsx` 是服务端根布局（metadata/viewport/防闪脚本/ThemeProvider/Toaster）；`src/app/(shell)/layout.tsx` 挂载客户端 `AppLayout`，负责水合门禁、左右装饰纸张、`AppHeader`、`<main>`、底部 `BottomNav` 与跨路由副作用（storage 事件、滚动折叠）。`src/app/(shell)/template.tsx` 提供路由级入场淡入过渡。三个真实路由：`/`（小票墙）、`/insights`（回顾）、`/settings`（我的）；底部导航用 `next/link` + `usePathname`（归一化尾斜杠）判定激活，URL 可直达、刷新保留、浏览器返回键可切页。`src/components/layout/app-ui-provider.tsx` 在布局内持有 `dayKey`、`delta`/`stats` 与三类抽屉状态，页面通过 `useLedgerUi()` 取用，路由切换时弹层与快照不丢失。

**组件分层**：`components/home/` 放首页视图与 `summary-card`、`delta-banner`、`receipt-list`、`receipt-card`、`archived-section`；`components/insights/` 放回顾视图（页面内 `next/dynamic` + `ssr:false`，只统计活跃小票）；`components/settings/` 放设置视图；`components/sheets/` 放 `purchase-form-sheet`（名称实时图标匹配、金额校验、可回溯日历与图片上传）、`purchase-detail-sheet`、`expire-sheet`（可回溯日期 + 五个快捷原因标签 + 必填文本 + 实时定格预览）与 `icon-picker`；`components/layout/` 放外壳与 Provider；`components/shared/` 放 `animated-number`、`theme-provider`；`components/ui/*` 为手写 shadcn 组件，遵循 `components.json` 约定。`lib/`、`store/`、`types/` 保持原结构。

**主题与防闪**：`theme-provider.tsx` 基于 next-themes 管理浅色/深色/跟随系统，外加暖橘、暮紫、薄荷、麦芽四套配色，配色存于 `localStorage`（与 `layout.tsx` 防闪脚本同键 `worth-over-time-accent`），在首屏脚本内读取以杜绝主题闪烁。

**导入导出**：`src/lib/io.ts` 支持 JSON 全量备份（含图片、外观偏好、失效记录，可完整恢复）与 CSV 查阅表（追加状态/失效日期/原因/记录时间列，导入仅按前三列构造有效小票、跳过失效行），导入提供「合并追加 / 覆盖恢复」两种。`stampedFilename` 导出文件名前缀为「时间小票-」（刻意保留中文品牌）。

**命名约定**：界面中文品牌「时间小票 · 陪伴账本」保持不变；技术标识统一为 `worth-over-time`——包名、`STORAGE_KEY=worth-over-time-ledger-v1`、`STORAGE_ERROR_EVENT=worth-over-time:storage-error`、`ACCENT_KEY=worth-over-time-accent`、`AppData.app`。改动后请用大小写敏感搜索确认源码/配置/文档中无 `vmax` 残留（排除 `out/`、`.next/`、`node_modules/`）。

## Workflow 验收

**每次修改后必须完成以下闭环，缺一不可：**
1. `npm run typecheck` 通过；
2. `npm run build` 通过；
3. 用静态导出命令验证 `out/` 含 `.nojekyll`、`insights/index.html`、`settings/index.html`，且资源路径带 `/worth-over-time`；
4. **完整视觉回归测试**（强制）：
   - 启动 dev server（`Start-Process npm.cmd run dev`），等待 http://127.0.0.1:3000 可访问；
   - `agent-browser open http://127.0.0.1:3000` → `set viewport 390 844` → `wait 1200` → `snapshot -i`；
   - 走查关键路径：记一笔（自动匹配图标、金额校验）→ 保存 → 详情 → 标记失效（选可回溯日期、点快捷原因标签、必填文本、确认定格预览）→ 盖章（核对总账归零、归档区褪色印章卡与「共陪伴 N 天 · 定格 ¥X.XX」）→ 刷新验证持久化 → 归档区收起/展开与设置页开关同源 → 一键恢复有效 → 设置页 JSON/CSV 导出 → 切换深色主题；
   - 路由专项：底部导航切换到 `/insights`、`/settings` 后核对顶栏标题/副标题与导航高亮；分别直接打开 `http://127.0.0.1:3000/insights`、`http://127.0.0.1:3000/settings` 可正常渲染；用浏览器返回键可在三个路由间往返，刷新后仍停留在当前路由；
   - 每个关键状态 `screenshot <path>` 留存；
   - `errors` 与 `console` 必须为空；
   - 注意无头浏览器不会真正保存下载文件，导出仅以按钮执行成功 + toast + 无异常验证；
   - `agent-browser close` 并 `taskkill` 关停 dev server。

无功能改动时也要跑 1–3；涉及 UI/交互/视觉的改动必须跑完第 4 步。
