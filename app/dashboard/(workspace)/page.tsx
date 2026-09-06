import Link from "next/link";
import { ArrowUpRight, FileText, Images, Mail, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const areas = [
  { title: "Pages", description: "Review the five public page identities and their translations.", icon: FileText, ready: true },
  { title: "Media", description: "A future home for your image and asset library.", icon: Images, ready: false },
  { title: "Messages", description: "Keep track of contact requests in one place.", icon: Mail, ready: false },
  { title: "Settings", description: "Configure the site when dashboard settings arrive.", icon: Settings, ready: false },
];

export default function DashboardPage() {
  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
    <section className="max-w-2xl space-y-3">
      <p className="text-sm font-medium text-primary">ANBOBA workspace</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Good morning, welcome back.</h1>
      <p className="text-muted-foreground">A calm place to manage your public website content. Choose a workspace area to get started.</p>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard areas">
      {areas.map(({ title, description, icon: Icon, ready }) => <Card key={title} className="group transition-shadow hover:shadow-md">
        <CardHeader><div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
        <CardContent>{ready ? <Button nativeButton={false} variant="default" size="sm" render={<Link href="/dashboard/pages" />}>Open workspace<ArrowUpRight className="size-4" /></Button> : <Button variant="outline" size="sm" disabled aria-label={`${title} coming soon`}>Coming soon</Button>}</CardContent>
      </Card>)}
    </section>
    <Card className="overflow-hidden border-primary/15 bg-primary/[0.04]">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-medium">Your public pages are the foundation</p><p className="mt-1 text-sm text-muted-foreground">See availability across Arabic and English from the pages workspace.</p></div>
        <Button nativeButton={false} variant="outline" render={<Link href="/dashboard/pages" />}>View pages <ArrowUpRight className="size-4" /></Button>
      </CardContent>
    </Card>
  </main>;
}
