"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { saveSubmissionNotificationRecipient, saveSubmissionNotificationTemplate, sendSubmissionNotificationTest } from "../notification-actions";

type FormKey = "contact" | "join_application" | "partner_registration";
type Template = { subject: string; body: string };
type Templates = Record<FormKey, Template>;

export function NotificationRecipientEditor({ initialRecipient, initialTemplates }: { initialRecipient: string | null; initialTemplates: Templates }) {
  const { locale, copy } = useDashboardLocale();
  const [recipient, setRecipient] = useState(initialRecipient ?? "");
  const [selected, setSelected] = useState<FormKey>("contact");
  const [templates, setTemplates] = useState<Templates>(initialTemplates);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = templates[selected];
  const run = (action: () => Promise<{ ok: boolean; code?: string }>, success: string) => startTransition(async () => {
    setStatus(null);
    try {
      const result = await action();
      setError(!result.ok);
      setStatus(result.ok ? success : result.code === "INVALID_INPUT" ? copy.notificationInvalid : copy.notificationError);
    } catch {
      setError(true);
      setStatus(copy.notificationError);
    }
  });
  const update = (field: keyof Template, value: string) => setTemplates((value_) => ({ ...value_, [selected]: { ...value_[selected], [field]: value } }));
  return <main className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-12 md:p-8" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header><h1 className="text-3xl font-semibold tracking-tight">{copy.notificationSettings}</h1><p className="mt-2 text-muted-foreground">{copy.notificationDescription}</p></header>
    <Card><CardHeader><CardTitle>{copy.notificationRecipient}</CardTitle><CardDescription>{copy.notificationRecipientDescription}</CardDescription></CardHeader><CardContent className="space-y-5">
      <label className="block space-y-2 text-sm font-medium"><span>{copy.emailAddress}</span><Input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="admin@example.com" autoComplete="email" /></label>
      <Button type="button" disabled={pending} onClick={() => run(() => saveSubmissionNotificationRecipient({ recipientEmail: recipient }), copy.notificationSaved)}>{copy.save}</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{copy.notificationTemplateTitle}</CardTitle><CardDescription>{copy.notificationTemplateDescription}</CardDescription></CardHeader><CardContent className="space-y-5">
      <label className="block space-y-2 text-sm font-medium"><span>{copy.notificationForm}</span><select value={selected} onChange={(event) => setSelected(event.target.value as FormKey)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="contact">{copy.notificationContactForm}</option><option value="join_application">{copy.notificationJoinForm}</option><option value="partner_registration">{copy.notificationPartnerForm}</option></select></label>
      <label className="block space-y-2 text-sm font-medium"><span>{copy.notificationSubject}</span><Input value={current.subject} maxLength={255} onChange={(event) => update("subject", event.target.value)} /></label>
      <label className="block space-y-2 text-sm font-medium"><span>{copy.notificationBody}</span><Textarea value={current.body} maxLength={5000} rows={8} onChange={(event) => update("body", event.target.value)} /></label>
      <p className="text-sm text-muted-foreground">{copy.notificationPlaceholders}: <code dir="ltr">&#123;&#123;senderName&#125;&#125;</code>، <code dir="ltr">&#123;&#123;formName&#125;&#125;</code>، <code dir="ltr">&#123;&#123;submissionId&#125;&#125;</code>، <code dir="ltr">&#123;&#123;submittedAt&#125;&#125;</code></p>
      <div className="flex flex-wrap gap-3"><Button type="button" disabled={pending} onClick={() => run(() => saveSubmissionNotificationTemplate({ formKey: selected, template: current }), copy.notificationTemplateSaved)}>{copy.save}</Button><Button type="button" variant="outline" disabled={pending} onClick={() => run(() => sendSubmissionNotificationTest({ formKey: selected, template: current }), copy.notificationTestSent)}>{copy.sendTest}</Button></div>
      {status && <p role="status" className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{status}</p>}
    </CardContent></Card>
  </main>;
}
