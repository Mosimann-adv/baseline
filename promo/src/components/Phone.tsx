import type { ReactNode } from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme.ts";

export const PHONE_W = 540;
const BEZEL = 14;
export const SCREEN_W = PHONE_W - BEZEL * 2;
export const SCREEN_H = Math.round((SCREEN_W * 844) / 390);
export const PHONE_H = SCREEN_H + BEZEL * 2;
/** Converte px CSS da captura (tela de 390 de largura) para px da tela do celular no vídeo. */
export const K = SCREEN_W / 390;

/** Celular com as capturas em sequência (troca com fade de 8 quadros). Filhos ficam por cima da tela. */
export function Phone({
  shots,
  x = (1080 - PHONE_W) / 2,
  y = 500,
  scale = 1,
  children,
}: {
  shots: { src: string; at: number }[];
  x?: number;
  y?: number;
  scale?: number;
  children?: ReactNode;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: PHONE_W,
        height: PHONE_H,
        padding: BEZEL,
        borderRadius: 66,
        background: "#081a30",
        boxShadow: "0 40px 120px rgba(0,0,0,.45), inset 0 0 0 2px rgba(248,241,224,.12)",
        transform: `scale(${scale})`,
        transformOrigin: "50% 40%",
      }}
    >
      <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 52, overflow: "hidden", background: C.mare }}>
        {shots.map((shot) => (
          <Img
            key={`${shot.src}-${shot.at}`}
            src={staticFile(`captures/${shot.src}.png`)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: interpolate(frame, [shot.at, shot.at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        ))}
        {children}
      </div>
    </div>
  );
}
