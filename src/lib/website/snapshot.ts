import { z } from "zod";
import {
  SECTION_TYPES,
  sectionBaseSchema,
  sectionContentSchemas,
  sectionLabel,
  type SectionContent,
  type SectionType,
} from "@/lib/website/sections";
import { themeSchema, type Theme } from "@/lib/website/theme";

/** A validated section as stored in a snapshot and rendered on the website. */
export type RenderSection = {
  [T in SectionType]: {
    type: T;
    title: string | null;
    subtitle: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    content: SectionContent<T>;
  };
}[SectionType];

export type SiteSnapshot = {
  version: 1;
  theme: Theme;
  sections: RenderSection[];
};

const snapshotSectionSchema = sectionBaseSchema
  .extend({ type: z.enum(SECTION_TYPES), content: z.unknown() })
  .transform((section, ctx): RenderSection => {
    const result = sectionContentSchemas[section.type].safeParse(section.content);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: ["content", ...issue.path.map(String)],
          message: `${sectionLabel(section.type)}: ${issue.message}`,
        });
      }
      return z.NEVER;
    }
    return { ...section, content: result.data } as RenderSection;
  });

export const siteSnapshotSchema = z.object({
  version: z.literal(1),
  theme: themeSchema,
  sections: z.array(snapshotSectionSchema),
});

/** Parses a stored snapshot. Returns null if it is missing or no longer valid. */
export function parseSnapshot(value: unknown): SiteSnapshot | null {
  if (value === null || value === undefined) return null;
  const result = siteSnapshotSchema.safeParse(value);
  return result.success ? (result.data as SiteSnapshot) : null;
}

/** JSON serialisation with sorted keys, so snapshots compare reliably after a jsonb round trip. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function snapshotsEqual(a: SiteSnapshot | null, b: SiteSnapshot | null): boolean {
  if (!a || !b) return a === b;
  return stableStringify(a) === stableStringify(b);
}
