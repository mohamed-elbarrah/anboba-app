"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return <form action={action} className="space-y-5">
    <div className="space-y-2"><label htmlFor="email">Email</label><Input className="bg-card" id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!state?.fieldErrors?.email?.length} /></div>
    <div className="space-y-2"><label htmlFor="password">Password</label><Input className="bg-card" id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state?.fieldErrors?.password?.length} /></div>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" className="w-full" size="lg" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
