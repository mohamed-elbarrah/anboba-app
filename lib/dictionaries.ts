import type { Locale } from "@/lib/locales";

export type ServiceBenefitIcon = "clock" | "shield" | "send" | "headset";

const dictionaries = {
  ar: () =>
    import("@/dictionaries/ar.json").then(
      (module) => module.default as Dictionary,
    ),
  en: () =>
    import("@/dictionaries/en.json").then(
      (module) => module.default as Dictionary,
    ),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export type Dictionary = {
  pages: {
    home: string;
    about: string;
    contact: string;
    joinUs: string;
    policies: string;
    placeholder: string;
    logoLabel: string;
    downloadApp: string;
  };
  serviceOverview: {
    highlightedHeading: string;
    primaryHeading: string;
    primaryHeadingStart: string;
    primaryHeadingHighlight: string;
    description: string;
    imageAlt: string;
  };
  statistics: {
    heading: string;
    items: readonly {
      value: string;
      label: string;
    }[];
  };
  whyChooseUs: {
    eyebrow: string;
    headingStart: string;
    headingHighlight: string;
    subtitle: string;
    cardHeading: string;
    cardParagraph: string;
    featuresHeading: string;
    features: readonly string[];
    imageAlt: string;
  };
  aboutVisionMission: {
    vision: {
      heading: string;
      description: string;
    };
    mission: {
      heading: string;
      description: string;
    };
  };
  serviceBenefits: {
    eyebrow: string;
    headingHighlight: string;
    headingRest: string;
    subtitle: string;
    items: readonly {
      title: string;
      description: string;
      icon: ServiceBenefitIcon;
    }[];
  };
  joinApplication: import("@/features/join-us/schema").JoinApplicationContent;
  partnerRegistration: import("@/features/join-us/partner-registration").PartnerRegistrationContent;
  contact: import("@/features/contact/schema").ContactContent;
  validation: {
    contact: import("@/features/contact/schema").ContactValidationMessages;
    join: import("@/features/join-us/schema").JoinValidationMessages;
    partner: import("@/features/join-us/partner-registration").PartnerValidationMessages;
  };
  pageTitle: {
    eyebrow: string;
    heading: string;
    description: string;
  };
  faqSupport: {
    faq: {
      heading: string;
      description: string;
      cta: string;
      href: string;
    };
    support: {
      heading: string;
      description: string;
      cta: string;
      href: string;
    };
  };
  hero: {
    headingStart: string;
    headingHighlightGas: string;
    headingMiddle: string;
    headingHighlightHome: string;
    description: string;
    cta: string;
    showcase?: {
      heading: string;
      guaranteeLabel: string;
      guarantees: readonly string[];
      phoneLeftAlt: string;
      phoneRightAlt: string;
    };
  };
  footer: {
    brandDescription: string;
    quickLinks: string;
    contact: string;
    terms: string;
    privacy: string;
    refunds: string;
    phoneLabel: string;
    phone: string;
    emailLabel: string;
    email: string;
    locationLabel: string;
    location: string;
    googlePlay: string;
    appStore: string;
    comingSoon: string;
    languageLabel: string;
    copyright: string;
  };
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
