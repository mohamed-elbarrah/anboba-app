import { z } from "zod";
import { contactSchema, joinApplicationSchema, partnerRegistrationSchema } from "@/features/pages/content-schemas";
import { genericFieldSchema } from "./client-schema";
export { genericFieldTypes, genericValidationPresets, genericFieldWidths } from "./client-schema";
import type { ContactContent } from "@/features/contact/schema";
import type { JoinApplicationContent } from "@/features/join-us/schema";
import type { PartnerRegistrationContent } from "@/features/join-us/partner-registration";

export const FORM_RENDERER_KEYS = ["contact", "join_application", "partner_registration", "generic"] as const;
export type FormRendererKey = (typeof FORM_RENDERER_KEYS)[number];
export const BUILT_IN_FORM_KEYS = ["contact", "join_application", "partner_registration"] as const;
export type BuiltInFormKey = (typeof BUILT_IN_FORM_KEYS)[number];

/** Generic builder types. `file` is intentionally absent: it is a protected legacy-only field. */


/** The only executable renderer values known to the application. */
export const formRendererRegistry = {
  contact: { key: "contact", kind: "system", public: true, config: contactSchema },
  join_application: { key: "join_application", kind: "system", public: true, config: joinApplicationSchema },
  partner_registration: { key: "partner_registration", kind: "system", public: true, config: partnerRegistrationSchema },
  // Reserved for future dashboard-created forms; deliberately not a public renderer yet.
  generic: { key: "generic", kind: "user", public: false, config: z.object({
    fields: z.array(genericFieldSchema).min(1).max(50),
    submit: z.string().trim().min(1).max(255),
    success: z.string().trim().min(1).max(1000),
  }).strict() },
} as const;

export const formConfigSchema = z.discriminatedUnion("rendererKey", [
  z.object({ rendererKey: z.literal("contact"), config: contactSchema }),
  z.object({ rendererKey: z.literal("join_application"), config: joinApplicationSchema }),
  z.object({ rendererKey: z.literal("partner_registration"), config: partnerRegistrationSchema }),
  z.object({ rendererKey: z.literal("generic"), config: formRendererRegistry.generic.config }),
]);

export const formConfigSchemas = {
  contact: contactSchema,
  join_application: joinApplicationSchema,
  partner_registration: partnerRegistrationSchema,
  generic: formRendererRegistry.generic.config,
} as const;
export type FormConfig = ContactContent | JoinApplicationContent | PartnerRegistrationContent | z.infer<typeof formRendererRegistry.generic.config>;
export function isBuiltInFormKey(key: string): key is BuiltInFormKey { return (BUILT_IN_FORM_KEYS as readonly string[]).includes(key); }
export function parseFormConfig(renderer: FormRendererKey, value: unknown): FormConfig { return formConfigSchemas[renderer].parse(value) as FormConfig; }
export function publicRendererKey(renderer: string): Exclude<FormRendererKey, "generic"> | null {
  return renderer === "contact" || renderer === "join_application" || renderer === "partner_registration" ? renderer : null;
}
