"use client";

import { Check, Undo2 } from "lucide-react";
import { useTransition } from "react";
import { applyResult } from "@/components/forms/apply-result";
import { Button } from "@/components/ui/button";
import { setWebsiteRequestHandledAction } from "../actions";

export function RequestHandledToggle({ id, handled }: { id: string; handled: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant={handled ? "ghost" : "outline"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          applyResult(await setWebsiteRequestHandledAction(id, !handled), { success: handled ? "Marked as open" : "Marked as handled" });
        })
      }
    >
      {handled ? <Undo2 /> : <Check />} {handled ? "Reopen" : "Mark handled"}
    </Button>
  );
}
