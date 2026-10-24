import { SearchX } from "lucide-react";
import Link from "next/link";
import { NoticePage } from "@/components/app/notice-page";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <NoticePage
      icon={SearchX}
      title="Page not found"
      actions={
        <Button asChild>
          <Link href="/">Go to the homepage</Link>
        </Button>
      }
    >
      The page you are looking for does not exist, has moved, or is not published.
    </NoticePage>
  );
}
