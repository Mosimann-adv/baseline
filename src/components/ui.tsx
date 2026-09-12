import type { ButtonHTMLAttributes, HTMLInputTypeAttribute, ReactNode } from "react";

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
  return (
    <label className="row" htmlFor={id}>
      <span className="row-label">{label}</span>
      <input
        id={id}
        className="row-input"
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
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
