"use client";

import { ExternalLink } from "lucide-react";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { Button } from "@/components/ui/button";

export function PublicHomeLink() {
  const { copy, locale } = useDashboardLocale();

  return (
    <Button nativeButton={false} variant="outline" render={<a href={`/${locale}`} target="_blank" rel="noopener noreferrer" />}>
      {copy.openPublicHome}
      <ExternalLink className="size-4" />
    </Button>
  );
}
