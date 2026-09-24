import { useEffect, useState, type ButtonHTMLAttributes, type HTMLInputTypeAttribute, type ReactNode } from "react";

export function Screen({
  title,
  eyebrow,
  onBack,
  children,
}: {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <main className="screen">
      <div className="top-bar">
        {onBack && (
          <button type="button" className="back-button" onClick={onBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Voltar
          </button>
        )}
      </div>
      <div className="large-title-block">
        {eyebrow && <p className="subtitle">{eyebrow}</p>}
        <h1 className="large-title">{title}</h1>
      </div>
      {children}
    </main>
  );
}

export function Group({ header, footer, children }: { header?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="group-section">
      {header && <h2 className="group-header">{header}</h2>}
      <div className="group">{children}</div>
      {footer && <p className="group-footer">{footer}</p>}
    </section>
  );
}

export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  inputMode?: "text" | "email" | "numeric";
  maxLength?: number;
  placeholder?: string;
}) {
  // Senha com mostrar/ocultar: menos erro de digitação na tela mais frustrante do app.
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="row" htmlFor={id}>
      <span className="row-label">{label}</span>
      <span className="field-wrap">
        <input
          id={id}
          className="row-input"
          type={isPassword && reveal ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="field-reveal"
            aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={reveal}
            onClick={() => setReveal((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {reveal ? (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.7a2 2 0 002.9 2.9" />
                  <path d="M6.7 6.8C4.9 8 3.5 9.8 2.5 12c2 4.4 5.4 7 9.5 7 1.8 0 3.4-.5 4.9-1.4M10.2 5.2A9.9 9.9 0 0112 5c4.1 0 7.5 2.6 9.5 7-.5 1-1 2-1.7 2.9" />
                </>
              ) : (
                <>
                  <path d="M2.5 12C4.5 7.6 7.9 5 12 5s7.5 2.6 9.5 7c-2 4.4-5.4 7-9.5 7s-7.5-2.6-9.5-7z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </span>
    </label>
  );
}

export function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="row" htmlFor={id}>
      <span className="row-label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input id={id} type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className="segment"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="primary-button" />;
}

export function PlainButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="plain-button" />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  return (
    <p className={`notice ${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

/** Esqueleto leve para trocas de aba/lazy: evita o splash cheio que desmonta a tela. */
export function ListSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando">
      <div className="skeleton-hero" />
      <div className="skeleton-line" />
      <div className="skeleton-list" />
    </div>
  );
}

/** Número que sobe do zero até o valor, como os números de impacto do site. Pula direto com reduced-motion. */
export function CountUp({ value, duration = 600, suffix }: { value: number; duration?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}
