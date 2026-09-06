"use client";

/* Arbitrary HTTPS URLs cannot be passed to next/image without allowing every host. */
/* eslint-disable @next/next/no-img-element */

import { useId, useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MediaItem } from "@/features/media/types";

type MediaSelection = { mediaId: string | null; externalUrl: string | null };
type MediaPickerProps = {
  items: readonly MediaItem[];
  selectedId: string | null;
  externalUrl?: string | null;
  onChange: (selection: MediaSelection) => void;
  fallbackUrl?: string | null;
  label?: string;
};

export function MediaPicker({ items, selectedId, externalUrl, onChange, fallbackUrl, label = "Select an image" }: MediaPickerProps) {
  const images = items.filter((item) => item.kind === "image");
  const selected = images.find((item) => item.id === selectedId);
  const previewUrl = selected?.publicPath ?? externalUrl ?? fallbackUrl ?? null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pickerId = useId();
  const titleId = `${pickerId}-title`;
  const urlId = `${pickerId}-url`;
  const [url, setUrl] = useState(externalUrl ?? "");

  function openDialog() {
    setUrl(externalUrl ?? "");
    dialogRef.current?.showModal();
  }
  function closeDialog() { dialogRef.current?.close(); }
  function selectExternal() {
    const value = url.trim();
    onChange({ mediaId: null, externalUrl: value || null });
    closeDialog();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{label}</p>
          {(selected || externalUrl) && <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ mediaId: null, externalUrl: null })} aria-label="Clear selected image"><X /> Clear</Button>}
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {previewUrl ? <img src={previewUrl} alt={selected?.originalFilename ?? "Selected image"} className="size-full object-contain" /> : <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm text-muted-foreground">{selected?.originalFilename ?? externalUrl ?? (fallbackUrl ? "Default image" : "No image selected")}</p></div>
          <Button type="button" size="sm" onClick={openDialog}>Select new image</Button>
        </div>

        <dialog ref={dialogRef} aria-labelledby={titleId} className="m-auto max-h-[min(90vh,720px)] w-[min(calc(100%-2rem),680px)] rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50">
          <div className="flex items-center justify-between border-b p-4"><h2 id={titleId} className="text-lg font-semibold">Select an image</h2><Button type="button" variant="ghost" size="sm" onClick={closeDialog} aria-label="Close dialog"><X /></Button></div>
          <div className="space-y-5 overflow-y-auto p-4">
            {images.length > 0 ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{images.map((item) => {
              const isSelected = item.id === selectedId;
              return <button key={item.id} type="button" aria-label={`Select ${item.originalFilename}`} aria-pressed={isSelected} onClick={() => { onChange({ mediaId: item.id, externalUrl: null }); closeDialog(); }} className={`relative aspect-square overflow-hidden rounded-md bg-muted ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSelected ? "ring-2 ring-primary" : "ring-1 ring-foreground/10 hover:ring-primary/60"}`}><img src={item.publicPath} alt={item.originalFilename} className="size-full object-cover" /></button>;
            })}</div> : <p className="text-sm text-muted-foreground">No images are available in the media library.</p>}
            <div className="space-y-2 border-t pt-4"><label htmlFor={urlId} className="text-sm font-medium">External image URL</label><div className="flex gap-2"><Input id={urlId} type="url" inputMode="url" placeholder="https://example.com/image.jpg or /images/image.jpg" value={url} onChange={(event) => setUrl(event.target.value)} /><Button type="button" onClick={selectExternal}>Use URL</Button></div><p className="text-xs text-muted-foreground">Use an HTTPS URL or a path within this site.</p></div>
          </div>
        </dialog>
      </CardContent>
    </Card>
  );
}
