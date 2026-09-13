import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

/** Botão voltar do Android chama o `onBack` da tela aberta. No começo do fluxo, sai do app. */
export function listenBackButton(handler: () => boolean): () => void {
  if (!isNative) return () => undefined;
  let remove = () => undefined;
  void import("@capacitor/app")
    .then(({ App }) => {
      const sub = App.addListener("backButton", ({ canGoBack }) => {
        const handled = handler();
        if (handled) return;
        if (!canGoBack) void App.exitApp();
      });
      remove = () => {
        void sub.then((listener) => listener.remove());
      };
    })
    .catch(() => undefined);
  return () => remove();
}

export async function keepAwake(active: boolean): Promise<void> {
  if (!isNative) return;
  try {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    if (active) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
  } catch {
    // Plugin ausente: o Wake Lock da web cobre o Chrome; no WebView antigo a tela pode apagar.
  }
}

/** Cópia dos dados no Android: grava no cache e abre o compartilhamento nativo. */
export async function shareJsonFile(fileName: string, contents: string): Promise<"shared" | "downloaded" | "cancelled"> {
  if (!isNative) return "downloaded";
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const written = await Filesystem.writeFile({
      path: fileName,
      data: btoa(unescape(encodeURIComponent(contents))),
      directory: Directory.Cache,
    });
    await Share.share({ title: "Dados do Baseline", url: written.uri, dialogTitle: "Enviar cópia dos dados" });
    return "shared";
  } catch (err) {
    if (err instanceof Error && /cancel/i.test(err.message)) return "cancelled";
    throw err;
  }
}
