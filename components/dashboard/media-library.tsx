"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy, Film, ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MediaItem } from "@/features/media/types";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [items, setItems] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || file.size === 0) return setError("اختر ملفاً أولاً");
    setUploading(true);
    setError(null);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر رفع الملف");
      setItems((current) => [{ id: result.id, publicPath: result.path, originalFilename: file.name, mimeType: result.mimeType, kind: file.type.startsWith("video/") ? "video" : "image", sizeBytes: result.size, createdAt: new Date() }, ...current]);
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر رفع الملف");
    } finally {
      setUploading(false);
    }
  }

  async function copyUrl(path: string) {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(path);
    window.setTimeout(() => setCopied((current) => current === path ? null : current), 1800);
  }

  return <div className="space-y-6">
    <Card><CardContent className="p-6"><form onSubmit={upload} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2"><label htmlFor="media-file" className="text-sm font-medium">رفع صورة أو فيديو</label><Input id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required /></div>
      <Button type="submit" disabled={uploading}><Upload />{uploading ? "جاري الرفع..." : "رفع الملف"}</Button>
    </form>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<p className="mt-3 text-xs text-muted-foreground">الصور حتى 10 ميجابايت، والفيديوهات حتى 100 ميجابايت.</p></CardContent></Card>
    {items.length === 0 ? <Card><CardContent className="p-12 text-center text-muted-foreground">لم يتم رفع أي ملفات بعد.</CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item) => <Card key={item.id} className="overflow-hidden"><div className="relative flex aspect-video items-center justify-center bg-muted">{item.kind === "image" ? <Image fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw" src={item.publicPath} alt={item.originalFilename} className="object-cover" /> : <video src={item.publicPath} controls preload="metadata" className="size-full object-cover" />} </div><CardContent className="space-y-3 p-4"><div className="flex items-center gap-2"><span className="text-primary">{item.kind === "image" ? <ImageIcon className="size-4" /> : <Film className="size-4" />}</span><p className="min-w-0 flex-1 truncate text-sm font-medium" title={item.originalFilename}>{item.originalFilename}</p></div><p className="text-xs text-muted-foreground">{formatSize(item.sizeBytes)} · {item.mimeType}</p><Button type="button" variant="outline" size="sm" className="w-full" onClick={() => copyUrl(item.publicPath)}>{copied === item.publicPath ? <><Check />تم النسخ</> : <><Copy />نسخ الرابط</>}</Button></CardContent></Card>)}</div>}
  </div>;
}
