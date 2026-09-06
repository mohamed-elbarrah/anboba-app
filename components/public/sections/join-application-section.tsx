"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock3,
  FileText,
  FileUp,
  Headphones,
  IdCard,
  Paperclip,
  Truck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createJoinApplicationSchema,
  type JoinApplicationContent,
  type JoinApplicationFormValues,
} from "@/features/join-us/schema";
import { getLocaleDirection } from "@/lib/locales";
import { cn } from "@/lib/utils";

type JoinApplicationSectionProps = { content: JoinApplicationContent; locale: "ar" | "en" };

const benefitIcons = [Clock3, FileUp, Headphones] as const;

type TextFieldName = "fullName" | "phone" | "email" | "city";

export function JoinApplicationSection({
  content,
  locale,
}: JoinApplicationSectionProps) {
  const isArabic = locale === "ar";
  const direction = getLocaleDirection(locale);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<JoinApplicationFormValues>({
    resolver: zodResolver(createJoinApplicationSchema(content.validation)),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      experienceYears: "",
      transportType: "",
    },
  });

  const onSubmit = () => {
    // Client-only for now. Uploads and API/database persistence come later.
    setSubmitted(true);
    form.reset();
  };

  return (
    <section
      aria-labelledby="join-application-heading"
      className="bg-background px-5 py-16 sm:px-8 sm:py-24 lg:py-28"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div
        className={cn(
          "mx-auto grid max-w-[1440px] grid-cols-1 gap-8 lg:gap-12",
          isArabic
            ? "lg:grid-cols-[minmax(0,1.12fr)_minmax(310px,0.88fr)]"
            : "lg:grid-cols-[minmax(310px,0.88fr)_minmax(0,1.12fr)]",
        )}
        dir="ltr"
      >
        <div
          className={isArabic ? "order-2 lg:order-1" : "order-2 lg:order-2"}
          dir={direction}
        >
          {submitted ? (
            <div
              role="status"
              className="rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center text-lg font-bold leading-8 text-foreground"
            >
              {content.success}
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              dir={direction}
            >
              <div
                className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2"
                dir="ltr"
              >
                <TextField
                name="fullName"
                label={content.fields.fullName}
                placeholder={content.placeholders.fullName}
                icon={UserRound}
                form={form}
                locale={locale}
                className="lg:col-start-2 lg:row-start-1"
              />
              <div className="lg:col-start-1 lg:row-start-1" dir={direction}>
                <FieldLabel htmlFor="phone">{content.fields.phone}</FieldLabel>
                <div
                  className="mt-2 flex h-12 overflow-hidden rounded-full border border-input bg-card focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20"
                  dir="ltr"
                >
                  <span
                    className="flex items-center gap-1 border-r border-input bg-muted/50 px-3 text-sm font-bold text-muted-foreground"
                    aria-label={`${content.countryLabel} ${content.countryCode}`}
                  >
                    <span aria-hidden="true">🇸🇦</span> {content.countryCode}
                  </span>
                  <input
                    id="phone"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel-national"
                    {...form.register("phone")}
                    className="min-w-0 flex-1 bg-transparent px-3 text-left text-sm outline-none placeholder:text-muted-foreground/70"
                    placeholder={content.placeholders.phone}
                    aria-invalid={!!form.formState.errors.phone}
                    aria-describedby={
                      form.formState.errors.phone ? "phone-error" : undefined
                    }
                  />
                </div>
                <FieldError id="phone-error">
                  {form.formState.errors.phone?.message}
                </FieldError>
              </div>
              <TextField
                name="email"
                label={content.fields.email}
                type="email"
                placeholder={content.placeholders.email}
                icon={FileText}
                form={form}
                locale={locale}
                className="lg:col-start-2 lg:row-start-2"
              />
              <TextField
                name="city"
                label={content.fields.city}
                placeholder={content.placeholders.city}
                icon={Truck}
                form={form}
                locale={locale}
                className="lg:col-start-1 lg:row-start-2"
              />
              <SelectField
                name="experienceYears"
                label={content.fields.experienceYears}
                placeholder={content.selectPlaceholders.experienceYears}
                options={content.experienceOptions}
                form={form}
                locale={locale}
                className="lg:col-start-2 lg:row-start-3"
              />
              <SelectField
                name="transportType"
                label={content.fields.transportType}
                placeholder={content.selectPlaceholders.transportType}
                options={content.transportOptions}
                form={form}
                locale={locale}
                className="lg:col-start-1 lg:row-start-3"
              />
              <FileField
                name="nationalId"
                label={content.fields.nationalId}
                icon={IdCard}
                form={form}
                hint={content.fileHint}
                locale={locale}
                className="lg:col-start-2 lg:row-start-4"
              />
              <FileField
                name="drivingLicense"
                label={content.fields.drivingLicense}
                icon={Paperclip}
                form={form}
                hint={content.fileHint}
                locale={locale}
                className="lg:col-start-1 lg:row-start-4"
              />
              <div className="sm:col-span-2" dir={direction}>
                <Button
                  type="submit"
                  size="lg"
                  className="mx-auto block h-14 w-full max-w-[255px] rounded-full text-base font-extrabold shadow-lg shadow-primary/20"
                >
                  {content.submit}
                </Button>
              </div>
            </div>
          </form>
          )}
        </div>

        <aside
          className={cn(
            "order-1 rounded-[2rem] bg-brand-navy px-7 py-9 text-start text-white shadow-xl lg:flex lg:flex-col lg:justify-center",
            isArabic ? "lg:order-2" : "lg:order-1",
          )}
          dir={direction}
        >
          <h2
            id="join-application-heading"
            className="text-3xl font-extrabold tracking-tight lg:text-[2.5rem]"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-base leading-8 text-white/85 lg:text-[1.15rem] lg:leading-relaxed">
            {content.description}
          </p>
          <ul className="mt-8 space-y-5">
            {content.benefits.map((benefit, index) => {
              const Icon = benefitIcons[index] ?? Clock3;

              return (
                <li
                  key={benefit}
                  className="flex items-center gap-3 text-base font-bold"
                >
                  <Icon
                    className="size-7 shrink-0 text-primary"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  {benefit}
                </li>
              );
            })}
          </ul>
          <div className="mt-8 border-t border-white/15 pt-6 text-xs leading-7 text-white/70">
            {content.note}
          </div>
        </aside>
      </div>
    </section>
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
  type = "text",
  placeholder,
  icon: Icon,
  form,
  locale,
  className,
}: {
  name: TextFieldName;
  label: string;
  type?: string;
  placeholder?: string;
  icon: typeof UserRound;
  form: ReturnType<typeof useForm<JoinApplicationFormValues>>;
  locale: "ar" | "en";
  className?: string;
}) {
  const error = form.formState.errors[name];
  return (
    <div className={className} dir={getLocaleDirection(locale)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <div className="mt-2 flex h-12 items-center rounded-full border border-input bg-card px-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          {...form.register(name)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/70"
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      <FieldError id={`${name}-error`}>{error?.message}</FieldError>
    </div>
  );
}

function SelectField({
  name,
  label,
  placeholder,
  options,
  form,
  locale,
  className,
}: {
  name: "experienceYears" | "transportType";
  label: string;
  placeholder: string;
  options: readonly string[];
  form: ReturnType<typeof useForm<JoinApplicationFormValues>>;
  locale: "ar" | "en";
  className?: string;
}) {
  const error = form.formState.errors[name];
  return (
    <div className={className} dir={getLocaleDirection(locale)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              id={name}
              aria-invalid={!!error}
              aria-describedby={error ? `${name}-error` : undefined}
              className="mt-2 !h-12 w-full rounded-full border-input bg-card px-3 text-sm"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent dir={getLocaleDirection(locale)}>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError id={`${name}-error`}>{error?.message}</FieldError>
    </div>
  );
}

function FileField({
  name,
  label,
  icon: Icon,
  hint,
  form,
  locale,
  className,
}: {
  name: "nationalId" | "drivingLicense";
  label: string;
  icon: typeof IdCard;
  hint: string;
  form: ReturnType<typeof useForm<JoinApplicationFormValues>>;
  locale: "ar" | "en";
  className?: string;
}) {
  const error = form.formState.errors[name];
  const file = form.watch(name);
  return (
    <div className={className} dir={getLocaleDirection(locale)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <label
        htmlFor={name}
        className={cn(
          "mt-2 flex h-12 cursor-pointer items-center gap-3 rounded-full border border-dashed border-input bg-card px-3 text-sm transition-colors hover:border-primary",
          error && "border-destructive",
        )}
      >
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {typeof File !== "undefined" && file instanceof File
            ? file.name
            : hint}
        </span>
        <input
          id={name}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="sr-only"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (!selected) return;
            form.setValue(name, selected, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </label>
      <FieldError id={`${name}-error`}>{error?.message}</FieldError>
    </div>
  );
}
