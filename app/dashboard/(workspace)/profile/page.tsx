import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileForm } from "@/components/auth/profile-form";
import { requireAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const admin = await requireAdmin();
  return <main className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Account</p><h1 className="text-3xl font-semibold tracking-tight">Profile</h1></div><LogoutButton /></div><Card><CardHeader><CardTitle>Account details</CardTitle></CardHeader><CardContent><ProfileForm email={admin.email} /></CardContent></Card></main>;
}
