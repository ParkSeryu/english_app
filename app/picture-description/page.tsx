import { PictureDescriptionTrainer } from "@/components/PictureDescriptionTrainer";
import { requireCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PictureDescriptionPage() {
  const user = await requireCurrentUser();

  return <PictureDescriptionTrainer storageOwnerId={user.id} />;
}
