"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { archivePolicy } from "@/features/policies/actions";
import type { PolicyListItem } from "@/features/policies/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PolicyList({ policies }: { policies: PolicyListItem[] }) {
  const router = useRouter();
  async function archive(id: string) { if (!window.confirm("حذف هذه السياسة؟")) return; const result = await archivePolicy(id); if (!result.ok) window.alert(result.message); else router.refresh(); }
  return <Table><TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>المعرف</TableHead><TableHead>اللغة</TableHead><TableHead>النشر</TableHead><TableHead>إجراء</TableHead></TableRow></TableHeader><TableBody>{policies.map((policy) => <TableRow key={policy.id}><TableCell className="font-medium">{policy.title}</TableCell><TableCell className="font-mono text-sm">{policy.slug}</TableCell><TableCell>{policy.locale.toUpperCase()}</TableCell><TableCell>{policy.published ? "منشورة" : "مسودة"}</TableCell><TableCell className="flex gap-2"><Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/dashboard/policies/${policy.id}`} />}>تعديل</Button><Button type="button" variant="ghost" size="sm" onClick={() => archive(policy.id)}>حذف</Button></TableCell></TableRow>)}</TableBody></Table>;
}
