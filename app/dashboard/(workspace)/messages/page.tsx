import { cookies } from "next/headers";
import { SubmissionsList } from "@/components/dashboard/submissions-list";
import { listSubmissions } from "@/features/submissions/queries";
export const dynamic = "force-dynamic";
export default async function MessagesPage() {
  const ar = (await cookies()).get("dashboard-locale")?.value === "ar";
  const submissions = await listSubmissions();
  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8"><section><p className="text-sm font-medium text-primary">{ar ? "الوارد" : "Inbox"}</p><h1 className="mt-2 text-3xl font-semibold">{ar ? "الرسائل والطلبات" : "Submissions"}</h1><p className="mt-2 text-muted-foreground">{ar ? "راجع الطلبات الواردة وحدّث حالتها." : "Review incoming forms and update their status."}</p></section><SubmissionsList submissions={submissions ?? []} ar={ar} /></main>;
}
