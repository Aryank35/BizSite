import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Geist({ variable: "--font-app-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-app-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "BizSite — Websites for local businesses", template: "%s · BizSite" },
  description:
    "BizSite gives furniture shops, boutiques, manufacturers and service businesses a professional catalogue website with enquiries and WhatsApp built in.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
