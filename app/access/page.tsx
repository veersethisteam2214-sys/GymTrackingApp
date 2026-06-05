import { AccessForm } from "@/components/AccessForm";

export default async function AccessPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <AccessForm hasError={params.error === "1"} nextPath={params.next ?? "/dashboard"} />
    </main>
  );
}
