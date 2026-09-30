import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./state/auth";
import { isDemo } from "./lib/supabase";
import "./styles.css";
import { isNative } from "./lib/native";

if (import.meta.env.PROD && !isNative && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { void navigator.serviceWorker.register("./sw.js").catch(() => undefined); });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isDemo && (
      <p className="demo-banner" role="note">
        Modo demonstração · os dados ficam só neste navegador
      </p>
    )}
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
