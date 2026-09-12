import { cookies } from "next/headers";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardOverview } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ar = (await cookies()).get("dashboard-locale")?.value === "ar";

  let overview: Awaited<ReturnType<typeof getDashboardOverview>> | null = null;
  let error: unknown = null;
  try {
    overview = await getDashboardOverview();
  } catch (caught) {
    error = caught;
    console.error("[dashboard] Unable to load overview", caught);
  }

  if (overview) return <DashboardOverview data={overview} />;

  return (
    <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <h1 className="font-semibold">
            {ar ? "تعذر تحميل النظرة العامة" : "Overview could not be loaded"}
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground">
            {ar
              ? "ملخص لوحة التحكم غير متاح مؤقتاً. حاول مرة أخرى بعد قليل."
              : "The dashboard summary is temporarily unavailable. Try again shortly."}
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="max-w-full break-all text-xs text-destructive">
              {error instanceof Error ? error.message : String(error)}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
