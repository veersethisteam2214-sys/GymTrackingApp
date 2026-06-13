export function BrandLogo({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <BrandMark className="size-12 sm:size-14" />
      <div className="min-w-0">
        <p className="display-font truncate text-2xl font-extrabold uppercase leading-none sm:text-3xl" style={{ color: "var(--chrome-ink)" }}>
          LOCKED IN
        </p>
        <p className="truncate text-[11px] font-bold uppercase" style={{ color: "var(--muted)" }}>
          {title}
          {subtitle ? <span className="hidden sm:inline"> / {subtitle}</span> : null}
        </p>
      </div>
    </div>
  );
}

export function BrandMark({ className = "size-12" }: { className?: string }) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl ${className}`}
      style={{
        background: "linear-gradient(145deg, #111820 0%, #05070a 58%, #1b2023 100%)",
        border: "1px solid rgba(216, 195, 154, 0.42)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 28px rgba(0,0,0,0.35)"
      }}
      aria-hidden
    >
      <svg viewBox="0 0 96 96" className="size-full" role="img">
        <defs>
          <linearGradient id="locked-gold" x1="22" y1="14" x2="76" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f4dfaa" />
            <stop offset="0.5" stopColor="#d8c39a" />
            <stop offset="1" stopColor="#8f7542" />
          </linearGradient>
          <linearGradient id="locked-metal" x1="18" y1="8" x2="82" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c8cbc2" />
            <stop offset="0.45" stopColor="#626861" />
            <stop offset="1" stopColor="#171c1f" />
          </linearGradient>
          <linearGradient id="locked-blue" x1="18" y1="78" x2="82" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ea8fe" />
            <stop offset="1" stopColor="#d8c39a" />
          </linearGradient>
        </defs>
        <path
          d="M48 8 76 20 88 48 76 76 48 88 20 76 8 48 20 20 48 8Z"
          fill="#11171d"
          stroke="url(#locked-metal)"
          strokeWidth="5"
        />
        <path
          d="M30 42V34c0-11 7-20 18-20s18 9 18 20v8"
          fill="none"
          stroke="url(#locked-metal)"
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path
          d="M25 39h46c4 0 7 3 7 7v24c0 4-3 7-7 7H25c-4 0-7-3-7-7V46c0-4 3-7 7-7Z"
          fill="#20262a"
          stroke="#05070a"
          strokeWidth="3"
        />
        <path
          d="M34 25c4-8 12-13 21-10"
          fill="none"
          stroke="url(#locked-blue)"
          strokeLinecap="round"
          strokeWidth="3"
          opacity="0.8"
        />
        <path
          d="M35 26h19l-9 35h20l-4 13H23l10-39h-9l3-9h8Z"
          fill="url(#locked-gold)"
          stroke="#05070a"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path d="M57 53h18" stroke="url(#locked-gold)" strokeLinecap="round" strokeWidth="4" />
        <path d="M60 47v12M72 47v12" stroke="#d8c39a" strokeLinecap="round" strokeWidth="3" />
      </svg>
    </div>
  );
}
