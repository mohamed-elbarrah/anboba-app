import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8"><div className="space-y-3"><Skeleton className="h-4 w-36" /><Skeleton className="h-10 w-48" /><Skeleton className="h-5 w-full max-w-xl" /></div><Skeleton className="h-[360px] w-full" /></main>;
}
