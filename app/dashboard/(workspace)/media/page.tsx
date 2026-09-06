import { MediaLibrary } from "@/components/dashboard/media-library";
import { listMedia } from "@/features/media/queries";
import { requireAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAdmin();
  const items = await listMedia();
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8"><div><h1 className="text-3xl font-semibold tracking-tight">مكتبة الوسائط</h1><p className="mt-2 text-muted-foreground">ارفع الصور والفيديوهات وانسخ روابطها لاستخدامها في الموقع.</p></div><MediaLibrary initialMedia={items} /></main>;
}
