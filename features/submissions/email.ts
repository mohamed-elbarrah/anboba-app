import "server-only";
import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function replyTo(payload: Record<string, unknown>) {
  const value = payload.email;
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : undefined;
}

export async function sendSubmissionNotification(input: { formKey: string; submissionId: string; payload: Record<string, unknown>; attachments?: Array<{ path: string; filename: string; mimeType: string }> }) {
  const host = process.env.SMTP_HOST;
  const to = process.env.SUBMISSION_NOTIFICATION_TO;
  const from = process.env.SMTP_FROM;
  if (!host || !to || !from) throw new Error("SMTP is not configured");
  const transporter = nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT || 465), secure: process.env.SMTP_SECURE !== "false", auth: { user: process.env.SMTP_USER || from, pass: process.env.SMTP_PASSWORD || "" } });
  const rows = Object.entries(input.payload).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value ?? "")}`);
  const text = rows.join("\\n");
  const html = `<h2>New ${escapeHtml(input.formKey)} submission #${escapeHtml(input.submissionId)}</h2><pre>${escapeHtml(text)}</pre><p>Attachments are available in the protected dashboard.</p>`;
  // Identity documents remain in private storage and are never emailed.
  await transporter.sendMail({ from, to, replyTo: replyTo(input.payload), subject: `New ${input.formKey} submission #${input.submissionId}`, text, html });
}
