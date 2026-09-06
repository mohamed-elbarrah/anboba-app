import Link from "next/link";
import { Archive, CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";
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

export function PagesList({ pages }: { pages: DashboardPage[] }) {
  return <Card>
    <CardHeader><CardTitle>Public pages</CardTitle><CardDescription>One row per public page identity. Locale availability is shown independently.</CardDescription></CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader><TableRow><TableHead>Page</TableHead><TableHead>Arabic</TableHead><TableHead>English</TableHead><TableHead>Last updated</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
        <TableBody>{pages.map((page) => <TableRow key={page.slug || "home"}>
          <TableCell><div className="min-w-40"><p className="font-medium">{page.name}</p><p className="text-xs text-muted-foreground">{page.description}</p></div></TableCell>
          <TableCell><Availability value={page.locales.ar.availability} /></TableCell>
          <TableCell><Availability value={page.locales.en.availability} /></TableCell>
          <TableCell><Updated date={[page.locales.ar.updatedAt, page.locales.en.updatedAt].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null} /></TableCell>
          <TableCell className="text-end">{page.locales.ar.id || page.locales.en.id ? <Link href={`/dashboard/pages/${page.locales.ar.id ?? page.locales.en.id}`} className="text-sm font-medium text-primary hover:underline">Open editor</Link> : <span className="text-sm text-muted-foreground">Not configured</span>}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </CardContent>
  </Card>;
}
