import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileLoginForm } from "@/components/ProfileLoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("gym_access_granted")?.value !== "true") {
    redirect("/access?next=/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <ProfileLoginForm />
    </main>
  );
}
