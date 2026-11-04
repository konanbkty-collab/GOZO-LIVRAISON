import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

/* Primitives UI partagées — style GOZO */

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary: "bg-gozo-700 text-white hover:bg-gozo-800 shadow-md shadow-gozo-700/20",
    gold: "bg-gold-400 text-gozo-900 hover:bg-gold-300 shadow-md shadow-gold-500/30",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    outline: "border-2 border-gozo-700 text-gozo-700 hover:bg-gozo-50",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-5 py-3.5 text-base rounded-2xl",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}>{children}</div>
  );
}

export function Input({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-gozo-800">{label}</span>}
      <input
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-gozo-950 outline-none transition focus:border-gozo-500 focus:bg-white focus:ring-4 focus:ring-gozo-100 sm:text-sm ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-gozo-800">{label}</span>}
      <select
        className={`w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-gozo-950 outline-none transition focus:border-gozo-500 focus:bg-white focus:ring-4 focus:ring-gozo-100 sm:text-sm ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  const meta = ORDER_STATUSES[status as OrderStatus];
  const cls = meta?.color ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cls} ${className}`}>
      <span>{meta?.icon ?? "•"}</span>
      {meta?.short ?? status}
    </span>
  );
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gozo-50 px-2.5 py-1 text-xs font-bold text-gozo-700 ${className}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold tracking-tight text-gozo-900">{children}</h2>
      {right}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function EmptyState({ icon, title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
      <span className="text-4xl">{icon ?? "📭"}</span>
      <p className="font-bold text-gozo-800">{title}</p>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

/** Fond dégradé « bleu GOZO » utilisé pour les en-têtes. */
export function GozoHeader({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-gozo-800 via-gozo-700 to-gozo-900 ${className}`}>{children}</div>
  );
}
