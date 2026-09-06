import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolicyList } from "@/components/dashboard/policy-list";
import { listPolicies } from "@/features/policies/queries";
import { requireAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  await requireAdmin();
  const policies = await listPolicies();
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8"><div className="flex items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">السياسات</h1><p className="mt-2 text-muted-foreground">إدارة صفحات السياسات القانونية بشكل مستقل.</p></div><Button nativeButton={false} render={<Link href="/dashboard/policies/new" />}><Plus />إنشاء سياسة</Button></div><Card><CardHeader><CardTitle>صفحات السياسات</CardTitle></CardHeader><CardContent className="p-0"><PolicyList policies={policies} /></CardContent></Card></main>;
}
