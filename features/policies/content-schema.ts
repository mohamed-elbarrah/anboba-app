import "server-only";
import { z } from "zod";

const allowedNodes = ["doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "blockquote", "horizontalRule"] as const;
const allowedMarks = ["bold", "italic", "link"] as const;

const richTextNode: z.ZodType<unknown> = z.lazy(() => z.object({
  type: z.enum(allowedNodes),
  attrs: z.record(z.string(), z.unknown()).optional(),
  text: z.string().max(20_000).optional(),
  marks: z.array(z.object({ type: z.enum(allowedMarks), attrs: z.object({ href: z.string().max(2_000).optional() }).optional() })).max(3).optional(),
  content: z.array(richTextNode).max(2_000).optional(),
}).superRefine((node, context) => {
  const value = node as { type: string; text?: string; content?: unknown[]; marks?: { type: string; attrs?: { href?: string } }[] };
  if (value.type === "text" && !value.text) context.addIssue({ code: "custom", message: "Text nodes must contain text" });
  if (value.type !== "text" && value.text) context.addIssue({ code: "custom", message: "Only text nodes may contain text" });
  if (value.marks?.some((mark) => mark.type === "link" && (!mark.attrs?.href || !/^https:\/\/|^\//.test(mark.attrs.href)))) context.addIssue({ code: "custom", message: "Only HTTPS and relative links are allowed" });
}));

export const richTextSchema = z.object({ type: z.literal("doc"), content: z.array(richTextNode).max(2_000) }).superRefine((value, context) => {
  const serialized = JSON.stringify(value);
  if (serialized.length > 500_000) context.addIssue({ code: "custom", message: "Content is too large" });
  function depth(node: unknown, current: number): number {
    if (!node || typeof node !== "object") return current;
    const content = (node as { content?: unknown[] }).content;
    return content?.length ? Math.max(...content.map((child) => depth(child, current + 1))) : current;
  }
  if (depth(value, 0) > 12) context.addIssue({ code: "custom", message: "Content is too deeply nested" });
});

export type RichTextDocument = z.infer<typeof richTextSchema>;
export const policyInputSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/).optional(),
  locale: z.enum(["ar", "en"]),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  title: z.string().trim().min(1).max(255),
  summary: z.string().trim().min(1).max(10_000),
  content: richTextSchema,
  revisionToken: z.string().regex(/^[1-9]\d*$/).optional(),
});
export type PolicyInput = z.infer<typeof policyInputSchema>;
export const emptyRichText: RichTextDocument = { type: "doc", content: [{ type: "paragraph" }] };
