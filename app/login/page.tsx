import { LockKeyhole } from "lucide-react";
import { ProfileLoginForm } from "@/components/ProfileLoginForm";

export default async function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="reveal-in mb-6 flex flex-col items-center gap-3">
        <div
          className="brand-gradient brand-mark relative grid size-16 place-items-center overflow-hidden rounded-3xl text-black"
          aria-hidden
        >
          <div className="absolute inset-0 bg-white/18" />
          <LockKeyhole className="relative z-10 size-8 drop-shadow-sm" strokeWidth={3} />
        </div>
        <p className="display-font brand-wordmark text-4xl font-extrabold uppercase leading-none tracking-[0.2em]" style={{ color: "var(--brand)" }}>
          LOCKED IN
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-muted">Discipline. Proof. Daily.</p>
      </div>
      <ProfileLoginForm />
    </main>
  );
}
