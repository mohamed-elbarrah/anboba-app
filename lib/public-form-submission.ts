export type PublicSubmissionResponse =
  | { ok: true; id: string; successMessage: string }
  | { ok: false; code: string; message: string; fields?: Record<string, string> };

export async function submitPublicForm(
  formKey: string,
  locale: "ar" | "en",
  data: FormData,
): Promise<PublicSubmissionResponse> {
  data.set("locale", locale);
  const response = await fetch(`/api/forms/${encodeURIComponent(formKey)}/submit?locale=${locale}`, {
    method: "POST",
    body: data,
    headers: { "idempotency-key": crypto.randomUUID() },
  });
  const result = (await response.json().catch(() => null)) as PublicSubmissionResponse | null;
  if (!result) return { ok: false, code: "INVALID_RESPONSE", message: locale === "ar" ? "تعذر إرسال النموذج" : "The form could not be submitted" };
  return result;
}

export function setSubmissionErrors<T extends Record<string, unknown>>(
  result: PublicSubmissionResponse,
  setError: (name: string, error: { type: string; message: string }) => void,
  setGeneralError: (message: string) => void,
) {
  if (result.ok) return;
  if (result.fields) for (const [field, message] of Object.entries(result.fields)) setError(field as keyof T & string, { type: "server", message });
  setGeneralError(result.message);
}
