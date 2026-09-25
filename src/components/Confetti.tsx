import { useMemo } from "react";

// Confete de chegada: partículas efêmeras nas cores do kit, só visual (aria-hidden).
// prefers-reduced-motion anula a animação e elas somem.
const CONFETTI_COLORS = ["#f3c44b", "#eea047", "#d96953", "#7db8e8", "#f8f1e0"];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 700),
        duration: 1600 + Math.round(Math.random() * 1200),
        size: 6 + Math.round(Math.random() * 6),
        drift: Math.round((Math.random() - 0.5) * 120),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
