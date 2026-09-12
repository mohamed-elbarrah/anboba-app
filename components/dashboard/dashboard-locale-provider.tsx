"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locales";

const preferenceCookie = "dashboard-locale";

type DashboardCopy = {
  overview: string;
  pages: string;
  forms: string;
  media: string;
  messages: string;
  settings: string;
  workspace: string;
  studio: string;
  comingSoon: string;
  contentWorkspace: string;
  language: string;
  pagesDescription: string;
  publicPages: string;
  pageIdentityDescription: string;
  arabic: string;
  english: string;
  lastUpdated: string;
  openEditor: string;
  preview: string;
  formsDescription: string;
  formInventory: string;
  reusableForms: string;
  createForm: string;
  updated: string;
  references: string;
  locales: string;
  mode: string;
  form: string;
  edit: string;
  builtIn: string;
  flexible: string;
  overviewGreeting: string;
  overviewDescription: string;
  overviewSummary: string;
  overviewReviewMessages: string;
  overviewPublishedLocales: string;
  overviewNewItems: string;
  overviewFailedNotifications: string;
  overviewMediaItems: string;
  reviewPages: string;
  futureMedia: string;
  trackMessages: string;
  configureSettings: string;
  settingsTitle: string;
  appearance: string;
  siteIdentity: string;
  header: string;
  menus: string;
  footer: string;
  policies: string;
  profile: string;
  menusDescription: string;
  headerMenuDescription: string;
  footerMenuDescription: string;
  openPublicHome: string;
  notificationSettings: string;
  notificationDescription: string;
  notificationRecipient: string;
  notificationRecipientDescription: string;
  emailAddress: string;
  save: string;
  sendTest: string;
  notificationSaved: string;
  notificationTestSent: string;
  notificationInvalid: string;
  notificationError: string;
  notificationTemplateTitle: string;
  notificationTemplateDescription: string;
  notificationForm: string;
  notificationContactForm: string;
  notificationJoinForm: string;
  notificationPartnerForm: string;
  notificationSubject: string;
  notificationBody: string;
  notificationPlaceholders: string;
  notificationTemplateSaved: string;
};

