import { describe, expect, it } from "vitest";
import { businessProfileSchema, DEFAULT_OPENING_HOURS } from "@/lib/validators/business";
import { productSchema, type ProductInput } from "@/lib/validators/catalogue";
import { cleanText, slugify } from "@/lib/validators/common";
import { publicEnquirySchema } from "@/lib/validators/enquiry";
import { detectImageType } from "@/lib/image-types";

const product = (overrides: Partial<ProductInput> = {}): ProductInput => ({
  name: "Teak Table",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  sku: "",
  price: "1499",
  priceVisibility: "SHOW",
  featuredImageUrl: null,
  galleryImages: [],
  status: "DRAFT",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  ...overrides,
});

describe("text helpers", () => {
  it("slugifies names", () => {
    expect(slugify("Odisha Windows & Doors")).toBe("odisha-windows-and-doors");
    expect(slugify("  Café  Déco!! ")).toBe("cafe-deco");
  });

  it("strips control characters but keeps line breaks", () => {
    expect(cleanText(" hello\u0000\u0007 world\nnext ")).toBe("hello world\nnext");
  });
});

describe("product validation", () => {
  it("converts the price to minor units and empty fields to null", () => {
    const parsed = productSchema.parse(product({ price: "1499.50" }));
    expect(parsed.price).toBe(149_950);
    expect(parsed.slug).toBeNull();
    expect(parsed.categoryId).toBeNull();
  });

  it("requires a price unless it is contact-for-price", () => {
    expect(productSchema.safeParse(product({ price: "" })).success).toBe(false);
    expect(productSchema.safeParse(product({ price: "", priceVisibility: "CONTACT_FOR_PRICE" })).success).toBe(true);
  });

  it("rejects unsafe image references", () => {
    expect(productSchema.safeParse(product({ featuredImageUrl: "javascript:alert(1)" })).success).toBe(false);
    expect(productSchema.safeParse(product({ featuredImageUrl: "http://insecure.example/a.jpg" })).success).toBe(false);
    expect(productSchema.safeParse(product({ featuredImageUrl: "/media/abc/0123456789abcdef0123456789abcdef.jpg" })).success).toBe(true);
  });
});

describe("business profile validation", () => {
  const profile = {
    name: "Royal Furniture",
    description: "",
    logoUrl: null,
    email: "",
    phone: "",
    whatsappNumber: "+91 94370 12345",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    openingHours: DEFAULT_OPENING_HOURS,
    socialLinks: { website: "", facebook: "", instagram: "", linkedin: "", youtube: "", x: "" },
  };

  it("normalises WhatsApp numbers to digits", () => {
    expect(businessProfileSchema.parse(profile).whatsappNumber).toBe("919437012345");
  });

  it("requires a country code for WhatsApp", () => {
    expect(businessProfileSchema.safeParse({ ...profile, whatsappNumber: "12345" }).success).toBe(false);
  });

  it("accepts only https social links", () => {
    const bad = { ...profile, socialLinks: { ...profile.socialLinks, facebook: "javascript:alert(1)" } };
    expect(businessProfileSchema.safeParse(bad).success).toBe(false);
  });

  it("re-validates its own output (stored values with nulls)", () => {
    const once = businessProfileSchema.parse(profile);
    expect(businessProfileSchema.parse(once)).toEqual(once);
  });
});

describe("public enquiry validation", () => {
  const base = { businessSlug: "royal-furniture", productSlug: "", customerName: "Asha", email: "", phone: "", message: "Is this available in teak?", hpField: "" };

  it("requires an email or a phone number", () => {
    expect(publicEnquirySchema.safeParse(base).success).toBe(false);
    expect(publicEnquirySchema.safeParse({ ...base, phone: "+91 98765 43210" }).success).toBe(true);
  });

  it("rejects malformed slugs, so lookups cannot be abused", () => {
    expect(publicEnquirySchema.safeParse({ ...base, phone: "9876543210", businessSlug: "../../etc" }).success).toBe(false);
  });
});

describe("upload type detection", () => {
  it("detects images by magic bytes", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    const webp = new TextEncoder().encode("RIFF0000WEBPVP8 ");
    expect(detectImageType(webp)?.mime).toBe("image/webp");
  });

  it("rejects SVG and other files regardless of their name", () => {
    expect(detectImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
  });
});
