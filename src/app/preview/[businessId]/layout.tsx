import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default function PreviewLayout({ children }: LayoutProps<"/preview/[businessId]">) {
  return children;
}
