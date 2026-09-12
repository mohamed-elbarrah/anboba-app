const labels = {
  contact: { ar: "نموذج التواصل", en: "Contact form" },
  join_application: { ar: "طلب الانضمام", en: "Join application" },
  partner_registration: { ar: "تسجيل الشركاء", en: "Partner registration" },
} as const;

export function getSubmissionFormLabel(formKey: string, ar: boolean) {
  return labels[formKey as keyof typeof labels]?.[ar ? "ar" : "en"] ?? formKey;
}
