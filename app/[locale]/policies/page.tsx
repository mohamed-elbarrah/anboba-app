import { LocalePlaceholder } from "@/components/public/locale-placeholder";

export default async function PoliciesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LocalePlaceholder locale={locale} page="policies" />;
}
