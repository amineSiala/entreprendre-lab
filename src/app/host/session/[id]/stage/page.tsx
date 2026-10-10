import { Stage } from "@/components/stage";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Stage code={id.toUpperCase()} />; }
