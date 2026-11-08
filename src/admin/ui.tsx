import { useId, type ComponentProps, type ReactNode } from "react";
import { Link } from "react-router";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/data/catalog";
import { DOT, STATUS_TONE, TONE, type Tone } from "@/admin/tones";
import { cx } from "@/lib/cx";

/* Componentes do painel. Mesmos tokens da loja (cobre, carvão, alabastro, cantos
   arredondados, sem sombras), com densidade de interface de trabalho. */

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        {back && (
          <Link to={back.to} className="text-[13px] font-medium text-muted hover:text-charcoal">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-[24px] leading-[30px] font-bold tracking-[-.02em]">{title}</h1>
        {subtitle && <p className="text-[14px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName = "p-4 sm:p-5",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("rounded-card border border-line bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 rounded-t-card border-b border-line bg-copper-tint/60 px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-0.5">
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {description && <p className="text-[13px] text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-copper text-white hover:bg-copper-hover active:bg-copper-active disabled:bg-disabled-bg disabled:text-disabled-fg",
  secondary: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-white",
  ghost: "text-charcoal hover:bg-icon-btn",
  danger: "border border-error text-error hover:bg-error hover:text-white",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
        size === "md" ? "h-11 px-5 text-[15px]" : "h-9 px-3.5 text-[14px]",
        BTN[variant],
        className,
      )}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <Link
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
        size === "md" ? "h-11 px-5 text-[15px]" : "h-9 px-3.5 text-[14px]",
        BTN[variant],
        className,
      )}
    />
  );
}

const inputBase =
  "w-full rounded-field border bg-white px-3.5 text-[16px] text-charcoal outline-none transition-[border-color] duration-150 focus:border-copper focus-visible:outline-none disabled:bg-out-bg";

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-body-2">
        {label}
      </label>
      {children}
      {error ? (
        <span id={`${id}-msg`} className="text-[12px] font-medium text-error">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-msg`} className="text-[12px] text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  prefix,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; hint?: ReactNode; error?: string; prefix?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          {...props}
          className={cx(inputBase, "h-11", prefix && "pl-10", error ? "border-error" : "border-line")}
        />
      </div>
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & { label: ReactNode; hint?: ReactNode; error?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={4}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        {...props}
        className={cx(inputBase, "py-2.5 leading-[22px]", error ? "border-error" : "border-line")}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  hint,
  error,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { label: ReactNode; hint?: ReactNode; error?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        {...props}
        className={cx(inputBase, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", error ? "border-error" : "border-line")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232C2C2C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cx("flex items-start gap-3", disabled ? "opacity-60" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 h-6 w-10 flex-none rounded-full transition-colors duration-150",
          checked ? "bg-copper" : "bg-[#D5D3D0]",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-150",
            checked && "translate-x-4",
          )}
        />
      </button>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-medium">{label}</span>
        {description && <span className="text-[13px] text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-display text-[17px] font-semibold">{title}</p>
      {children && <div className="text-[14px] text-muted">{children}</div>}
    </div>
  );
}

/** Abas simples (pílulas), com contador opcional. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; count?: number; tone?: Tone }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cx(
              "flex h-9 flex-none items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium whitespace-nowrap",
              active
                ? "border-copper-ink bg-copper-ink text-white"
                : "border-line bg-white text-charcoal hover:border-copper hover:bg-copper-tint",
            )}
          >
            {it.tone && (
              <span
                aria-hidden="true"
                className={cx("size-2 rounded-full", active ? "bg-white" : DOT[it.tone])}
              />
            )}
            {it.label}
            {it.count !== undefined && (
              <span className={cx("text-[12px]", active ? "text-white/75" : "text-muted")}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
