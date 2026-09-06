import type { PublicFormField } from "./renderer-adapter";

export type ValidationLocale = "ar" | "en";
const messages: Record<ValidationLocale, Record<string, string>> = {
  ar: { email: "يرجى إدخال بريد إلكتروني صحيح", phone: "يرجى إدخال رقم هاتف صحيح", fullNameMin: "يجب أن يتكون الاسم من حرفين على الأقل", fullNameMax: "الاسم طويل جداً", messageMin: "الرسالة قصيرة جداً", messageMax: "الرسالة طويلة جداً", city: "يرجى اختيار مدينة صحيحة", experience: "يرجى اختيار الخبرة", transport: "يرجى اختيار وسيلة النقل", company: "يرجى إدخال اسم الشركة", nationalId: "يرجى إرفاق الهوية الوطنية", drivingLicense: "يرجى إرفاق رخصة القيادة", fileSize: "يجب ألا يتجاوز حجم الملف 5MB", fileType: "نوع الملف غير مسموح" },
  en: { email: "Enter a valid email address", phone: "Enter a valid phone number", fullNameMin: "Name must be at least 2 characters", fullNameMax: "Name is too long", messageMin: "Message is too short", messageMax: "Message is too long", city: "Choose a valid city", experience: "Choose an experience level", transport: "Choose a transport option", company: "Enter a company name", nationalId: "Attach a national ID", drivingLicense: "Attach a driving licence", fileSize: "File must be no larger than 5MB", fileType: "This file type is not allowed" },
};
export function validationMessage(preset: string | null, locale: ValidationLocale, custom?: string | null) {
  if (custom) return custom;
  return preset ? messages[locale][preset.replace("validation.", "")] : undefined;
}
export function validatePresetValue(field: Pick<PublicFormField, "validationPreset" | "validationMessage" | "label">, value: unknown, locale: ValidationLocale) {
  if (!value || (Array.isArray(value) && value.length === 0)) return true;
  const text = Array.isArray(value) ? value.join(",") : String(value);
  const preset = field.validationPreset;
  let valid = true;
  if (preset === "validation.email") valid = /^\S+@\S+\.\S+$/.test(text);
  else if (preset === "validation.phone") valid = /^[+\d][\d\s()-]{6,}$/.test(text);
  else if (preset === "validation.fullNameMin") valid = text.trim().length >= 2;
  else if (preset === "validation.fullNameMax") valid = text.trim().length <= 100;
  else if (preset === "validation.messageMin") valid = text.trim().length >= 10;
  else if (preset === "validation.messageMax") valid = text.trim().length <= 5000;
  else if (preset === "validation.city" || preset === "validation.experience" || preset === "validation.transport") valid = text.trim().length > 0;
  else if (preset === "validation.company") valid = text.trim().length >= 2 && text.trim().length <= 255;
  // File presets are independently checked by the protected file control.
  else if (preset === "validation.nationalId" || preset === "validation.drivingLicense" || preset === "validation.fileSize" || preset === "validation.fileType") valid = true;
  return valid ? true : validationMessage(preset, locale, field.validationMessage) ?? (locale === "ar" ? "القيمة غير صحيحة" : "This value is invalid");
}
