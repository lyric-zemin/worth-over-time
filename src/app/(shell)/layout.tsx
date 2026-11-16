import { AppLayout } from "@/components/layout/app-layout";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
