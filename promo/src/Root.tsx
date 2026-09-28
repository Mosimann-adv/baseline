import { Composition } from "remotion";
import { Video } from "./Video.tsx";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./timeline.ts";
import "./theme.ts";

export const Root = () => <Composition id="Baseline" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />;
