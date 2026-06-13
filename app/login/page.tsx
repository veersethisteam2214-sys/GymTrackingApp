import { BrandMark } from "@/components/BrandLogo";
import { ProfileLoginForm } from "@/components/ProfileLoginForm";

export default async function LoginPage() {
  return (
    <main className="a-enter flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-4">
          <BrandMark className="size-20" />
          <div className="hidden app-surface size-12 place-items-center rounded-[13px]" style={{ borderColor: "var(--line-2)" }}>
            <span className="display-font text-2xl italic" style={{ color: "var(--brand)" }}>
              L
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: "var(--muted)" }}>
            By invitation · 13 seats
          </p>
        </div>
        <div className="text-center">
          <p className="display-font text-2xl italic leading-none" style={{ color: "var(--muted)", fontWeight: 500 }}>
            the
          </p>
          <h1 className="display-font mt-1 text-6xl leading-[0.92] tracking-[-0.015em] text-app">Locked In</h1>
          <div className="mx-auto mt-5 h-px w-8" style={{ background: "var(--brand)" }} />
        </div>
        <ProfileLoginForm />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          Discipline is the door fee
        </p>
      </div>
    </main>
  );
}
