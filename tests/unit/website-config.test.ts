import { describe, expect, it } from "vitest";
import { SECTION_DEFINITIONS, SECTION_TYPES, orderSections, sectionEditSchema } from "@/lib/website/sections";
import { parseSnapshot, siteSnapshotSchema, snapshotsEqual, stableStringify } from "@/lib/website/snapshot";
import { defaultTheme, readableTextColor, themeSchema } from "@/lib/website/theme";

function validSnapshot() {
  return {
    version: 1 as const,
    theme: defaultTheme(),
    sections: SECTION_TYPES.map((type) => {
      const d = SECTION_DEFINITIONS[type].defaults("Royal Furniture");
      return { type, title: d.title, subtitle: d.subtitle, imageUrl: null, imageAlt: null, content: d.content };
    }),
  };
}

describe("section definitions", () => {
  it("provides valid defaults for every section type", () => {
    for (const type of SECTION_TYPES) {
      const d = SECTION_DEFINITIONS[type].defaults("Acme");
      const result = sectionEditSchema(type).safeParse({ title: d.title, subtitle: d.subtitle, imageUrl: null, imageAlt: null, content: d.content });
      expect(result.success, type).toBe(true);
    }
  });

  it("orders header first, footer last and body sections by sortOrder", () => {
    const ordered = orderSections([
      { type: "FOOTER" as const, sortOrder: 0 },
      { type: "ABOUT" as const, sortOrder: 2 },
      { type: "HERO" as const, sortOrder: 5 },
      { type: "HEADER" as const, sortOrder: 9 },
    ]);
    expect(ordered.map((s) => s.type)).toEqual(["HEADER", "ABOUT", "HERO", "FOOTER"]);
  });
});

describe("theme", () => {
  it("accepts only hex colours", () => {
    expect(themeSchema.safeParse({ ...defaultTheme(), primaryColor: "#12AB9F" }).success).toBe(true);
    for (const bad of ["red", "#fff", "#12345g", "url(javascript:alert(1))", "#123456;background:red"]) {
      expect(themeSchema.safeParse({ ...defaultTheme(), primaryColor: bad }).success, bad).toBe(false);
    }
  });

  it("picks readable text colours", () => {
    expect(readableTextColor("#ffffff")).toBe("#111111");
    expect(readableTextColor("#1e3a8a")).toBe("#ffffff");
  });
});

describe("snapshots", () => {
  it("validates section content per type", () => {
    const snapshot = validSnapshot();
    expect(siteSnapshotSchema.safeParse(snapshot).success).toBe(true);

    const broken = validSnapshot();
    const hero = broken.sections.find((s) => s.type === "HERO")!;
    hero.content = { primaryCtaLabel: "", primaryCtaTarget: "NOWHERE" } as never;
    const result = siteSnapshotSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/^Hero banner:/);
  });

  it("treats invalid stored snapshots as missing", () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot({ version: 2 })).toBeNull();
    expect(parseSnapshot(validSnapshot())).not.toBeNull();
  });

  it("compares snapshots independently of key order (jsonb reorders keys)", () => {
    const a = parseSnapshot(validSnapshot())!;
    const reordered = JSON.parse(stableStringify(a)) as unknown;
    const b = parseSnapshot(reordered)!;
    expect(snapshotsEqual(a, b)).toBe(true);
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });
});
