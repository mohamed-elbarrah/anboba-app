# Form submissions deployment

The public forms use `POST /api/forms/[formKey]/submit` and persist submissions in MySQL before attempting email notification.

Configure these server-only environment variables in Hostinger:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@example.com
SMTP_PASSWORD=change-me
SMTP_FROM=no-reply@example.com
# Optional fallback recipient; the authenticated dashboard can override this.
SUBMISSION_NOTIFICATION_TO=admin@example.com
SUBMISSION_STORAGE_DIR=/absolute/path/outside/public-web-root/submissions
```

`SMTP_FROM` must be a mailbox/domain authorized by the SMTP provider. For Gmail, use an App Password rather than the normal account password. The admin can set the current recipient at `/dashboard/settings/notifications`; SMTP credentials remain server-only environment variables. If no dashboard recipient is saved, `SUBMISSION_NOTIFICATION_TO` is used as a fallback.

Notification emails contain the configured Arabic template, the sender name/company name requested by the administrator, form label, submission ID, and timestamp. Phone numbers, email addresses, national IDs, licences, uploaded identity documents, and other submitted field values are never sent by email; admins access them through the authenticated dashboard. Templates can be customized at `/dashboard/settings/notifications` using the allowlisted placeholders shown there.

Before production:

1. Run the latest Drizzle migration against the Hostinger MySQL database.
2. Create `SUBMISSION_STORAGE_DIR`, make it writable by the Node process, and verify it is outside the public web root.
3. Submit all three forms in Arabic and English and verify rows, attachments, and notification emails.
4. Test SMTP failure: the submission must remain in the dashboard with a failed notification and retry must work after SMTP is restored.
5. Test redeploy/restart persistence of private files; shared-hosting storage behavior must be confirmed before accepting identity documents.
6. Configure a retention policy for national IDs and driving licenses and periodically delete expired records/files.

The in-memory rate limiter is intentionally lightweight for shared hosting. It limits abuse per running Node process, but it is not a distributed quota. Add Hostinger/WAF or Turnstile protection if public traffic requires stronger bot resistance.
