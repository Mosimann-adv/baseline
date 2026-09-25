import { Component, type ReactNode } from "react";

interface BoundaryState {
  broken: boolean;
}

// Última rede de proteção: sem ela, uma exceção no render desmonta o app inteiro e o
// usuário fica na tela branca — pior no Android, onde não existe botão de recarregar.
// Markup próprio de propósito: se a tela quebrou, o fallback não pode depender dela.
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { broken: false };

  static getDerivedStateFromError(): BoundaryState {
    return { broken: true };
  }

  render() {
    if (!this.state.broken) return this.props.children;
    return (
      <main className="splash broken-screen" role="alert">
        <h1>Algo saiu do trilho</h1>
        <p>
          Não era para isso acontecer. Recarregar costuma resolver; se não resolver, conte para a gente no WhatsApp.
        </p>
        <button type="button" className="primary-button" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </main>
    );
  }
}
