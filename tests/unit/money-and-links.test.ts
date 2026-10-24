import { describe, expect, it } from "vitest";
import { formatMoney, minorToInput, parsePriceToMinor } from "@/lib/money";
import { moveInOrder, uniqueSlug } from "@/lib/reorder";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { formatWhatsappNumber, whatsappLink } from "@/lib/whatsapp";

describe("money", () => {
  it("parses prices into integer minor units without floating point", () => {
    expect(parsePriceToMinor("1499")).toBe(149_900);
    expect(parsePriceToMinor("1,499.5")).toBe(149_950);
    expect(parsePriceToMinor("0.07")).toBe(7);
    expect(parsePriceToMinor("19.99")).toBe(1_999); // 19.99 * 100 is 1998.999… in floating point
  });

  it("rejects invalid input", () => {
    for (const bad of ["", "abc", "-5", "1.999", "12e3", "1.2.3"]) expect(parsePriceToMinor(bad)).toBeNull();
  });

  it("round-trips through the editable representation", () => {
    for (const value of ["1499", "1499.5", "0.05", "62000"]) {
      expect(minorToInput(parsePriceToMinor(value))).toBe(value.replace(/\.5$/, ".50"));
    }
    expect(minorToInput(null)).toBe("");
  });

  it("formats Indian rupees", () => {
    expect(formatMoney(4_850_000)).toBe("₹48,500");
    expect(formatMoney(145_050)).toBe("₹1,450.50");
  });
});

describe("whatsapp links", () => {
  it("builds wa.me links from validated numbers with an encoded message", () => {
    expect(whatsappLink("919437012345", "Hi there & welcome")).toBe("https://wa.me/919437012345?text=Hi%20there%20%26%20welcome");
    expect(whatsappLink("+91 94370 12345")).toBe("https://wa.me/919437012345");
  });

  it("returns null for missing or invalid numbers", () => {
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("12345")).toBeNull();
    expect(whatsappLink("0091943701234")).toBeNull();
  });

  it("formats Indian numbers for display", () => {
    expect(formatWhatsappNumber("919437012345")).toBe("+91 94370 12345");
  });
});

describe("reordering", () => {
  it("swaps an item with its neighbour", () => {
    expect(moveInOrder(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveInOrder(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("returns null at the edges or for unknown ids", () => {
    expect(moveInOrder(["a", "b"], "a", "up")).toBeNull();
    expect(moveInOrder(["a", "b"], "b", "down")).toBeNull();
    expect(moveInOrder(["a"], "z", "up")).toBeNull();
  });

  it("finds a free slug", async () => {
    const taken = new Set(["sofa", "sofa-2"]);
    expect(await uniqueSlug("sofa", async (s) => taken.has(s))).toBe("sofa-3");
    expect(await uniqueSlug("table", async (s) => taken.has(s))).toBe("table");
  });
});

describe("post-login redirects", () => {
  it("allows only private app paths", () => {
    expect(safeRedirectPath("/dashboard/products")).toBe("/dashboard/products");
    expect(safeRedirectPath("/admin?x=1")).toBe("/admin?x=1");
  });

  it("blocks open redirects", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "/site/x", "javascript:alert(1)", null]) {
      expect(safeRedirectPath(bad)).toBeNull();
    }
  });
});
