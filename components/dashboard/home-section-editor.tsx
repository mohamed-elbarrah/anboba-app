"use client";

import { ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MediaPicker } from "@/components/dashboard/media-picker";
import type { MediaItem } from "@/features/media/types";
import type { SectionKey } from "@/features/pages/types";

type Data = Record<string, unknown>;
type HomeSection = { key: SectionKey; content: unknown };

const text = (data: Data, key: string) => String(data[key] ?? "");

function TextField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{multiline ? <textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} /> : <Input value={value} onChange={(e) => onChange(e.target.value)} />}</label>;
}

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader><CardContent className="space-y-4">{children}</CardContent></Card>;
}

function Fields({ data, names, update, multiline = [] }: { data: Data; names: string[]; update: (data: Data) => void; multiline?: string[] }) {
  return <div className="grid gap-4 md:grid-cols-2">{names.map((name) => <TextField key={name} label={name} value={text(data, name)} multiline={multiline.includes(name)} onChange={(value) => update({ ...data, [name]: value })} />)}</div>;
}

function Items({ data, name, count, fields, update }: { data: Data; name: string; count: number; fields: string[]; update: (data: Data) => void }) {
  const items = Array.isArray(data[name]) ? (data[name] as Data[]) : [];
  return <div className="space-y-3">{Array.from({ length: count }, (_, index) => <div key={index} className="rounded-lg border bg-muted/20 p-4"><p className="mb-3 text-sm font-semibold">{name} {index + 1}</p><div className="grid gap-3 md:grid-cols-2">{fields.map((field) => <TextField key={field} label={field} value={text(items[index] ?? {}, field)} multiline={field.toLowerCase().includes("description")} onChange={(value) => { const next = [...items]; next[index] = { ...(next[index] ?? {}), [field]: value }; update({ ...data, [name]: next }); }} />)}</div></div>)}</div>;
}

function GuaranteeItems({ values, start, label, onChange }: { values: unknown[]; start: number; label: string; onChange: (values: unknown[]) => void }) {
  return <div className="space-y-3">{[0, 1].map((offset) => <div key={offset} className="rounded-lg border bg-muted/20 p-4"><p className="mb-3 text-sm font-semibold">Card {start + offset + 1}</p><div className="space-y-3"><p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Shared small label: <strong>{label || "—"}</strong> (edit it in Showcase above)</p><TextField label="Title / paragraph" value={String(values[start + offset] ?? "")} onChange={(value) => { const next = [...values]; next[start + offset] = value; onChange(next); }} /></div></div>)}</div>;
}

function StringItems({ data, name, count, update }: { data: Data; name: string; count: number; update: (data: Data) => void }) {
  const values = Array.isArray(data[name]) ? data[name] as unknown[] : [];
  return <div className="space-y-3">{Array.from({ length: count }, (_, index) => <TextField key={index} label={`${name} ${index + 1}`} value={String(values[index] ?? "")} onChange={(value) => { const next = [...values]; next[index] = value; update({ ...data, [name]: next }); }} />)}</div>;
}

function NestedGroup({ data, name, update }: { data: Data; name: string; update: (data: Data) => void }) {
  const nested = (data[name] ?? {}) as Data;
  return <div className="rounded-lg border bg-muted/20 p-4"><p className="mb-3 font-semibold">{name}</p><Fields data={nested} names={["heading", "description", "cta", "href"]} update={(next) => update({ ...data, [name]: next })} multiline={["description"]} /></div>;
}

export function HomeSectionEditor({ section, media, update }: { section: HomeSection; media: readonly MediaItem[]; update: (content: unknown) => void }) {
  const data = (section.content ?? {}) as Data;
  const set = (next: Data) => update(next);
  switch (section.key) {
    case "hero": {
      const showcase = (data.showcase ?? {}) as Data;
      const guarantees = Array.isArray(showcase.guarantees) ? showcase.guarantees : [];
      const setShowcase = (next: Data) => set({ ...data, showcase: next });
      return <div className="space-y-4">
        <Group title="Hero content" description="Edit the text in the same order it appears above the showcase."><Fields data={data} names={["headingStart", "headingHighlightGas", "headingMiddle", "headingHighlightHome", "description", "cta"]} update={set} multiline={["description"]} /></Group>
        <Group title="Showcase" description="The public layout has two cards and one phone image on each side."><Fields data={showcase} names={["heading", "guaranteeLabel"]} update={setShowcase} /></Group>
        <div className="grid gap-4 xl:grid-cols-2">
          {[{ side: "Left showcase", id: "phoneLeftMediaId", url: "phoneLeftImageUrl", alt: "phoneLeftAlt", start: 0 }, { side: "Right showcase", id: "phoneRightMediaId", url: "phoneRightImageUrl", alt: "phoneRightAlt", start: 2 }].map((slot) => <Card key={slot.id}><CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="size-4" />{slot.side}</CardTitle><CardDescription>Each side contains two public guarantee cards and one phone mockup.</CardDescription></CardHeader><CardContent className="space-y-4"><MediaPicker items={media} selectedId={text(showcase, slot.id) || null} externalUrl={text(showcase, slot.url) || null} fallbackUrl={slot.start === 0 ? "/images/hero/left-phone.png" : "/images/hero/right-phone.png"} label="Phone/mockup image" onChange={(selection) => setShowcase({ ...showcase, [slot.id]: selection.mediaId ?? "", [slot.url]: selection.externalUrl ?? "" })} /><TextField label="Image alt text" value={text(showcase, slot.alt)} onChange={(value) => setShowcase({ ...showcase, [slot.alt]: value })} /><GuaranteeItems values={guarantees} start={slot.start} label={text(showcase, "guaranteeLabel")} onChange={(next) => setShowcase({ ...showcase, guarantees: next })} /></CardContent></Card>)}
        </div>
      </div>;
    }
    case "service_overview": return <Group title="Service overview"><Fields data={data} names={["highlightedHeading", "primaryHeadingStart", "primaryHeadingHighlight", "description", "imageAlt"]} update={set} multiline={["description"]} /></Group>;
    case "statistics": return <Group title="Statistics"><Fields data={data} names={["heading"]} update={set} /><Items data={data} name="items" count={4} fields={["value", "label"]} update={set} /></Group>;
    case "why_choose_us": return <Group title="Why choose us"><Fields data={data} names={["eyebrow", "headingStart", "headingHighlight", "subtitle", "cardHeading", "cardParagraph", "featuresHeading", "imageAlt"]} update={set} multiline={["subtitle", "cardParagraph"]} /><StringItems data={data} name="features" count={4} update={set} /></Group>;
    case "service_benefits": return <Group title="Service benefits"><Fields data={data} names={["eyebrow", "headingHighlight", "headingRest", "subtitle"]} update={set} multiline={["subtitle"]} /><Items data={data} name="items" count={4} fields={["title", "description", "icon"]} update={set} /></Group>;
    case "join_application": return <Group title="Join application"><Fields data={data} names={["heading", "description", "fileHint", "note"]} update={set} multiline={["description", "note"]} /><StringItems data={data} name="benefits" count={3} update={set} /></Group>;
    case "faq_support": return <Group title="FAQ and support"><NestedGroup data={data} name="faq" update={set} /><NestedGroup data={data} name="support" update={set} /></Group>;
    default: return null;
  }
}
