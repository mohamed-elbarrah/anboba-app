import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Dictionary } from "@/lib/dictionaries";

type FaqPageProps = {
  content: Dictionary["faqPage"];
  locale: "ar" | "en";
};

export function FaqPage({ content, locale }: FaqPageProps) {
  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="bg-background px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-extrabold tracking-wide text-primary">{content.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{content.heading}</h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">{content.description}</p>
      </header>
      <section aria-label={content.heading} className="mx-auto mt-12 max-w-3xl rounded-3xl border border-border/70 bg-card px-5 py-2 shadow-sm sm:px-8">
        <Accordion defaultValue={content.items.length ? ["faq-0"] : []}>
          {content.items.map((item, index) => (
            <AccordionItem key={`faq-${index}`} value={`faq-${index}`} className="border-border/70 py-2">
              <AccordionTrigger className="py-5 text-base font-bold sm:text-lg">{item.question}</AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-8 text-muted-foreground sm:text-lg">
                <p className="whitespace-pre-line">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
