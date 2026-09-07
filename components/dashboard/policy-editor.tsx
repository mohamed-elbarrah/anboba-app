"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePolicyDraft, publishPolicy } from "@/features/policies/actions";
import type { PolicyDocument } from "@/features/policies/types";

export function PolicyEditor({ initial }: { initial?: PolicyDocument }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [message, setMessage] = useState("");
  const editor = useEditor({ extensions: [StarterKit, Link.configure({ openOnClick: false })], content: (initial?.content ?? { type: "doc", content: [{ type: "paragraph" }] }) as never, immediatelyRender: false });
  if (!editor) return null;
  const activeEditor = editor;
  async function submit(publish: boolean) {
    const result = await (publish ? publishPolicy : savePolicyDraft)({ id: initial?.id, locale: initial?.locale ?? "ar", slug, title, summary, content: activeEditor.getJSON() as never, revisionToken: initial?.revisionToken });
    setMessage(result.ok ? "تم حفظ السياسة بنجاح" : result.message);
  }
  return <div className="max-w-4xl space-y-6"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">العنوان<Input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="space-y-2 text-sm font-medium">المعرف (slug)<Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="privacy" /></label></div><label className="block space-y-2 text-sm font-medium">الملخص<textarea value={summary} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(event.target.value)} rows={4} className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" /></label><div className="space-y-3"><div className="flex flex-wrap gap-2 border-b pb-3"><Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBold().run()}>عريض</Button><Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}>مائل</Button><Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>عنوان قسم</Button><Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}>قائمة</Button></div><div className="min-h-80 rounded-lg border bg-card p-4 [&_.ProseMirror]:min-h-72 [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_p]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ps-6"><EditorContent editor={editor} /></div></div><div className="flex gap-3"><Button type="button" onClick={() => submit(false)}>حفظ كمسودة</Button>{initial?.id && <Button type="button" variant="outline" onClick={() => submit(true)}>نشر</Button>}</div>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</div>;
}
