export const BUSINESS_CATEGORIES = [
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "windows-doors", label: "Windows & Doors" },
  { value: "interior-design", label: "Interior Design" },
  { value: "electronics", label: "Electronics" },
  { value: "wholesale", label: "Wholesale & Distribution" },
  { value: "local-services", label: "Local Services" },
  { value: "other", label: "Other" },
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]["value"];

export const BUSINESS_CATEGORY_VALUES = BUSINESS_CATEGORIES.map((c) => c.value) as [
  BusinessCategory,
  ...BusinessCategory[],
];

export function categoryLabel(value: string): string {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const PAGE_SIZE = 20;
export const PUBLIC_PAGE_SIZE = 12;

export const PASSWORD_MIN_LENGTH = 10;
