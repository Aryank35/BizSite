import { Inter, Lora, Playfair_Display, Poppins } from "next/font/google";
import type { SiteFontKey } from "@/lib/website/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-site-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-site-poppins", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-site-lora", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-site-playfair", display: "swap", preload: false });

const FONTS: Record<SiteFontKey, { className: string; variable: string }> = {
  inter: { className: inter.variable, variable: "--font-site-inter" },
  poppins: { className: poppins.variable, variable: "--font-site-poppins" },
  lora: { className: lora.variable, variable: "--font-site-lora" },
  playfair: { className: playfair.variable, variable: "--font-site-playfair" },
};

/** Headings use the chosen font; body text uses Inter for readability (or the chosen sans font). */
export function siteFontStyles(key: SiteFontKey) {
  const heading = FONTS[key];
  const body = key === "poppins" ? FONTS.poppins : FONTS.inter;
  return {
    className: `${heading.className} ${body.className}`,
    headingFamily: `var(${heading.variable}), ui-serif, Georgia, serif`,
    bodyFamily: `var(${body.variable}), ui-sans-serif, system-ui, sans-serif`,
  };
}
