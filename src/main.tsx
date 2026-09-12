import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./state/auth";
import { isDemo } from "./lib/supabase";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isDemo && (
      <p className="demo-banner" role="note">
        Modo demonstração · os dados ficam só neste navegador
      </p>
    )}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
