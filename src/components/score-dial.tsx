import { cn } from "@/lib/utils";

export function ScoreDial({
  value,
  size = 96,
  label,
  className,
}: {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const tone =
    clamped >= 75 ? "var(--success)" : clamped >= 50 ? "var(--warning)" : "var(--destructive)";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${tone} ${clamped * 3.6}deg, var(--muted) 0deg)`,
        }}
      >
        <div
          className="grid place-items-center rounded-full bg-card font-display font-semibold"
          style={{ width: size - 10, height: size - 10, fontSize: Math.max(12, size / 4) }}
        >
          {clamped}
        </div>
      </div>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </div>
  );
}
