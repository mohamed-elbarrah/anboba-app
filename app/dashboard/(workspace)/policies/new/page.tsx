import { PolicyEditor } from "@/components/dashboard/policy-editor";
import { requireAdmin } from "@/features/auth/session";

export default async function NewPolicyPage() { await requireAdmin(); return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8"><h1 className="text-3xl font-semibold tracking-tight">إنشاء سياسة</h1><PolicyEditor /></main>; }
