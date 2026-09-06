"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto w-full max-w-3xl p-4 md:p-8"><Card className="border-destructive/30"><CardContent className="flex flex-col items-center gap-3 p-12 text-center"><AlertCircle className="size-8 text-destructive" /><h1 className="font-semibold">Forms workspace unavailable</h1><p className="text-sm text-muted-foreground">Something went wrong while loading the form inventory.</p><Button variant="outline" onClick={reset}>Try again</Button></CardContent></Card></main>;
}
