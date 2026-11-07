import { useId, useState, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

/** Campo com rótulo flutuante (56px, raio 14, texto 16px para não dar zoom no iOS). */
export function FloatingField({
  label,
  value,
  onChange,
  error,
  placeholder,
  span = 2,
  type = "text",
  inputMode,
  autoComplete,
  name,
}: {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  error?: string;
  placeholder?: string;
  /** Colunas ocupadas no grid de 2 colunas; "auto" não define (para grids próprios). */
  span?: 1 | 2 | "auto";
  type?: "text" | "email" | "tel";
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  name?: string;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const up = focused || value.length > 0;
  const tone = error ? "error" : focused ? "focus" : "rest";

  return (
    <div className={cx("relative flex flex-col gap-1", span === 2 && "col-span-2", span === 1 && "col-span-1")}>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        placeholder={focused ? placeholder : ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cx(
          "h-14 w-full rounded-field border bg-white px-3.5 pt-[22px] pb-1.5 text-[16px] text-charcoal outline-none transition-[border-color] duration-150 focus-visible:outline-none",
          tone === "error" ? "border-error" : tone === "focus" ? "border-copper" : "border-line",
        )}
      />
      <label
        htmlFor={id}
        className={cx(
          "pointer-events-none absolute left-[15px] transition-all duration-150",
          up ? "top-2 text-[11px] font-medium" : "top-[18px] text-[15px] font-normal",
          tone === "error" ? "text-error" : tone === "focus" ? "text-copper-ink" : "text-muted",
        )}
      >
        {label}
      </label>
      {error && (
        <span id={`${id}-err`} className="text-[12px] font-medium text-error">
          {error}
        </span>
      )}
    </div>
  );
}
