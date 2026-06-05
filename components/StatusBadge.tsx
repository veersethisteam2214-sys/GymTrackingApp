import { Check, Minus, ShieldCheck } from "lucide-react";
import { statusTone } from "@/lib/status";
import type { DailyStatus, ItemStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: DailyStatus | ItemStatus }) {
  const Icon = status === "uploaded" || status === "complete" ? Check : status === "excused" ? ShieldCheck : Minus;
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-bold capitalize ${statusTone(
        status === "uploaded" ? "uploaded" : status === "excused" ? "excused" : (status as DailyStatus)
      )}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {status}
    </span>
  );
}

