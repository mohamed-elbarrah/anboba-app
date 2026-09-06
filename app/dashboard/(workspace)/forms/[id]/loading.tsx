import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="space-y-5 p-4 md:p-8"><Skeleton className="h-10 w-72" /><Skeleton className="h-12 w-80" /><div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div></main>;
}
