"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adaptNormalizedForm, type PublicFlexibleForm, type PublicFormField } from "@/features/forms/renderer-adapter";
import { cn } from "@/lib/utils";
import { validatePresetValue, validationMessage } from "@/features/forms/validation";

type FormValue = string | string[] | FileList;
type FormValues = Record<string, FormValue>;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf";

export function FlexibleFormRenderer({ definition, locale }: { definition: unknown; locale: "ar" | "en" }) {
  const model = adaptNormalizedForm(definition, locale);
  if (!model) return null;
  return <FlexibleForm model={model} locale={locale} />;
}

function FlexibleForm({ model, locale }: { model: PublicFlexibleForm; locale: "ar" | "en" }) {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({ mode: "onBlur", defaultValues: Object.fromEntries(model.fields.map((field) => [field.key, field.type === "checkbox" ? [] : ""])) });
  if (submitted) return <div role="status" className="flex min-h-56 items-center justify-center rounded-3xl bg-primary/10 p-8 text-center text-lg font-bold leading-8 text-foreground">{model.successMessage}</div>;
  const direction = locale === "ar" ? "rtl" : "ltr";
  return <form noValidate dir={direction} onSubmit={form.handleSubmit(() => { setSubmitted(true); form.reset(); })} className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">{model.fields.some(field => field.type === "file") && <p className="sm:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900">{locale === "ar" ? "حقول الملفات للعرض القديم فقط؛ لا يتم رفع الملفات أو تخزينها في الوضع المرن." : "File fields are legacy presentation only; flexible mode does not upload or store files."}</p>}
    {model.fields.map((field) => <Field key={field.key} field={field} form={form} locale={locale} />)}
    <div className="pt-2 sm:col-span-2"><Button type="submit" size="lg" className="mx-auto block h-14 w-full max-w-[255px] rounded-full text-base font-extrabold shadow-lg shadow-primary/25">{model.submitLabel}</Button></div>
  </form>;
}

function Field({ field, form, locale }: { field: PublicFormField; form: ReturnType<typeof useForm<FormValues>>; locale: "ar" | "en" }) {
  const error = form.formState.errors[field.key];
  const id = `flexible-${field.key}`;
  const rules = { required: field.required ? (field.validationMessage || validationMessage(field.validationPreset, locale) || field.label) : false, validate: (value: FormValue) => validatePreset(field, value, locale) };
  const width = field.width === "full" ? "sm:col-span-2" : field.width === "third" ? "sm:col-span-1 lg:col-span-1" : "sm:col-span-1";
  return <div className={cn(width)}><label htmlFor={id} className="block text-sm font-bold text-foreground">{field.label}</label>
    {field.type === "file" ? <Input id={id} type="file" accept={FILE_ACCEPT} {...form.register(field.key, { required: field.required ? (field.validationMessage || validationMessage(field.validationPreset, locale) || field.label) : false, validate: (value: FormValue) => validateFile(value, locale) })} className={cn("mt-2 h-12 rounded-full border-white bg-white/55 px-4", error && "border-destructive")} /> : field.type === "textarea" ? <textarea id={id} rows={4} placeholder={field.placeholder ?? undefined} {...form.register(field.key, rules)} className={cn("mt-2 min-h-24 w-full resize-y rounded-xl border border-white bg-white/55 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/20", error && "border-destructive")} /> : field.type === "select" ? <select id={id} {...form.register(field.key, rules)} className={cn("mt-2 h-12 w-full rounded-full border border-white bg-white/55 px-4 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/20", error && "border-destructive")}><option value="">{field.placeholder ?? (locale === "ar" ? "اختر" : "Choose")}</option>{field.options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select> : field.type === "radio" || field.type === "checkbox" ? <ChoiceField field={field} form={form} locale={locale} /> : <Input id={id} type={field.type === "phone" ? "tel" : field.type} inputMode={field.type === "phone" ? "tel" : undefined} placeholder={field.placeholder ?? undefined} {...form.register(field.key, rules)} className={cn("mt-2 h-12 rounded-full border-white bg-white/55 px-4", error && "border-destructive")} />}
    {field.helpText && <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>}{error?.message && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{String(error.message)}</p>}
  </div>;
}

function ChoiceField({ field, form, locale }: { field: PublicFormField; form: ReturnType<typeof useForm<FormValues>>; locale: "ar" | "en" }) {
  return <div className="mt-2 grid gap-2 rounded-2xl border border-white bg-white/55 p-3">{field.options.map((option) => <label key={option.key} className="flex items-center gap-2 text-sm"><input type={field.type} value={option.key} {...form.register(field.key, { required: field.required ? field.validationMessage || validationMessage(field.validationPreset, locale) || field.label : false })} />{option.label}</label>)}</div>;
}

function validateFile(value: FormValue, locale: "ar" | "en") {
  if (!(value instanceof FileList) || value.length === 0) return true;
  const file = value[0];
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(file.type) || !/\.(jpe?g|png|pdf)$/i.test(file.name)) return locale === "ar" ? "يرجى اختيار JPG أو PNG أو PDF" : "Choose a JPG, PNG, or PDF file";
  if (file.size > MAX_FILE_SIZE) return locale === "ar" ? "يجب ألا يتجاوز حجم الملف 5MB" : "File must be no larger than 5MB";
  return true;
}

function validatePreset(field: PublicFormField, value: FormValue, locale: "ar" | "en") {
  if (value instanceof FileList) return true;
  return validatePresetValue(field, value, locale);
}
