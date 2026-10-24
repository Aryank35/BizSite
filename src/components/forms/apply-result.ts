import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

/**
 * Shows a toast for an action result and maps server field errors onto the
 * form. Returns true on success.
 */
export function applyResult<T extends FieldValues>(
  result: ActionResult<unknown>,
  options: { success?: string; setError?: UseFormSetError<T> } = {},
): boolean {
  if (result.ok) {
    if (options.success) toast.success(options.success);
    return true;
  }
  toast.error(result.error);
  if (options.setError && result.fieldErrors) {
    for (const [field, messages] of Object.entries(result.fieldErrors)) {
      if (messages?.[0]) options.setError(field as Path<T>, { type: "server", message: messages[0] });
    }
  }
  return false;
}
