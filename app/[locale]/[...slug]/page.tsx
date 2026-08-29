import { LocalePlaceholder } from "@/components/public/locale-placeholder";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale } = await params;
  return <LocalePlaceholder locale={locale} page="placeholder" />;
}
