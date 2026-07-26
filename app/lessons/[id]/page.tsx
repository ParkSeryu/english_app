import { redirect } from "next/navigation";

export default async function LegacyLessonDetailRedirect({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/lessons/books/${id}`);
}
