import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult, FieldErrors } from "@/lib/action-result";
import { AppError } from "@/server/errors";

export type { ActionResult };

/**
 * Runs a server action body and converts known failures into a serialisable
 * result. Unexpected errors are logged and reported generically.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error); // let redirect() / notFound() propagate
    if (error instanceof AppError) {
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    }
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: z.flattenError(error).fieldErrors as FieldErrors,
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That value is already in use. Please choose another." };
    }
    console.error("[action] unexpected error", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
