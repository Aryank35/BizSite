"use client";

import { Rocket } from "lucide-react";
import { ConfirmAction } from "@/components/app/confirm-action";
import { Button } from "@/components/ui/button";
import { publishWebsiteAction, unpublishWebsiteAction } from "../actions";

export function PublishControls({
  canPublish,
  isLive,
  hasChanges,
  hasErrors,
  blockedReason,
}: {
  canPublish: boolean;
  isLive: boolean;
  hasChanges: boolean;
  hasErrors: boolean;
  blockedReason: string | null;
}) {
  if (!canPublish) {
    return <p className="text-sm text-muted-foreground">{blockedReason}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmAction
        trigger={
          <Button disabled={hasErrors || (isLive && !hasChanges)}>
            <Rocket /> {isLive ? (hasChanges ? "Publish changes" : "Up to date") : "Publish website"}
          </Button>
        }
        title={isLive ? "Publish your changes?" : "Publish your website?"}
        description="Your current draft theme and sections will become the live website immediately."
        confirmLabel="Publish"
        successMessage="Website published"
        action={publishWebsiteAction}
      />
      {isLive ? (
        <ConfirmAction
          trigger={<Button variant="outline">Unpublish</Button>}
          title="Take your website offline?"
          description="Visitors will no longer be able to see your website or send enquiries. You can publish it again at any time."
          confirmLabel="Unpublish"
          destructive
          successMessage="Website unpublished"
          action={unpublishWebsiteAction}
        />
      ) : null}
    </div>
  );
}
