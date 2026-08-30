import { z } from "zod";

export type JoinValidationMessages = {
  fullNameMin: string; fullNameMax: string; phone: string; email: string; city: string;
  experience: string; transport: string; nationalId: string; drivingLicense: string;
  fileSize: string; fileType: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const requiredFile = (message: string, fileSize: string, fileType: string) =>
  z
    .custom<File>((value) => typeof File !== "undefined" && value instanceof File, {
      message,
    })
    .refine((file) => typeof File !== "undefined" && file instanceof File && file.size <= MAX_FILE_SIZE, {
      message: fileSize,
    })
    .refine((file) => typeof File !== "undefined" && file instanceof File && ACCEPTED_FILE_TYPES.includes(file.type), {
      message: fileType,
    });

export function createJoinApplicationSchema(messages: JoinValidationMessages) {
  return z.object({
    fullName: z.string().trim().min(3, messages.fullNameMin).max(100, messages.fullNameMax),
    phone: z.string().trim().regex(/^(?:05\d{8}|5\d{8})$/, messages.phone),
    email: z.string().trim().email(messages.email),
    city: z.string().trim().min(2, messages.city),
    experienceYears: z.string().min(1, messages.experience),
    transportType: z.string().min(1, messages.transport),
    nationalId: requiredFile(messages.nationalId, messages.fileSize, messages.fileType),
    drivingLicense: requiredFile(messages.drivingLicense, messages.fileSize, messages.fileType),
  });
}

export const joinApplicationSchema = createJoinApplicationSchema({ fullNameMin: "Please enter your full name.", fullNameMax: "Name is too long.", phone: "Please enter a valid Saudi mobile number.", email: "Please enter a valid email address.", city: "Please enter your city.", experience: "Please select your experience.", transport: "Please select your transport type.", nationalId: "Please attach your national ID.", drivingLicense: "Please attach your driving license.", fileSize: "File must be no larger than 5 MB.", fileType: "Only JPG, PNG, and PDF files are allowed." });

export type JoinApplicationFormValues = z.infer<typeof joinApplicationSchema>;
export type JoinApplicationContent = {
  validation: JoinValidationMessages;
  heading: string;
  description: string;
  placeholders: { fullName: string; phone: string; email: string; city: string };
  countryCode: string;
  countryLabel: string;
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
