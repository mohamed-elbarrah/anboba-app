import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const requiredFile = (message: string) =>
  z
    .custom<File>((value) => typeof File !== "undefined" && value instanceof File, {
      message,
    })
    .refine((file) => typeof File !== "undefined" && file instanceof File && file.size <= MAX_FILE_SIZE, {
      message: "يجب ألا يتجاوز حجم الملف 5 ميجابايت.",
    })
    .refine((file) => typeof File !== "undefined" && file instanceof File && ACCEPTED_FILE_TYPES.includes(file.type), {
      message: "يسمح بصور JPG وPNG وملفات PDF فقط.",
    });

export const joinApplicationSchema = z.object({
  fullName: z.string().trim().min(3, "يرجى إدخال الاسم الثلاثي.").max(100, "الاسم طويل جدًا."),
  phone: z
    .string()
    .trim()
    .regex(/^05\d{8}$/, "يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05.")
    .or(z.string().trim().regex(/^5\d{8}$/, "يرجى إدخال رقم جوال سعودي صحيح.")),
  email: z.string().trim().email("يرجى إدخال بريد إلكتروني صحيح."),
  city: z.string().trim().min(2, "يرجى إدخال المدينة."),
  experienceYears: z.string().min(1, "يرجى اختيار سنوات الخبرة."),
  transportType: z.string().min(1, "يرجى اختيار نوع النقل."),
  nationalId: requiredFile("يرجى إرفاق صورة الهوية الوطنية."),
  drivingLicense: requiredFile("يرجى إرفاق صورة رخصة القيادة."),
});

export type JoinApplicationFormValues = z.infer<typeof joinApplicationSchema>;
export type JoinApplicationContent = {
  heading: string;
  description: string;
  fields: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    experienceYears: string;
    transportType: string;
    nationalId: string;
    drivingLicense: string;
  };
  selectPlaceholders: { experienceYears: string; transportType: string };
  experienceOptions: readonly string[];
  transportOptions: readonly string[];
  fileHint: string;
  submit: string;
  benefits: readonly string[];
  note: string;
  success: string;
};
