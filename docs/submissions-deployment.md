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
SUBMISSION_NOTIFICATION_TO=admin@example.com
SUBMISSION_STORAGE_DIR=/absolute/path/outside/public-web-root/submissions
```

`SMTP_FROM` must be a mailbox/domain authorized by Hostinger. Configure SPF, DKIM, and DMARC for the domain. Uploaded identity documents are never sent by email; admins download them through the authenticated dashboard.

Before production:

1. Run the latest Drizzle migration against the Hostinger MySQL database.
2. Create `SUBMISSION_STORAGE_DIR`, make it writable by the Node process, and verify it is outside the public web root.
3. Submit all three forms in Arabic and English and verify rows, attachments, and notification emails.
4. Test SMTP failure: the submission must remain in the dashboard with a failed notification and retry must work after SMTP is restored.
5. Test redeploy/restart persistence of private files; shared-hosting storage behavior must be confirmed before accepting identity documents.
6. Configure a retention policy for national IDs and driving licenses and periodically delete expired records/files.

The in-memory rate limiter is intentionally lightweight for shared hosting. It limits abuse per running Node process, but it is not a distributed quota. Add Hostinger/WAF or Turnstile protection if public traffic requires stronger bot resistance.
