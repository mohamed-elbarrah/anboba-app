"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/features/auth/actions";

export function ProfileForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updateProfile, { ok: false });
  return <form action={action} className="max-w-xl space-y-5">
    <div className="space-y-2"><label htmlFor="email">New email</label><Input className="bg-card" id="email" name="email" type="email" defaultValue={email} autoComplete="email" /></div>
    <div className="space-y-2"><label htmlFor="newPassword">New password</label><Input className="bg-card" id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} /></div>
    <div className="space-y-2"><label htmlFor="currentPassword">Current password</label><Input className="bg-card" id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></div>
    {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>{state.message}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
  </form>;
}
