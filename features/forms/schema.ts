/** Public/client-safe form transport schemas and DTO types. */
export {
  formDefinitionSchema,
  formRevisionSchema,
  FORM_RENDERER_KEYS,
  normalizedFieldTypes,
  normalizedFieldSchema,
  genericCreateConfigSchema,
  bilingualGenericCreateConfigSchema,
} from "./client-schema";
export type FormDefinitionInput = import("./client-schema").FormDefinitionInput;
export type FormRevisionInput = import("./client-schema").FormRevisionInput;
export type FormDefinitionDTO = {
  id: string;
  formKey: string;
  rendererKey: (typeof import("./client-schema").FORM_RENDERER_KEYS)[number];
  kind: "system" | "user";
  archived: boolean;
  /** Stable public preview target for forms with a routed public renderer. */
  publicPreviewUrl: string | null;
};
export type FormRevisionDTO = {
  id: string;
  formId: string;
  locale: "ar" | "en";
  revisionNumber: number;
  status: "draft" | "published";
  config: unknown;
  createdAt: string;
  updatedAt: string;
};
