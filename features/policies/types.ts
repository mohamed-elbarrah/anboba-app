import type { Locale } from "@/lib/locales";
import type { RichTextDocument } from "./content-schema";

export type PolicyDocument = {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  content: RichTextDocument;
  revisionId: string;
  revisionToken: string;
  status: "draft" | "published";
  updatedAt: string;
};

export type PolicyListItem = Pick<PolicyDocument, "id" | "locale" | "slug" | "title" | "status" | "updatedAt"> & { published: boolean };
