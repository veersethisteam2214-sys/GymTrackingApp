import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <LoginForm mode={params.mode} message={params.message} />
    </main>
  );
}