const copy: Record<Locale, DashboardCopy> = {
  en: {
    overview: "Overview", pages: "Pages", forms: "Forms", media: "Media", messages: "Messages", settings: "Settings",
    workspace: "Workspace", studio: "Studio", comingSoon: "Coming soon", contentWorkspace: "Content workspace", language: "Language",
    pagesDescription: "Manage the fixed public page set and monitor translation readiness.", publicPages: "Public pages", pageIdentityDescription: "One row per public page identity. Locale availability is shown independently.", arabic: "Arabic", english: "English", lastUpdated: "Last updated", openEditor: "Open editor", preview: "Preview", formsDescription: "Inventory of the three system forms connected to the public site.", formInventory: "Form inventory", reusableForms: "Reusable, localized forms and their publishing status.", createForm: "Create form", updated: "Updated", references: "References", locales: "Locales", mode: "Mode", form: "Form", edit: "Edit", builtIn: "Built-in", flexible: "Flexible", overviewGreeting: "Good morning, welcome back.", overviewDescription: "A calm place to manage your public website content. Choose a workspace area to get started.", overviewSummary: "Workspace summary", overviewReviewMessages: "Review messages", overviewPublishedLocales: "published language versions", overviewNewItems: "new", overviewFailedNotifications: "failed notifications", overviewMediaItems: "assets", reviewPages: "Review the five public page identities and their translations.", futureMedia: "A future home for your image and asset library.", trackMessages: "Keep track of contact requests in one place.", configureSettings: "Configure your site identity and navigation.", settingsTitle: "Site settings", appearance: "Appearance", siteIdentity: "Site identity", header: "Header", menus: "Menus", footer: "Footer", policies: "Policies", profile: "Profile", menusDescription: "Choose which navigation area you want to manage.", headerMenuDescription: "Manage the links shown in the public header.", footerMenuDescription: "Manage the links shown in the public footer.", openPublicHome: "Open public home", notificationSettings: "Submission notifications", notificationDescription: "Choose where new form submission alerts are delivered.", notificationRecipient: "Recipient email", notificationRecipientDescription: "This address receives a minimal notification with a dashboard link context. SMTP credentials are managed by the server.", emailAddress: "Email address", save: "Save", sendTest: "Send test email", notificationSaved: "Recipient saved.", notificationTestSent: "Test email sent.", notificationInvalid: "Enter a valid email address or template.", notificationError: "Unable to complete the request.", notificationTemplateTitle: "Arabic notification templates", notificationTemplateDescription: "Customize the message sent for each submission form. SMTP credentials remain on the server.", notificationForm: "Form", notificationContactForm: "Contact", notificationJoinForm: "Join application", notificationPartnerForm: "Partner registration", notificationSubject: "Subject", notificationBody: "Message body", notificationPlaceholders: "Allowed placeholders", notificationTemplateSaved: "Template saved." ,
  },
  ar: {
    overview: "نظرة عامة", pages: "الصفحات", forms: "النماذج", media: "الوسائط", messages: "الرسائل", settings: "الإعدادات",
    workspace: "مساحة العمل", studio: "استوديو", comingSoon: "قريباً", contentWorkspace: "مساحة المحتوى", language: "اللغة",
    pagesDescription: "إدارة صفحات الموقع العامة ومتابعة جاهزية الترجمة.", publicPages: "صفحات الموقع", pageIdentityDescription: "صف واحد لكل صفحة عامة، مع عرض توفر كل لغة بشكل مستقل.", arabic: "العربية", english: "الإنجليزية", lastUpdated: "آخر تحديث", openEditor: "فتح المحرر", preview: "معاينة", formsDescription: "قائمة بالنماذج النظامية الثلاثة المرتبطة بالموقع العام.", formInventory: "قائمة النماذج", reusableForms: "نماذج قابلة لإعادة الاستخدام ومتعددة اللغات مع حالة النشر.", createForm: "إنشاء نموذج", updated: "آخر تحديث", references: "الاستخدامات", locales: "اللغات", mode: "النوع", form: "النموذج", edit: "تعديل", builtIn: "أساسي", flexible: "مرن", overviewGreeting: "أهلاً بعودتك.", overviewDescription: "مساحة هادئة لإدارة محتوى موقعك العام. اختر قسماً للبدء.", overviewSummary: "ملخص مساحة العمل", overviewReviewMessages: "مراجعة الرسائل", overviewPublishedLocales: "إصدارات لغوية منشورة", overviewNewItems: "جديد", overviewFailedNotifications: "إشعارات فاشلة", overviewMediaItems: "ملفات", reviewPages: "راجع صفحات الموقع العامة وترجماتها.", futureMedia: "مساحة مستقبلية لمكتبة الصور والملفات.", trackMessages: "تابع رسائل واستفسارات العملاء في مكان واحد.", configureSettings: "إدارة هوية الموقع وروابطه ونشرها.", settingsTitle: "إعدادات الموقع", appearance: "المظهر", siteIdentity: "هوية الموقع", header: "رأس الصفحة", menus: "القوائم", footer: "التذييل", policies: "السياسات", profile: "الملف الشخصي", menusDescription: "اختر منطقة التنقل التي تريد إدارتها.", headerMenuDescription: "إدارة الروابط الظاهرة في رأس الموقع العام.", footerMenuDescription: "إدارة الروابط الظاهرة في تذييل الموقع العام.", openPublicHome: "فتح الصفحة الرئيسية العامة", notificationSettings: "إشعارات الإرسال", notificationDescription: "اختر البريد الذي تصله تنبيهات إرسال النماذج الجديدة.", notificationRecipient: "البريد المستلم", notificationRecipientDescription: "يستلم هذا العنوان إشعاراً مختصراً مع سياق توفر لوحة التحكم. تُدار بيانات SMTP من الخادم.", emailAddress: "عنوان البريد الإلكتروني", save: "حفظ", sendTest: "إرسال بريد تجريبي", notificationSaved: "تم حفظ البريد المستلم.", notificationTestSent: "تم إرسال البريد التجريبي.", notificationInvalid: "أدخل بريداً صالحاً أو قالباً صحيحاً.", notificationError: "تعذر إكمال الطلب.", notificationTemplateTitle: "قوالب إشعارات الإرسال بالعربية", notificationTemplateDescription: "خصص الرسالة المرسلة لكل نموذج. تبقى بيانات SMTP على الخادم.", notificationForm: "النموذج", notificationContactForm: "التواصل", notificationJoinForm: "طلب الانضمام", notificationPartnerForm: "تسجيل الشركاء", notificationSubject: "الموضوع", notificationBody: "نص الرسالة", notificationPlaceholders: "المتغيرات المسموحة", notificationTemplateSaved: "تم حفظ القالب.",
  },
};

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; copy: DashboardCopy };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function DashboardLocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    copy: copy[locale],
    setLocale: (next: Locale) => {
      document.cookie = `${preferenceCookie}=${next}; Path=/dashboard; Max-Age=31536000; SameSite=Lax`;
      setLocaleState(next);
      // Server-rendered workspace content and the document shell must use the new preference too.
      router.refresh();
    },
  }), [locale, router]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useDashboardLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useDashboardLocale must be used inside DashboardLocaleProvider");
  return value;
}
