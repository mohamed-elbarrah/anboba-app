export type LegalDocumentSlug = string;

export type LegalSection = {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  summary: string;
  sections: readonly LegalSection[];
};

export const arabicLegalDocuments: readonly LegalDocument[] = [
  {
    slug: "privacy",
    title: "سياسة الخصوصية",
    summary:
      "يحترم تطبيق أنبوبة خصوصيتك ويلتزم بحماية بياناتك الشخصية. توضح هذه السياسة أنواع المعلومات التي نجمعها، وأسباب جمعها، وطرق استخدامها وحمايتها، والخيارات المتاحة لك بخصوص بياناتك.",
    sections: [
      {
        heading: "01 — المقدمة",
        paragraphs: [
          "يحترم تطبيق أنبوبة خصوصيتك ويلتزم بحماية بياناتك الشخصية. توضح هذه السياسة أنواع المعلومات التي نجمعها، وأسباب جمعها، وطرق استخدامها وحمايتها، والخيارات المتاحة لك بخصوص بياناتك.",
        ],
      },
      {
        heading: "02 — البيانات التي يتم جمعها",
        paragraphs: [
          "يجمع تطبيق أنبوبة البيانات التي يقدمها المستخدم عند التسجيل أو استخدام التطبيق، مثل الاسم، البريد الإلكتروني، ورقم الجوال.",
          "كما قد يتم جمع البيانات والمعلومات التي يتم إدخالها داخل التطبيق، بحسب الخدمات والوظائف التي يستخدمها المستخدم.",
        ],
      },
      {
        heading: "03 — استخدام البيانات",
        paragraphs: ["يتم استخدام البيانات من أجل:"],
        items: [
          "تقديم الخدمات وتمكين المستخدم من الاستفادة من وظائف التطبيق.",
          "تقديم الدعم الفني والإشعارات المتعلقة بالخدمة.",
          "تطوير وتحسين التطبيق بشكل مستمر.",
        ],
      },
      {
        heading: "04 — حماية البيانات",
        paragraphs: [
          "يلتزم تطبيق أنبوبة بتطبيق التدابير التقنية والتنظيمية المناسبة لحماية البيانات من الوصول غير المصرح به أو التعديل أو الإفشاء.",
          "ويقتصر الوصول إلى البيانات على الأشخاص المخولين فقط وللأغراض المحددة أعلاه.",
        ],
      },
      {
        heading: "05 — مشاركة البيانات",
        paragraphs: [
          "لا تتم مشاركة بيانات المستخدم مع أي طرف ثالث إلا عند الحاجة لتقديم الخدمة أو في الحالات التي يسمح أو يتطلب فيها النظام ذلك.",
          "وفي حال وجود اندماج أو استحواذ أو بيع للأعمال، قد يتم نقل البيانات إلى الكيان الجديد مع ضمان استمرار حماية البيانات وفق هذه السياسة.",
        ],
      },
      {
        heading: "06 — إشعار الحوادث الأمنية",
        paragraphs: [
          "في حال وقوع خرق أمني يمس بيانات المستخدم، سيتخذ تطبيق أنبوبة الإجراءات اللازمة لمعالجة الحادث وتقليل آثاره، وسيتم إشعار الجهات أو المستخدمين المتأثرين وفقًا للأنظمة واللوائح المعمول بها.",
        ],
      },
      {
        heading: "07 — حقوق المستخدم",
        paragraphs: [
          "يحق للمستخدم طلب تصحيح بياناته أو تحديثها في أي وقت.",
          "كما يحق له طلب حذف حسابه وفق سياسة التطبيق، ما لم يكن هناك التزام نظامي يتطلب الاحتفاظ بالبيانات.",
        ],
      },
      {
        heading: "08 — التعديلات على السياسة",
        paragraphs: [
          "قد يتم تحديث سياسة الخصوصية من وقت لآخر، وسيتم إشعار المستخدم بالتعديلات المهمة قبل أو عند سريانها وفقًا لما تقتضيه الأنظمة.",
          "استمرار استخدام التطبيق بعد التعديلات يعني الموافقة على السياسة المحدثة.",
        ],
      },
      {
        heading: "09 — تواصل معنا",
        paragraphs: [
          "إذا كان لديك أي استفسار حول سياسة الخصوصية أو ممارسات معالجة البيانات في تطبيق أنبوبة",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "شروط الاستخدام",
    summary:
      "مرحبًا بك في تطبيق أنبوبة. توضح شروط الاستخدام هذه القواعد والأحكام المنظمة لاستخدام التطبيق والخدمات المقدمة من خلاله.",
    sections: [
      {
        heading: "01 — المقدمة",
        paragraphs: [
          "مرحبًا بك في تطبيق أنبوبة. توضح شروط الاستخدام هذه القواعد والأحكام المنظمة لاستخدام التطبيق والخدمات المقدمة من خلاله. باستخدامك للتطبيق، فإنك تقر بأنك قرأت هذه الشروط ووافقت على الالتزام بها.",
        ],
      },
      {
        heading: "02 — استخدام التطبيق",
        paragraphs: [
          "يجب على المستخدم استخدام التطبيق بطريقة نظامية ومشروعة، وعدم استخدامه لأي أغراض مخالفة للأنظمة أو تتسبب في الإضرار بالتطبيق أو المستخدمين الآخرين.",
          "يتحمل المستخدم مسؤولية صحة ودقة المعلومات التي يقدمها أثناء التسجيل أو استخدام الخدمات.",
        ],
      },
      {
        heading: "03 — حساب المستخدم",
        paragraphs: [
          "قد يتطلب استخدام بعض خدمات التطبيق إنشاء حساب شخصي.",
          "يلتزم المستخدم بالمحافظة على سرية بيانات الدخول الخاصة به، ويتحمل مسؤولية جميع الأنشطة التي تتم من خلال حسابه.",
          "يجب إبلاغ إدارة التطبيق فورًا في حال الاشتباه بوجود استخدام غير مصرح به للحساب.",
        ],
      },
      {
        heading: "04 — الخدمات والطلبات",
        paragraphs: [
          "يوفر تطبيق أنبوبة خدمات ومزايا مختلفة وفقًا لما هو موضح داخل التطبيق.",
          "تخضع الخدمات والأسعار والتفاصيل المعروضة للتحديث من وقت لآخر، وقد يتم تعديلها أو إيقاف بعضها عند الحاجة.",
        ],
      },
      {
        heading: "05 — المدفوعات",
        paragraphs: [
          "عند إجراء أي عملية دفع من خلال التطبيق، يلتزم المستخدم بتقديم بيانات دفع صحيحة واستخدام وسيلة دفع يحق له استخدامها.",
          "يتم تنفيذ عمليات الدفع من خلال مزودي خدمات الدفع المعتمدين، وقد تخضع العمليات لشروط وأحكام مزود الدفع.",
        ],
      },
      {
        heading: "06 — الاستخدام الممنوع",
        paragraphs: [
          "يُمنع استخدام التطبيق في أي نشاط غير قانوني، أو محاولة الوصول غير المصرح به إلى أنظمة التطبيق، أو العبث بالخدمات، أو استخدام بيانات مستخدمين آخرين دون إذن.",
          "يحق لتطبيق أنبوبة اتخاذ الإجراءات المناسبة، بما في ذلك تعليق أو إيقاف الحساب المخالف.",
        ],
      },
      {
        heading: "07 — مسؤولية المستخدم",
        paragraphs: [
          "يتحمل المستخدم مسؤولية استخدام التطبيق والمعلومات التي يقوم بإدخالها أو مشاركتها من خلاله.",
          "ولا يجوز للمستخدم استخدام التطبيق بطريقة تؤدي إلى الإضرار بحقوق التطبيق أو حقوق المستخدمين أو الأطراف الأخرى.",
        ],
      },
      {
        heading: "08 — التعديلات على الشروط",
        paragraphs: [
          "قد يتم تحديث شروط الاستخدام من وقت لآخر بما يتناسب مع تطوير الخدمات أو المتطلبات النظامية.",
          "سيتم إشعار المستخدم بالتعديلات المهمة وفقًا لما تقتضيه الأنظمة، واستمرار استخدام التطبيق بعد التحديث يعني الموافقة على الشروط المعدلة.",
        ],
      },
      {
        heading: "09 — تواصل معنا",
        paragraphs: [
          "إذا كان لديك أي استفسار حول شروط الاستخدام أو الخدمات المقدمة في تطبيق أنبوبة",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "سياسة استرداد الأموال",
    summary:
      "يوضح تطبيق أنبوبة سياسة استرداد الأموال والإجراءات المتعلقة بإلغاء الطلبات واسترجاع المبالغ المدفوعة مقابل الخدمات المقدمة من خلال التطبيق.",
    sections: [
      {
        heading: "01 — المقدمة",
        paragraphs: [
          "يوضح تطبيق أنبوبة سياسة استرداد الأموال والإجراءات المتعلقة بإلغاء الطلبات واسترجاع المبالغ المدفوعة مقابل الخدمات المقدمة من خلال التطبيق.",
        ],
      },
      {
        heading: "02 — طلب الاسترداد",
        paragraphs: [
          "يمكن للمستخدم تقديم طلب استرداد من خلال قنوات التواصل المعتمدة لدى تطبيق أنبوبة، مع توضيح سبب طلب الاسترداد وتزويدنا بالمعلومات اللازمة لمعالجة الطلب.",
        ],
      },
      {
        heading: "03 — حالات الاسترداد",
        paragraphs: [
          "يتم النظر في طلبات الاسترداد وفقًا لطبيعة الخدمة وحالة الطلب وسبب الإلغاء.",
          "وقد يتم قبول الاسترداد في حال عدم تقديم الخدمة أو وجود مشكلة جوهرية تمنع الاستفادة منها، وفقًا للأنظمة والشروط المعمول بها.",
        ],
      },
      {
        heading: "04 — الحالات غير القابلة للاسترداد",
        paragraphs: [
          "قد لا يكون الاسترداد متاحًا في الحالات التي تم فيها تقديم الخدمة أو الاستفادة منها بشكل كامل، أو في حال كان سبب الإلغاء خارج نطاق مسؤولية تطبيق أنبوبة، وذلك وفقًا لطبيعة الخدمة والشروط المعلنة.",
        ],
      },
      {
        heading: "05 — معالجة طلب الاسترداد",
        paragraphs: [
          "تتم مراجعة طلب الاسترداد والتحقق من تفاصيل العملية قبل اتخاذ القرار.",
          "وفي حال الموافقة على الاسترداد، سيتم إعادة المبلغ إلى وسيلة الدفع المستخدمة في العملية، وفق الإجراءات المتبعة.",
        ],
      },
      {
        heading: "06 — مدة استرداد المبلغ",
        paragraphs: [
          "بعد الموافقة على طلب الاسترداد، قد تستغرق عملية إيداع المبلغ في حساب المستخدم عدة أيام عمل، وذلك بحسب البنك أو مزود خدمة الدفع المستخدم.",
          "ولا يتحمل تطبيق أنبوبة مسؤولية أي تأخير ناتج عن جهة الدفع أو البنك.",
        ],
      },
      {
        heading: "07 — الرسوم والخصومات",
        paragraphs: [
          "قد يتم خصم أي رسوم مستحقة أو غير قابلة للاسترداد من قيمة المبلغ المعاد، إذا كانت هذه الرسوم موضحة للمستخدم قبل إتمام عملية الدفع.",
        ],
      },
      {
        heading: "08 — التعديلات على السياسة",
        paragraphs: [
          "قد يتم تحديث سياسة استرداد الأموال من وقت لآخر بما يتناسب مع تطوير الخدمات والمتطلبات النظامية.",
          "سيتم نشر التعديلات على التطبيق، ويُعتد بالسياسة السارية وقت تقديم طلب الاسترداد، ما لم تقتضِ الأنظمة خلاف ذلك",
        ],
      },
    ],
  },
];

export const englishLegalDocuments: readonly LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "ANBOBA respects your privacy and is committed to protecting your personal data. This policy explains what information we collect, why we collect it, how we use and protect it, and the choices available to you regarding your data.",
    sections: [
      {
        heading: "01 — Introduction",
        paragraphs: [
          "ANBOBA respects your privacy and is committed to protecting your personal data. This policy explains what information we collect, why we collect it, how we use and protect it, and the choices available to you regarding your data.",
        ],
      },
      {
        heading: "02 — Data We Collect",
        paragraphs: [
          "ANBOBA collects the data you provide when registering or using the app, such as your name, email address, and mobile number.",
          "We may also collect data and information entered within the app, depending on the services and features you use.",
        ],
      },
      {
        heading: "03 — Use of Data",
        paragraphs: ["Data is used to:"],
        items: [
          "Provide services and enable you to benefit from the app's features.",
          "Provide technical support and service-related notifications.",
          "Continuously develop and improve the app.",
        ],
      },
      {
        heading: "04 — Data Protection",
        paragraphs: [
          "ANBOBA is committed to applying appropriate technical and organizational measures to protect data from unauthorized access, alteration, or disclosure.",
          "Access to data is limited to authorized personnel and only for the purposes described above.",
        ],
      },
      {
        heading: "05 — Data Sharing",
        paragraphs: [
          "User data is not shared with any third party except when necessary to provide the service or where permitted or required by applicable law.",
          "In the event of a merger, acquisition, or sale of the business, data may be transferred to the new entity while ensuring that its protection continues under this policy.",
        ],
      },
      {
        heading: "06 — Security Incident Notice",
        paragraphs: [
          "If a security breach affecting user data occurs, ANBOBA will take the necessary steps to address the incident and reduce its effects, and will notify the relevant authorities or affected users in accordance with applicable laws and regulations.",
        ],
      },
      {
        heading: "07 — User Rights",
        paragraphs: [
          "You have the right to request correction or updating of your data at any time.",
          "You may also request deletion of your account in accordance with the app's policy, unless a legal obligation requires the data to be retained.",
        ],
      },
      {
        heading: "08 — Policy Changes",
        paragraphs: [
          "The Privacy Policy may be updated from time to time. Users will be notified of material changes before or when they take effect, as required by applicable laws.",
          "Continuing to use the app after changes means that you accept the updated policy.",
        ],
      },
      {
        heading: "09 — Contact Us",
        paragraphs: [
          "If you have any questions about this Privacy Policy or ANBOBA's data processing practices",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Use",
    summary:
      "Welcome to ANBOBA. These Terms of Use explain the rules and provisions governing use of the app and the services provided through it.",
    sections: [
      {
        heading: "01 — Introduction",
        paragraphs: [
          "Welcome to ANBOBA. These Terms of Use explain the rules and provisions governing use of the app and the services provided through it. By using the app, you acknowledge that you have read these terms and agree to comply with them.",
        ],
      },
      {
        heading: "02 — Use of the App",
        paragraphs: [
          "You must use the app in a lawful and legitimate manner and must not use it for purposes that violate applicable laws or cause harm to the app or other users.",
          "You are responsible for the truthfulness and accuracy of the information you provide during registration or while using the services.",
        ],
      },
      {
        heading: "03 — User Account",
        paragraphs: [
          "Some app services may require you to create a personal account.",
          "You must keep your login details confidential and are responsible for all activity carried out through your account.",
          "You must notify the app administration immediately if you suspect unauthorized use of your account.",
        ],
      },
      {
        heading: "04 — Services and Orders",
        paragraphs: [
          "ANBOBA provides various services and features as described within the app.",
          "The services, prices, and displayed details are subject to change from time to time, and some may be modified or discontinued when necessary.",
        ],
      },
      {
        heading: "05 — Payments",
        paragraphs: [
          "When making a payment through the app, you must provide accurate payment details and use a payment method you are authorized to use.",
          "Payments are processed through approved payment service providers and may be subject to the provider's terms and conditions.",
        ],
      },
      {
        heading: "06 — Prohibited Use",
        paragraphs: [
          "You may not use the app for any unlawful activity, attempt unauthorized access to the app's systems, tamper with the services, or use other users' data without permission.",
          "ANBOBA may take appropriate action, including suspending or terminating a violating account.",
        ],
      },
      {
        heading: "07 — User Responsibility",
        paragraphs: [
          "You are responsible for your use of the app and for the information you enter or share through it.",
          "You may not use the app in a way that harms the rights of ANBOBA, its users, or other parties.",
        ],
      },
      {
        heading: "08 — Changes to the Terms",
        paragraphs: [
          "The Terms of Use may be updated from time to time to reflect service development or legal requirements.",
          "Users will be notified of material changes as required by applicable laws. Continuing to use the app after an update means that you accept the amended terms.",
        ],
      },
      {
        heading: "09 — Contact Us",
        paragraphs: [
          "If you have any questions about these Terms of Use or the services provided through the ANBOBA app",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refund Policy",
    summary:
      "This Refund Policy explains the procedures for canceling orders and recovering amounts paid for services provided through the ANBOBA app.",
    sections: [
      {
        heading: "01 — Introduction",
        paragraphs: [
          "This Refund Policy explains the procedures for canceling orders and recovering amounts paid for services provided through the ANBOBA app.",
        ],
      },
      {
        heading: "02 — Requesting a Refund",
        paragraphs: [
          "You may submit a refund request through ANBOBA's approved communication channels, explaining the reason for the request and providing the information needed to process it.",
        ],
      },
      {
        heading: "03 — Refund Cases",
        paragraphs: [
          "Refund requests are reviewed based on the nature of the service, the status of the order, and the reason for cancellation.",
          "A refund may be approved where the service was not provided or where a substantial problem prevents you from benefiting from it, in accordance with applicable laws and terms.",
        ],
      },
      {
        heading: "04 — Non-Refundable Cases",
        paragraphs: [
          "A refund may not be available where the service has been fully provided or used, or where the reason for cancellation is outside ANBOBA's responsibility, depending on the nature of the service and the published terms.",
        ],
      },
      {
        heading: "05 — Processing a Refund Request",
        paragraphs: [
          "The refund request and transaction details will be reviewed and verified before a decision is made.",
          "If the refund is approved, the amount will be returned to the payment method used for the transaction, according to the applicable procedures.",
        ],
      },
      {
        heading: "06 — Refund Timeline",
        paragraphs: [
          "After a refund request is approved, depositing the amount into your account may take several business days, depending on the bank or payment service provider used.",
          "ANBOBA is not responsible for delays caused by the payment provider or bank.",
        ],
      },
      {
        heading: "07 — Fees and Discounts",
        paragraphs: [
          "Any due or non-refundable fees may be deducted from the returned amount if those fees were explained to you before completing the payment.",
        ],
      },
      {
        heading: "08 — Policy Changes",
        paragraphs: [
          "The Refund Policy may be updated from time to time to reflect service development and legal requirements.",
          "Changes will be published in the app. The policy in effect when the refund request is submitted will apply, unless applicable laws require otherwise.",
        ],
      },
    ],
  },
];

export function getArabicLegalDocument(slug: LegalDocumentSlug) {
  return arabicLegalDocuments.find((document) => document.slug === slug);
}

export function getEnglishLegalDocument(slug: LegalDocumentSlug) {
  return englishLegalDocuments.find((document) => document.slug === slug);
}
