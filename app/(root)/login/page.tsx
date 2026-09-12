import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/dashboard");
  return <main dir="ltr" lang="en" className="flex min-h-svh items-center justify-center bg-muted/30 p-6"><section className="w-full max-w-md space-y-8 rounded-xl border bg-background p-8 text-start shadow-sm"><div className="space-y-2 text-center"><h1 className="text-3xl font-semibold tracking-tight">ANBOBA Dashboard</h1><p className="text-sm text-muted-foreground">Sign in to manage your website.</p></div><LoginForm /></section></main>;
}
