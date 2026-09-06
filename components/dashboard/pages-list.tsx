"use client";

import Link from "next/link";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { Archive, CheckCircle2, CircleDashed, Eye, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardPage } from "@/features/pages/dashboard-queries";

function Availability({ value }: { value: DashboardPage["locales"]["ar"]["availability"] }) {
  if (value === "published") return <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600"><CheckCircle2 className="size-3" />Published</Badge>;
  if (value === "draft") return <Badge variant="secondary" className="gap-1"><CircleDashed className="size-3" />Draft</Badge>;
  if (value === "archived") return <Badge variant="outline" className="gap-1 text-muted-foreground"><Archive className="size-3" />Archived</Badge>;
  if (value === "invalid") return <Badge variant="destructive" className="gap-1"><TriangleAlert className="size-3" />Invalid pointer</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not configured</Badge>;
}

function Updated({ date }: { date: Date | null }) {
  return <span className="text-sm text-muted-foreground">{date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date) : "—"}</span>;
}

function PublicPreview({ slug, locale, published, label }: { slug: string; locale: "ar" | "en"; published: boolean; label: string }) {
  if (!published) return null;
  return <a href={`/${locale}${slug ? `/${slug}` : ""}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><Eye className="size-3.5" />{label} {locale.toUpperCase()}</a>;
}

export function PagesList({ pages }: { pages: DashboardPage[] }) {
  const { copy } = useDashboardLocale();
  return <Card>
    <CardHeader><CardTitle>{copy.publicPages}</CardTitle><CardDescription>{copy.pageIdentityDescription}</CardDescription></CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader><TableRow><TableHead>{copy.pages}</TableHead><TableHead>{copy.arabic}</TableHead><TableHead>{copy.english}</TableHead><TableHead>{copy.lastUpdated}</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
        <TableBody>{pages.map((page) => <TableRow key={page.slug || "home"}>
          <TableCell><div className="min-w-40"><p className="font-medium">{page.name}</p><p className="text-xs text-muted-foreground">{page.description}</p></div></TableCell>
          <TableCell><Availability value={page.locales.ar.availability} /></TableCell>
          <TableCell><Availability value={page.locales.en.availability} /></TableCell>
          <TableCell><Updated date={[page.locales.ar.updatedAt, page.locales.en.updatedAt].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null} /></TableCell>
          <TableCell className="text-end">{page.locales.ar.id || page.locales.en.id ? <div className="flex flex-wrap justify-end gap-x-3 gap-y-1"><Link href={`/dashboard/pages/${page.locales.ar.id ?? page.locales.en.id}`} className="text-sm font-medium text-primary hover:underline">{copy.openEditor}</Link><PublicPreview slug={page.slug} locale="ar" published={page.locales.ar.availability === "published"} label={copy.preview} /><PublicPreview slug={page.slug} locale="en" published={page.locales.en.availability === "published"} label={copy.preview} /></div> : <span className="text-sm text-muted-foreground">Not configured</span>}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </CardContent>
  </Card>;
}
