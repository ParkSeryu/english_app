import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { requireCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  await requireCurrentUser();
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? "";
  return <PushNotificationSettings publicKey={publicKey} />;
}
