import { z } from "zod";

const saudiPhone = /^(?:05|5)\d{8}$/;

/** The lightweight distributor registration contract. It intentionally has no persistence concerns. */
export type PartnerValidationMessages = { company: string; phone: string; email: string; city: string };

export function createPartnerRegistrationSchema(messages: PartnerValidationMessages) {
  return z.object({
    company: z.string().trim().min(1, messages.company),
    phone: z.string().trim().regex(saudiPhone, messages.phone),
    email: z.string().trim().refine((value) => value === "" || z.string().email().safeParse(value).success, messages.email),
    city: z.string().trim().min(1, messages.city),
  });
}

export const partnerRegistrationSchema = createPartnerRegistrationSchema({ company: "Please enter the company name.", phone: "Please enter a valid Saudi mobile number.", email: "Please enter a valid email address.", city: "Please enter your city." });

export type PartnerRegistrationFormValues = z.infer<typeof partnerRegistrationSchema>;

export type PartnerRegistrationContent = {
  validation: PartnerValidationMessages;
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
