"use client";

import Link from "next/link";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { ArrowUpRight, FileText, Images, Mail, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicHomeLink } from "@/components/dashboard/public-home-link";

export default function DashboardPage() {
  const { copy } = useDashboardLocale();
  const areas = [
    { title: copy.pages, description: copy.reviewPages, icon: FileText, ready: true },
    { title: copy.media, description: "Upload and copy image and video URLs.", icon: Images, ready: true },
    { title: copy.messages, description: copy.trackMessages, icon: Mail, ready: false },
    { title: copy.appearance, description: copy.configureSettings, icon: Settings, ready: true },
  ];
  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
    <div className="flex justify-end"><PublicHomeLink /></div>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard areas">
      {areas.map(({ title, description, icon: Icon, ready }) => <Card key={title} className="group transition-shadow hover:shadow-md">
        <CardHeader><div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
        <CardContent>{ready ? <Button nativeButton={false} variant="default" size="sm" render={<Link href={title === copy.media ? "/dashboard/media" : title === copy.appearance ? "/dashboard/appearance/site-identity" : "/dashboard/pages"} />}>{title === copy.media ? "Open library" : copy.openEditor}<ArrowUpRight className="size-4" /></Button> : <Button variant="outline" size="sm" disabled aria-label={`${title} ${copy.comingSoon}`}>{copy.comingSoon}</Button>}</CardContent>
      </Card>)}
    </section>
    <Card className="overflow-hidden border-primary/15 bg-primary/[0.04]">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-medium">{copy.publicPages}</p><p className="mt-1 text-sm text-muted-foreground">{copy.pagesDescription}</p></div>
        <Button nativeButton={false} variant="outline" render={<Link href="/dashboard/pages" />}>{copy.pages} <ArrowUpRight className="size-4" /></Button>
      </CardContent>
    </Card>
  </main>;
}
