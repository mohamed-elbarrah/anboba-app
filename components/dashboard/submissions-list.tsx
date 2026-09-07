"use client";
import Link from "next/link";
import { useTransition } from "react";
import { updateSubmissionStatus } from "@/features/submissions/actions";
import { Card, CardContent } from "@/components/ui/card";

function formatSubmissionDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

type Submission = { id: string; formKey: string; locale: string; status: string; notificationStatus: string; createdAt: Date | string };
export function SubmissionsList({ submissions, ar }: { submissions: Submission[]; ar: boolean }) {
  const [pending, startTransition] = useTransition();
  if (!submissions.length) return <Card><CardContent className="p-12 text-center text-muted-foreground">{ar ? "لا توجد رسائل بعد" : "No submissions yet"}</CardContent></Card>;
  return <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-start"><th className="p-4 text-start">{ar ? "النموذج" : "Form"}</th><th className="p-4 text-start">{ar ? "التاريخ" : "Date"}</th><th className="p-4 text-start">{ar ? "الحالة" : "Status"}</th><th className="p-4 text-start">{ar ? "إجراء" : "Action"}</th></tr></thead><tbody>{submissions.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4"><Link className="font-medium text-primary hover:underline" href={`/dashboard/messages/${item.id}`}>{item.formKey} #{item.id}</Link></td><td className="p-4 text-muted-foreground">{formatSubmissionDate(item.createdAt)}</td><td className="p-4"><select value={item.status} disabled={pending} onChange={(event) => startTransition(() => { void updateSubmissionStatus(item.id, event.target.value); })} className="rounded-md border bg-background px-2 py-1"><option value="new">{ar ? "جديد" : "New"}</option><option value="in_review">{ar ? "قيد المراجعة" : "In review"}</option><option value="accepted">{ar ? "مقبول" : "Accepted"}</option><option value="rejected">{ar ? "مرفوض" : "Rejected"}</option><option value="archived">{ar ? "مؤرشف" : "Archived"}</option></select></td><td className="p-4"><Link href={`/dashboard/messages/${item.id}`} className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">{ar ? "عرض" : "View"}</Link></td></tr>)}</tbody></table></CardContent></Card>;
}
