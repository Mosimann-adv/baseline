import { useEffect, useRef, useState } from "react";
import type { Drill } from "../lib/types";

const ORIGIN = "https://www.youtube-nocookie.com";

/** Um player por demonstração, preservado na troca descanso → exercício. */
export function ExerciseVideo({ video, playing = false }: { video: NonNullable<Drill["video"]>; playing?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const command = (func: string, args: unknown[] = []) => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), ORIGIN);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => {
    setReady(false);
    setFailed(false);
    let lastSeek = 0;
    const timer = window.setTimeout(() => setFailed(true), 12000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== ORIGIN || event.source !== frame.current?.contentWindow) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.event === "onError") { setFailed(true); return; }
        if (["onReady", "infoDelivery", "initialDelivery", "onStateChange"].includes(data.event)) {
          window.clearTimeout(timer);
          setReady(true);
          setFailed(false);
        }
        if (data.event === "onReady") command(playingRef.current ? "playVideo" : "pauseVideo");
        const time = Number(data.info?.currentTime);
        const start = video.start ?? 0;
        if (playingRef.current && Date.now() - lastSeek > 1500 &&
          ((data.event === "onStateChange" && data.info === 0) || (Number.isFinite(time) && (time + 1.5 < start || (video.end !== undefined && time >= video.end))))) {
          lastSeek = Date.now();
          command("seekTo", [start, true]);
          command("playVideo");
        }
      } catch { /* Mensagens de outros recursos do player não são comandos. */ }
    };
    window.addEventListener("message", receive);
    return () => { window.clearTimeout(timer); window.removeEventListener("message", receive); };
  }, [video.id, video.start, video.end, attempt, online]);
  useEffect(() => { if (ready) command(playing ? "playVideo" : "pauseVideo"); }, [playing, ready]);

  const params = new URLSearchParams({ rel: "0", playsinline: "1", enablejsapi: "1", mute: "1", loop: "1", playlist: video.id });
  if (video.start) params.set("start", String(video.start));
  if (video.end) params.set("end", String(video.end));
  if (location.origin.startsWith("http")) params.set("origin", location.origin);
  return (
    <div className="video-block exercise-video">
      {online && <div className="video-frame"><iframe key={`${video.id}-${attempt}`} ref={frame} src={`${ORIGIN}/embed/${video.id}?${params}`}
        title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => {
          frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), ORIGIN);
          command("addEventListener", ["onReady"]);
          command("addEventListener", ["onStateChange"]);
          command("addEventListener", ["onError"]);
        }} /></div>}
      {(!online || failed) && <p className="video-hint" role="status">{online ? "O vídeo não respondeu. Você pode seguir a dica e tentar de novo." : "Sem internet para o vídeo. A dica do movimento continua disponível."}</p>}
      {online && failed && <button type="button" className="plain-button" onClick={() => setAttempt((value) => value + 1)}>Tentar vídeo de novo</button>}
      <a className="plain-link" href={`https://www.youtube.com/watch?v=${video.id}${video.start ? `&t=${video.start}s` : ""}`} target="_blank" rel="noopener noreferrer">Abrir no YouTube</a>
    </div>
  );
}
