"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { NoticePage } from "@/components/app/notice-page";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <NoticePage
      icon={TriangleAlert}
      title="Something went wrong"
      actions={
        <Button onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      }
    >
      An unexpected error occurred. Please try again in a moment.
      {error.digest ? <span className="mt-2 block font-mono text-xs">Reference: {error.digest}</span> : null}
    </NoticePage>
  );
}
