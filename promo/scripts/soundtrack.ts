import { mkdirSync, writeFileSync } from "node:fs";
import { buildTrack, encodeWav } from "../src/audio.ts";

mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/trilha.wav", import.meta.url), encodeWav(buildTrack()));
console.log("trilha gravada em public/trilha.wav");
