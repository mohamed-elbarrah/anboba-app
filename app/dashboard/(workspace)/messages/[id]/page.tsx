import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSubmission } from "@/features/submissions/queries";
import { SubmissionDetail } from "@/components/dashboard/submission-detail";
export const dynamic = "force-dynamic";
export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ar = (await cookies()).get("dashboard-locale")?.value === "ar";
  const submission = await getSubmission(id);
  if (!submission) notFound();
  return <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8"><Link href="/dashboard/messages" className="text-sm text-primary hover:underline">← {ar ? "العودة للرسائل" : "Back to submissions"}</Link><SubmissionDetail submission={submission} ar={ar} /></main>;
}
