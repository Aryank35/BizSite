"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ConfirmAction } from "@/components/app/confirm-action";
import { ENQUIRY_STATUS_LABELS } from "@/components/app/status-badge";
import { applyResult } from "@/components/forms/apply-result";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deleteEnquiryAction, updateEnquiryStatusAction } from "../actions";

export function EnquiryActions({ id, status, closeHref }: { id: string; status: string; closeHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor="enquiry-status">Status</Label>
        <NativeSelect
          id="enquiry-status"
          value={status}
          disabled={pending}
          className="w-44"
          onChange={(e) => {
            const next = e.target.value;
            startTransition(async () => {
              applyResult(await updateEnquiryStatusAction(id, next), { success: "Status updated" });
            });
          }}
        >
          {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <ConfirmAction
        trigger={
          <Button size="sm" variant="ghost">
            <Trash2 /> Delete
          </Button>
        }
        title="Delete this enquiry?"
        description="The customer's message and contact details will be permanently removed."
        confirmLabel="Delete enquiry"
        destructive
        successMessage="Enquiry deleted"
        action={() => deleteEnquiryAction(id)}
        onSuccess={() => router.replace(closeHref, { scroll: false })}
      />
    </div>
  );
}
