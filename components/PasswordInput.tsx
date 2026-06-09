"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  label,
  name,
  autoComplete,
  required = true,
  placeholder
}: {
  label: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      <div
        className="flex min-h-12 items-center gap-2 rounded-2xl border px-4 focus-within:ring-4"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
      >
        <input
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base text-app outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="app-button grid size-9 shrink-0 place-items-center rounded-xl text-muted"
          style={{ background: "var(--surface-soft)" }}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </label>
  );
}
