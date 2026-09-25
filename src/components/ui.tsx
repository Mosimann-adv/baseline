import { useEffect, useRef, useState, type ButtonHTMLAttributes, type HTMLInputTypeAttribute, type ReactNode } from "react";

export function Screen({
  title,
  eyebrow,
  titleAside,
  onBack,
  children,
}: {
  title: string;
  eyebrow?: string;
  /** Enfeite ao lado do título (ex.: a bola quicando na aba Treinos). */
  titleAside?: ReactNode;
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
        {titleAside ? (
          <div className="large-title-row">
            <h1 className="large-title">{title}</h1>
            {titleAside}
          </div>
        ) : (
          <h1 className="large-title">{title}</h1>
        )}
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
  // Roving tabindex: só o selecionado (ou o primeiro, quando nada está marcado) entra na ordem de tabulação;
  // as setas escolhem e levam o foco junto, com volta pelo fim.
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          tabIndex={value === option.value || (value === null && index === 0) ? 0 : -1}
          className="segment"
          onClick={() => onChange(option.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              move(index, 1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              move(index, -1);
            }
          }}
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

/** Bola de basquete parada no chão; um toque faz ela quicar três vezes. Parada quando o aparelho pede menos movimento. */
export function BouncingBall() {
  // "round" remonta a bola a cada toque, para a animação recomeçar do chão mesmo no meio de um quique.
  const [round, setRound] = useState(0);
  return (
    <button
      type="button"
      className="bouncing-ball"
      aria-label="Quicar a bola"
      onClick={() => {
        navigator.vibrate?.(10);
        setRound((r) => r + 1);
      }}
    >
      <span key={round} className={`bouncing-ball-stage${round > 0 ? " bouncing" : ""}`} aria-hidden="true">
        <svg className="bouncing-ball-ball" viewBox="0 0 32 32">
          <g className="bouncing-ball-spin">
            <circle cx="16" cy="16" r="14.5" fill="#eea047" stroke="#0b2340" strokeWidth="1.6" />
            <path
              d="M16 1.5v29M1.5 16h29M6 5.6c4.2 4.6 4.2 16.2 0 20.8M26 5.6c-4.2 4.6-4.2 16.2 0 20.8"
              fill="none"
              stroke="#0b2340"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        </svg>
        <span className="bouncing-ball-shadow" />
      </span>
    </button>
  );
}
