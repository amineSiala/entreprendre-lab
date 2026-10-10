import { StudentJoin } from "@/components/student";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <StudentJoin code={code} />;
}
