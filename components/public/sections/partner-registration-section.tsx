"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  partnerRegistrationSchema,
  type PartnerRegistrationContent,
  type PartnerRegistrationFormValues,
} from "@/features/join-us/partner-registration";
import { cn } from "@/lib/utils";

type Props = { content: PartnerRegistrationContent };
type FieldName = keyof PartnerRegistrationFormValues;

export function PartnerRegistrationSection({ content }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const form = useForm<PartnerRegistrationFormValues>({
    resolver: zodResolver(partnerRegistrationSchema),
    mode: "onBlur",
    defaultValues: { company: "", phone: "", email: "", city: "" },
  });

  function onSubmit() {
    // Client-only until a registration endpoint is intentionally introduced.
    setSubmitted(true);
    form.reset();
  }

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  return (
    <main
      dir="rtl"
      className="public-hero-surface px-5 pb-20 pt-20 sm:px-8 sm:pt-24 lg:pb-24 lg:pt-20"
    >
      <section
        aria-labelledby="partner-registration-heading"
        className="mx-auto max-w-[1400px]"
      >
        <header className="mx-auto max-w-2xl text-center">
          <p className="mx-auto inline-flex rounded-full bg-primary/10 px-6 py-2 text-base font-bold text-primary shadow-sm">
            {content.eyebrow}
          </p>
          <h1
            id="partner-registration-heading"
            className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            {content.headingStart}{" "}
            <span className="text-primary">{content.headingHighlight}</span>
          </h1>
          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
            {content.description}
          </p>
        </header>

        <div className="mt-14 rounded-[2rem] border border-white bg-white/35 p-6 shadow-[0_12px_30px_color-mix(in_srgb,var(--foreground)_8%,transparent)] sm:p-8 lg:mt-16 lg:p-6">
          {submitted ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="flex min-h-56 items-center justify-center rounded-3xl bg-primary/10 p-8 text-center text-lg font-bold leading-8 text-foreground outline-none"
            >
              {content.success}
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              dir="ltr"
              className="grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-2"
            >
              <PartnerField
                name="company"
                label={content.fields.company}
                placeholder={content.placeholders.company}
                autoComplete="organization"
                form={form}
                className="lg:col-start-2 lg:row-start-1"
              />
              <PhoneField
                content={content}
                form={form}
                className="lg:col-start-1 lg:row-start-1"
              />
              <PartnerField
                name="email"
                label={content.fields.email}
                placeholder={content.placeholders.email}
                type="email"
                autoComplete="email"
                form={form}
                className="lg:col-start-2 lg:row-start-2"
              />
              <CityField
                content={content}
                form={form}
                className="lg:col-start-1 lg:row-start-2"
              />
              <div dir="rtl" className="pt-2 lg:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="mx-auto h-12 w-full max-w-[200px] rounded-full text-base font-extrabold shadow-lg shadow-primary/25"
                >
                  {content.submit}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold text-foreground"
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
      role="alert"
      className="mt-1 text-xs font-medium text-destructive"
    >
      {children}
    </p>
  ) : null;
}

type Form = ReturnType<typeof useForm<PartnerRegistrationFormValues>>;

function PartnerField({
  name,
  label,
  placeholder,
  form,
  className,
  type = "text",
  autoComplete,
}: {
  name: Exclude<FieldName, "phone">;
  label: string;
  placeholder: string;
  form: Form;
  className?: string;
  type?: string;
  autoComplete?: string;
}) {
  const error = form.formState.errors[name];
  return (
    <div dir="rtl" className={className}>
      <FieldLabel htmlFor={`partner-${name}`}>{label}</FieldLabel>
      <input
        id={`partner-${name}`}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={name !== "email"}
        {...form.register(name)}
        className={cn(
          "mt-2 h-12 w-full rounded-full border border-white bg-white/55 px-5 text-sm outline-none placeholder:text-muted-foreground/65 focus:border-primary focus:ring-3 focus:ring-primary/20",
          error && "border-destructive",
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `partner-${name}-error` : undefined}
      />
      <FieldError id={`partner-${name}-error`}>{error?.message}</FieldError>
    </div>
  );
}

function CityField({
  content,
  form,
  className,
}: {
  content: PartnerRegistrationContent;
  form: Form;
  className?: string;
}) {
  const error = form.formState.errors.city;
  return (
    <div dir="rtl" className={className}>
      <FieldLabel htmlFor="partner-city">{content.fields.city}</FieldLabel>
      <Controller
        name="city"
        control={form.control}
        render={({ field }) => (
          <Select
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
          >
            <SelectTrigger
              id="partner-city"
              aria-label={content.fields.city}
              aria-invalid={!!error}
              aria-describedby={error ? "partner-city-error" : undefined}
              className={cn(
                "mt-2 h-12 w-full rounded-full border-white bg-white/55 px-5",
                error && "border-destructive",
              )}
            >
              <SelectValue placeholder={content.placeholders.city} />
            </SelectTrigger>
            <SelectContent>
              {content.cityOptions.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError id="partner-city-error">{error?.message}</FieldError>
    </div>
  );
}

function PhoneField({
  content,
  form,
  className,
}: {
  content: PartnerRegistrationContent;
  form: Form;
  className?: string;
}) {
  const error = form.formState.errors.phone;
  return (
    <div dir="rtl" className={className}>
      <FieldLabel htmlFor="partner-phone">{content.fields.phone}</FieldLabel>
      <div
        dir="ltr"
        className={cn(
          "mt-2 flex h-12 overflow-hidden rounded-full border border-white bg-white/55 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20",
          error && "border-destructive",
        )}
      >
        <span
          role="img"
          aria-label={`${content.countryCode}، ${content.countryLabel}`}
          className="flex shrink-0 items-center gap-2 border-r border-border/60 px-3 text-sm text-muted-foreground"
        >
          <span aria-hidden="true">🇸🇦</span>
          {content.countryCode}
        </span>
        <input
          id="partner-phone"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={content.placeholders.phone}
          required
          {...form.register("phone")}
          className="min-w-0 flex-1 bg-transparent px-4 text-left text-sm outline-none placeholder:text-muted-foreground/65"
          aria-invalid={!!error}
          aria-describedby={error ? "partner-phone-error" : undefined}
        />
      </div>
      <FieldError id="partner-phone-error">{error?.message}</FieldError>
    </div>
  );
}
