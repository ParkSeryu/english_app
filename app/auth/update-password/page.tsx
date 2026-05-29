import { RecoverySessionHandler } from "@/components/RecoverySessionHandler";
import { UpdatePasswordForm, UpdatePasswordSuccess } from "@/components/UpdatePasswordForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ updated?: string | string[] }>;

function firstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UpdatePasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (firstSearchParam(params.updated) === "1") return <UpdatePasswordSuccess />;

  const user = await getCurrentUser();

  if (!user) return <RecoverySessionHandler />;

  return <UpdatePasswordForm />;
}
