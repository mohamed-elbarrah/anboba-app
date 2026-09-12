"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Headphones, Mail, MapPin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  createContactSchema,
  type ContactContent,
  type ContactFormValues,
} from "@/features/contact/schema";
import { cn } from "@/lib/utils";
import { MotionReveal } from "@/components/public/motion";
import { setSubmissionErrors, submitPublicForm } from "@/lib/public-form-submission";
import { toast } from "sonner";

const detailIcons = {
  phone: Phone,
  email: Mail,
  location: MapPin,
  hours: Headphones,
} as const;

export function ContactSection({
  content,
  locale = "ar",
}: {
  content: ContactContent;
  locale?: "ar" | "en";
}) {
  const contentDirection =
    locale === "ar" ? "[direction:rtl]" : "[direction:ltr]";
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(createContactSchema(content.validation)),
    mode: "onBlur",
    defaultValues: { fullName: "", phone: "", message: "" },
  });

  async function onSubmit(values: ContactFormValues) {
    const data = new FormData();
    data.set("fullName", values.fullName);
    data.set("phone", values.phone);
    data.set("message", values.message);
    data.set("website", "");
    const result = await submitPublicForm("contact", locale, data);
    if (result.ok) { form.reset(); toast.success(result.successMessage); return; }
    setSubmissionErrors(result, (name, error) => form.setError(name as keyof ContactFormValues, error), (message) => toast.error(message));
  }

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="bg-background px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20"
    >
      <header className="mx-auto max-w-[1440px] text-center">
        <MotionReveal y={16}>
        <p className="mx-auto inline-flex rounded-full border border-primary/10 bg-primary/10 px-6 py-2 text-sm font-bold text-primary shadow-sm">
          {content.eyebrow}
        </p>
        </MotionReveal>
        <MotionReveal y={18} delay={0.2}>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {content.headingStart}{" "}
          <span className="text-primary">{content.headingHighlight}</span>
        </h1>
        </MotionReveal>
        <MotionReveal y={18} delay={0.4}>
        <p className="mx-auto mt-4 max-w-[780px] text-base leading-8 text-muted-foreground sm:text-lg lg:text-[1.2rem] lg:leading-relaxed">
          {content.description}
        </p>
        </MotionReveal>
      </header>

      <div className="mx-auto mt-14 grid max-w-[1440px] grid-cols-1 items-stretch gap-5 [direction:ltr] lg:grid-cols-[minmax(0,458fr)_minmax(0,558fr)] lg:gap-6">
        <MotionReveal className="order-2 lg:order-1" x={-38}>
        <aside
          aria-label={content.eyebrow}
          className={`flex flex-col gap-4 ${contentDirection}`}
        >
          {content.details.map((detail) => {
            const Icon = detailIcons[detail.kind];
            const card = (
              <span className="flex min-h-[106px] items-center gap-5 rounded-[1.55rem] border border-white/90 bg-white/60 px-7 shadow-[0_5px_7px_color-mix(in_srgb,var(--foreground)_7%,transparent)] transition-colors hover:bg-white/80 sm:px-9">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Icon className="size-6" strokeWidth={2} aria-hidden="true" />
                </span>
                <span
                  dir="auto"
                  className="min-w-0 break-words text-lg font-bold text-foreground sm:text-[19px]"
                >
                  {detail.value}
                </span>
              </span>
            );
            return detail.href ? (
              <a
                key={detail.kind}
                href={detail.href}
                className="rounded-[1.55rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {card}
              </a>
            ) : (
              <div key={detail.kind}>{card}</div>
            );
          })}
        </aside>
        </MotionReveal>

        <MotionReveal className="order-1 lg:order-2" x={38} delay={0.6}>
        <div
          className={`rounded-[2rem] border border-white/90 bg-white/35 px-6 py-7 shadow-[0_5px_7px_color-mix(in_srgb,var(--foreground)_5%,transparent)] ${contentDirection} sm:px-8 sm:py-8 lg:order-2`}
        >
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <TextField
                name="fullName"
                label={content.fields.fullName}
                placeholder={content.placeholders.fullName}
                form={form}
              />
              <div>
                <FieldLabel htmlFor="contact-phone" id="contact-phone-label">
                  {content.fields.phone}
                </FieldLabel>
                <div
                  className={cn(
                    "mt-2 flex h-12 overflow-hidden rounded-full border bg-white/60 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20",
                    form.formState.errors.phone
                      ? "border-destructive"
                      : "border-white",
                  )}
                  dir="ltr"
                >
                  <span
                    id="contact-phone-prefix"
                    role="img"
                    aria-label={`${content.countryLabel} ${content.countryCode}`}
                    className="flex shrink-0 items-center gap-1 border-r border-border/70 bg-muted/40 px-3 text-xs text-muted-foreground"
                  >
                    {content.countryCode} <span aria-hidden="true">🇸🇦</span>
                  </span>
                  <input
                    id="contact-phone"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel-national"
                    {...form.register("phone")}
                    className="min-w-0 flex-1 bg-transparent px-4 text-left text-sm outline-none placeholder:text-muted-foreground/70"
                    placeholder={content.placeholders.phone}
                    aria-label={content.fields.phone}
                    aria-invalid={!!form.formState.errors.phone}
                    aria-describedby={cn(
                      "contact-phone-prefix",
                      form.formState.errors.phone
                        ? "contact-phone-error"
                        : undefined,
                    )}
                  />
                </div>
                <FieldError id="contact-phone-error">
                  {form.formState.errors.phone?.message}
                </FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="contact-message">
                  {content.fields.message}
                </FieldLabel>
                <textarea
                  id="contact-message"
                  rows={3}
                  {...form.register("message")}
                  className={cn(
                    "mt-2 min-h-[80px] w-full resize-y rounded-xl border bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/20",
                    form.formState.errors.message
                      ? "border-destructive"
                      : "border-white",
                  )}
                  placeholder={content.placeholders.message}
                  aria-invalid={!!form.formState.errors.message}
                  aria-describedby={
                    form.formState.errors.message
                      ? "contact-message-error"
                      : undefined
                  }
                />
                <FieldError id="contact-message-error">
                  {form.formState.errors.message?.message}
                </FieldError>
              </div>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                size="lg"
                className="mx-auto flex h-12 w-full max-w-[200px] rounded-full text-base font-extrabold shadow-lg shadow-primary/25"
              >
                {content.submit}
              </Button>
            </form>
        </div>
        </MotionReveal>
      </div>
    </main>
  );
}

function FieldLabel({
  htmlFor,
  id,
  children,
}: {
  htmlFor: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className="block text-base font-bold text-foreground"
    >
      {children}
    </label>
  );
}

function FieldError({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  return children ? (
    <p
      id={id}
      className="mt-1 text-xs font-medium text-destructive"
      role="alert"
    >
      {children}
    </p>
  ) : null;
}

function TextField({
  name,
  label,
  placeholder,
  form,
}: {
  name: "fullName";
  label: string;
  placeholder: string;
  form: ReturnType<typeof useForm<ContactFormValues>>;
}) {
  const error = form.formState.errors[name];
  return (
    <div>
      <FieldLabel htmlFor="contact-full-name">{label}</FieldLabel>
      <input
        id="contact-full-name"
        type="text"
        autoComplete="name"
        {...form.register(name)}
        className={cn(
          "mt-2 h-12 w-full rounded-full border bg-white/60 px-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/20",
          error ? "border-destructive" : "border-white",
        )}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? "contact-full-name-error" : undefined}
      />
      <FieldError id="contact-full-name-error">{error?.message}</FieldError>
    </div>
  );
}
