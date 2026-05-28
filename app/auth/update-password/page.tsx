import { RecoverySessionHandler } from "@/components/RecoverySessionHandler";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();

  if (!user) return <RecoverySessionHandler />;

  return <UpdatePasswordForm />;
}
