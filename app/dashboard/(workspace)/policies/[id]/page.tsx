import { notFound } from "next/navigation";
import { PolicyEditor } from "@/components/dashboard/policy-editor";
import { getPolicyEditor } from "@/features/policies/queries";
import { requireAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function EditPolicyPage({ params }: { params: Promise<{ id: string }> }) { await requireAdmin(); const { id } = await params; if (!/^[1-9]\d*$/.test(id)) notFound(); const policy = await getPolicyEditor(id); if (!policy) notFound(); return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8"><h1 className="text-3xl font-semibold tracking-tight">تعديل السياسة</h1><PolicyEditor initial={policy} /></main>; }
