export type MoveDirection = "up" | "down";

/**
 * Returns the ids in their new order after moving `id` one step. Returns null
 * when the item is missing or already at the edge.
 */
export function moveInOrder(ids: string[], id: string, direction: MoveDirection): string[] | null {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Appends -2, -3, … until `isTaken` reports the slug as free. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = base || "item";
  if (!(await isTaken(root))) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root.slice(0, 55)}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${root.slice(0, 48)}-${Date.now().toString(36)}`;
}
