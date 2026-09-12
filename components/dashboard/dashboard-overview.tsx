"use client";

import Link from "next/link";
import { FileText, Images, LayoutDashboard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHomeLink } from "@/components/dashboard/public-home-link";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import type { DashboardOverview } from "@/features/dashboard/queries";
import type { LucideIcon } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
  progress,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
  href: string;
  progress?: number;
}) {
  return (
    <Link href={href} className="group block h-full focus-visible:outline-none">
      <Card className="relative h-full overflow-hidden border-0 bg-card shadow-sm ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary/80 group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-5" />
            </span>
            <p className="pt-1 text-sm font-medium text-muted-foreground">{label}</p>
          </div>
          <div className="mt-7">
            <p className="text-4xl font-semibold leading-none tracking-tight">{value}</p>
            <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
            {progress !== undefined && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardOverview({ data }: { data: DashboardOverview }) {
  const { copy } = useDashboardLocale();
  const pagesProgress = data.pages.totalLocales ? Math.round((data.pages.publishedLocales / data.pages.totalLocales) * 100) : 0;
  const formsProgress = data.forms.totalLocales ? Math.round((data.forms.publishedLocales / data.forms.totalLocales) * 100) : 0;
  const messagesDetail = data.submissions.failedNotifications > 0
    ? `${data.submissions.newCount} ${copy.overviewNewItems} · ${data.submissions.failedNotifications} ${copy.overviewFailedNotifications}`
    : `${data.submissions.newCount} ${copy.overviewNewItems}`;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">{copy.workspace}</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{copy.overviewGreeting}</h1>
          <p className="max-w-2xl text-muted-foreground">{copy.overviewDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PublicHomeLink />
          <Button nativeButton={false} render={<Link href="/dashboard/messages" />}>
            <Mail className="size-4" />
            {copy.overviewReviewMessages}
          </Button>
        </div>
      </section>

      <section aria-label={copy.overviewSummary} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label={copy.pages} value={data.pages.total} detail={`${data.pages.publishedLocales}/${data.pages.totalLocales} ${copy.overviewPublishedLocales}`} href="/dashboard/pages" progress={pagesProgress} />
        <StatCard icon={LayoutDashboard} label={copy.forms} value={data.forms.total} detail={`${data.forms.publishedLocales}/${data.forms.totalLocales} ${copy.overviewPublishedLocales}`} href="/dashboard/forms" progress={formsProgress} />
        <StatCard icon={Mail} label={copy.messages} value={data.submissions.total} detail={messagesDetail} href="/dashboard/messages" />
        <StatCard icon={Images} label={copy.media} value={data.media.total} detail={copy.overviewMediaItems} href="/dashboard/media" />
      </section>
    </main>
  );
}
