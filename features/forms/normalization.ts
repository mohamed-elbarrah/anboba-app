import { eq } from "drizzle-orm";
import { formFieldLocalizations, formFieldOptionLocalizations, formFieldOptions, formRevisionCopy, formRevisionFields, formRevisions } from "@/db/schema";
import { normalizedFromConfig } from "./normalized";
import type { FormRendererKey } from "./registry-core";
import { getDb } from "@/db";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
/** Inserts one complete normalized projection for an immutable revision. */
export async function writeNormalizedRevision(tx: Tx, revisionId: bigint, rendererKey: FormRendererKey, locale: "ar" | "en", config: unknown) {
  const normalized = normalizedFromConfig(rendererKey, config, locale);
  await tx.update(formRevisions).set({ rendererMode: normalized.rendererMode, templateKey: normalized.templateKey }).where(eq(formRevisions.id, revisionId));
  const inserted = new Map<string, bigint>();
  for (const field of normalized.fields) {
    const result = await tx.insert(formRevisionFields).values({ revisionId, fieldKey: field.key, fieldType: field.type, sortOrder: field.sortOrder, required: field.required, validationPreset: field.validationPreset, width: field.width });
    const fieldId = BigInt(result[0].insertId); inserted.set(field.key, fieldId);
    const loc = normalized.localizations.find((item) => item.fieldKey === field.key);
    if (loc) await tx.insert(formFieldLocalizations).values({ fieldId, revisionId, locale, label: loc.label, placeholder: loc.placeholder, helpText: loc.helpText, validationMessage: loc.validationMessage });
    for (const option of normalized.options[field.key] ?? []) {
      const optionResult = await tx.insert(formFieldOptions).values({ fieldId, optionKey: option.key, sortOrder: option.sortOrder });
      await tx.insert(formFieldOptionLocalizations).values({ optionId: BigInt(optionResult[0].insertId), fieldId, locale, label: option.label });
    }
  }
  void inserted;
  await tx.insert(formRevisionCopy).values({ revisionId, submitLabel: normalized.copy.submitLabel, successMessage: normalized.copy.successMessage, errorMessage: normalized.copy.errorMessage });
}
