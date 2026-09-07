"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createForm } from "@/features/forms/actions";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
const starter = [
  {
    key: "name",
    type: "text",
    label: "Name",
    required: true,
    width: "full" as const,
  },
  {
    key: "email",
    type: "email",
    label: "Email",
    required: true,
    width: "full" as const,
  },
] as const;
const arabicStarter = starter.map((field, index) => ({
  ...field,
  label: index === 0 ? "الاسم" : "البريد الإلكتروني",
}));
export function FormCreate() {
  const router = useRouter();
  const { locale } = useDashboardLocale();
  const ar = locale === "ar";
  const t = ar
    ? {
        back: "النماذج",
        eyebrow: "منشئ النماذج",
        title: "إنشاء نموذج",
        description: "ابدأ بنموذج آمن ومرن. أضف الحقول وترجمها من المنشئ.",
        details: "تفاصيل النموذج",
        detailsDescription:
          "يُنشأ مفتاح داخلي فريد من هذا الاسم. لا يمكن إضافة تعليمات برمجية أو تنسيقات أو مكونات مخصصة.",
        name: "اسم النموذج",
        placeholder: "مثال: الاشتراك في النشرة البريدية",
        notice:
          "تُنشأ مسودتا العربية والإنجليزية معاً. يجب أن تبقى اللغتان متوافقتين هيكلياً قبل النشر.",
        cancel: "إلغاء",
        creating: "جارٍ الإنشاء…",
        create: "إنشاء نموذج",
      }
    : {
        back: "Forms",
        eyebrow: "Form builder",
        title: "Create a form",
        description:
          "Start with a safe, flexible form. Add and localize fields in the builder.",
        details: "Form details",
        detailsDescription:
          "A unique internal key is generated from this name. No code, CSS, or custom components can be added.",
        name: "Form name",
        placeholder: "e.g. Newsletter signup",
        notice:
          "Arabic and English drafts are created together. Both locales must remain structurally compatible before publishing.",
        cancel: "Cancel",
        creating: "Creating…",
        create: "Create form",
      };
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    setError("");
    const result = await createForm({
      name,
      config: {
        ar: {
          fields: arabicStarter,
          submit: "إرسال",
          success: "شكراً — تم استلام رسالتك.",
        },
        en: {
          fields: starter.map((field) => ({ ...field, label: field.label })),
          submit: "Submit",
          success: "Thanks — we received your message.",
        },
      },
    });
    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }
    router.push(`/dashboard/forms/${result.formId}`);
  }
  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-3xl p-4 md:p-10"
    >
      <div className="mb-8">
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/dashboard/forms" />}
        >
          <ArrowLeft />
          {t.back}
        </Button>
        <div className="mt-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">{t.description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t.details}</CardTitle>
          <CardDescription>{t.detailsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="grid gap-2 text-sm font-medium">
            {t.name}
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholder}
              autoFocus
            />
          </label>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            {t.notice}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/forms")}
            >
              {t.cancel}
            </Button>
            <Button disabled={saving || !name.trim()} onClick={submit}>
              <Plus />
              {saving ? t.creating : t.create}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
