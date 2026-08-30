import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().trim().min(3, "يرجى إدخال الاسم الثلاثي.").max(100, "الاسم طويل جدًا."),
  phone: z
    .string()
    .trim()
    .regex(/^(?:05\d{8}|5\d{8})$/, "يرجى إدخال رقم جوال سعودي صحيح."),
  message: z.string().trim().min(10, "يرجى كتابة رسالتك.").max(1000, "الرسالة طويلة جدًا."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export type ContactContent = {
  eyebrow: string;
  headingStart: string;
  headingHighlight: string;
  description: string;
  details: readonly {
    kind: "phone" | "email" | "location" | "hours";
    value: string;
    href?: string;
  }[];
  fields: {
    fullName: string;
    phone: string;
    message: string;
  };
  placeholders: {
    fullName: string;
    phone: string;
    message: string;
  };
  countryCode: string;
  countryLabel: string;
  submit: string;
  success: string;
};
