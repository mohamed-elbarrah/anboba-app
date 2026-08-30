import { z } from "zod";

const saudiPhone = /^(?:05|5)\d{8}$/;

/** The lightweight distributor registration contract. It intentionally has no persistence concerns. */
export const partnerRegistrationSchema = z.object({
  company: z.string().trim().min(1, "يرجى إدخال اسم الشركة."),
  phone: z.string().trim().regex(saudiPhone, "يرجى إدخال رقم جوال سعودي صحيح."),
  email: z.string().trim().refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "يرجى إدخال بريد إلكتروني صحيح.",
  ),
  city: z.string().trim().min(1, "يرجى إدخال المدينة."),
});

export type PartnerRegistrationFormValues = z.infer<typeof partnerRegistrationSchema>;

export type PartnerRegistrationContent = {
  eyebrow: string;
  headingStart: string;
  headingHighlight: string;
  description: string;
  fields: {
    company: string;
    phone: string;
    email: string;
    city: string;
  };
  placeholders: {
    company: string;
    phone: string;
    email: string;
    city: string;
  };
  countryCode: string;
  countryLabel: string;
  cityOptions: readonly string[];
  submit: string;
  success: string;
};
