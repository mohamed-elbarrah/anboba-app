import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="space-y-4 p-4 md:p-8"><Skeleton className="h-10 w-64" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div></main>;
}
