import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "时间小票 · 陪伴账本",
  description: "记下每一件东西，看它陪了你多久、每天值多少钱。",
  applicationName: "时间小票",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "时间小票" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF9F2" },
    { media: "(prefers-color-scheme: dark)", color: "#14121F" },
  ],
};

const accentBoot = `try{var a=localStorage.getItem('worth-over-time-accent');if(a)document.documentElement.dataset.accent=a}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentBoot }} />
      </head>
      <body>
        <div className="ambient-bg" aria-hidden="true" />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
