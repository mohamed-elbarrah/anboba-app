"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="p-8 text-center"><h1 className="font-semibold">Form editor unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Something went wrong while loading this form.</p><button className="mt-4 underline" onClick={reset}>Try again</button></main>;
}
