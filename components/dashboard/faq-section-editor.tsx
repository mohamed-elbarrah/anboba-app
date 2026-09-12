"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Locale = "ar" | "en";
type FaqItem = { question: string; answer: string };
type FaqContent = { eyebrow: string; heading: string; description: string; items: FaqItem[] };

const labels = {
  ar: {
    title: "الأسئلة الشائعة",
    description: "أدر عنوان الصفحة وقائمة الأسئلة والأجوبة الظاهرة للزوار.",
    eyebrow: "النص التمهيدي",
    heading: "العنوان",
    intro: "الوصف",
    items: "الأسئلة والأجوبة",
    itemDescription: "يمكنك إضافة الأسئلة وترتيبها وتعديل إجاباتها.",
    question: "السؤال",
    answer: "الإجابة",
    add: "إضافة سؤال",
    remove: "حذف السؤال",
    moveUp: "نقل لأعلى",
    moveDown: "نقل لأسفل",
    item: "السؤال",
  },
  en: {
    title: "FAQ content",
    description: "Manage the page heading and the questions and answers shown to visitors.",
    eyebrow: "Eyebrow",
    heading: "Heading",
    intro: "Description",
    items: "Questions and answers",
    itemDescription: "Add, reorder, and edit the FAQ items.",
    question: "Question",
    answer: "Answer",
    add: "Add question",
    remove: "Remove question",
    moveUp: "Move up",
    moveDown: "Move down",
    item: "Question",
  },
} as const;

export function FaqSectionEditor({ section, locale, update }: { section: { content: unknown }; locale: Locale; update: (content: unknown) => void }) {
  const t = labels[locale];
  const source = section.content && typeof section.content === "object" ? section.content as Partial<FaqContent> : {};
  const content: FaqContent = {
    eyebrow: String(source.eyebrow ?? ""),
    heading: String(source.heading ?? ""),
    description: String(source.description ?? ""),
    items: Array.isArray(source.items) ? source.items.map((item) => ({ question: String(item?.question ?? ""), answer: String(item?.answer ?? "") })) : [],
  };

  const set = (changes: Partial<FaqContent>) => update({ ...content, ...changes });
  const updateItem = (index: number, changes: Partial<FaqItem>) => {
    const items = content.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item);
    set({ items });
  };
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= content.items.length) return;
    const items = [...content.items];
    [items[index], items[target]] = [items[target], items[index]];
    set({ items });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            {t.eyebrow}
            <Input value={content.eyebrow} onChange={(event) => set({ eyebrow: event.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            {t.heading}
            <Input value={content.heading} onChange={(event) => set({ heading: event.target.value })} />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm font-medium">
          {t.intro}
          <textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" value={content.description} onChange={(event) => set({ description: event.target.value })} />
        </label>

        <section className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 shadow-sm" aria-labelledby="faq-items-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 id="faq-items-heading" className="font-semibold">{t.items}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{content.items.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.itemDescription}</p>
            </div>
            <Button type="button" size="sm" onClick={() => set({ items: [...content.items, { question: "", answer: "" }] })}>
              <Plus className="size-4" />
              {t.add}
            </Button>
          </div>
          <div className="space-y-4">
            {content.items.map((item, index) => (
              <fieldset key={index} className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <legend className="px-1 text-sm font-semibold"><span className="rounded-full bg-muted px-2.5 py-1">{t.item} {index + 1}</span></legend>
                <label className="block space-y-1.5 text-sm font-medium">
                  {t.question}
                  <Input value={item.question} onChange={(event) => updateItem(index, { question: event.target.value })} />
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  {t.answer}
                  <textarea className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-7 transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15" value={item.answer} onChange={(event) => updateItem(index, { answer: event.target.value })} />
                </label>
                <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-3">
                  <Button type="button" variant="outline" size="icon-sm" disabled={index === 0} title={t.moveUp} aria-label={t.moveUp} onClick={() => moveItem(index, -1)}><ArrowUp className="size-4" /></Button>
                  <Button type="button" variant="outline" size="icon-sm" disabled={index === content.items.length - 1} title={t.moveDown} aria-label={t.moveDown} onClick={() => moveItem(index, 1)}><ArrowDown className="size-4" /></Button>
                  <Button type="button" variant="destructive" size="sm" disabled={content.items.length <= 1} onClick={() => set({ items: content.items.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4" />{t.remove}</Button>
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
