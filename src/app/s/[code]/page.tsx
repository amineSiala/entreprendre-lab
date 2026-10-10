import { StudentRoom } from "@/components/student";

export default async function StudentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <StudentRoom code={code} />;
}
