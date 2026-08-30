import { z } from "zod";

export type ContactValidationMessages = {
  fullNameMin: string; fullNameMax: string; phone: string; messageMin: string; messageMax: string;
};

export function createContactSchema(messages: ContactValidationMessages) {
  return z.object({
    fullName: z.string().trim().min(3, messages.fullNameMin).max(100, messages.fullNameMax),
    phone: z.string().trim().regex(/^(?:05\d{8}|5\d{8})$/, messages.phone),
    message: z.string().trim().min(10, messages.messageMin).max(1000, messages.messageMax),
  });
}

export const contactSchema = createContactSchema({ fullNameMin: "Please enter your full name.", fullNameMax: "Name is too long.", phone: "Please enter a valid Saudi mobile number.", messageMin: "Please write your message.", messageMax: "Message is too long." });

export type ContactFormValues = z.infer<typeof contactSchema>;

export type ContactContent = {
  validation: ContactValidationMessages;
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
