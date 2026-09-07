import { NextResponse } from "next/server";
import { submitForm } from "@/features/submissions/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  return Boolean(host && origin === `${new URL(request.url).protocol}//${host}`);
}

export async function POST(request: Request, context: { params: Promise<{ formKey: string }> }) {
  const { formKey } = await context.params;
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, code: "INVALID_ORIGIN", message: "Invalid request" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 12 * 1024 * 1024) return NextResponse.json({ ok: false, code: "REQUEST_TOO_LARGE", message: "Request is too large" }, { status: 413 });
  const url = new URL(request.url);
  const requestedLocale = url.searchParams.get("locale");
  const token = request.headers.get("idempotency-key") || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  try {
    const formData = await request.formData();
    const locale = requestedLocale === "en" || formData.get("locale") === "en" ? "en" : "ar";
    const result = await submitForm({ formKey, locale, formData, idempotencyToken: token, ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown", userAgent: request.headers.get("user-agent") });
    return NextResponse.json(result, { status: result.ok ? 200 : result.code === "RATE_LIMITED" ? 429 : result.code === "NOT_FOUND" ? 404 : result.code === "VALIDATION_ERROR" ? 422 : 400 });
  } catch (error) {
    console.error("[submission:route]", error);
    return NextResponse.json({ ok: false, code: "INVALID_REQUEST", message: "Invalid submission" }, { status: 400 });
  }
}
