/** Bola do app. `squashAmount` 0–1 achata na vertical e alarga na horizontal. */
export function Ball({ size, squashAmount = 0, rotate = 0 }: { size: number; squashAmount?: number; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ transform: `scale(${1 + squashAmount * 0.6}, ${1 - squashAmount})`, transformOrigin: "50% 100%" }}
    >
      <g transform={`rotate(${rotate} 16 16)`}>
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
  );
}
