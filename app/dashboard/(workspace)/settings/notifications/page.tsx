import { getSubmissionNotificationRecipient, getSubmissionNotificationTemplates } from "@/features/settings/queries";
import { NotificationRecipientEditor } from "@/features/settings/components/notification-recipient-editor";

export default async function NotificationSettingsPage() {
  const [recipient, templates] = await Promise.all([
    getSubmissionNotificationRecipient(),
    getSubmissionNotificationTemplates(),
  ]);
  return <NotificationRecipientEditor initialRecipient={recipient} initialTemplates={templates} />;
}
