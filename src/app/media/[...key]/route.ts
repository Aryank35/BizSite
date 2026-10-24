import { MIME_BY_EXT } from "@/lib/image-types";
import { readLocalFile } from "@/server/storage";

/** Serves uploads stored by the local storage driver. */
export async function GET(_request: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  const file = await readLocalFile(key);
  if (!file) return new Response("Not found", { status: 404 });

  const ext = key.split(".").pop() ?? "";
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
