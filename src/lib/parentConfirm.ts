import { isDemo, requireSupabase } from "./supabase";
import { demoParentStatus, demoRegisterParent, demoConfirmParent } from "./demo";
import type { AccountKind } from "./account";

export interface ParentStatus {
  parentEmail: string | null;
  confirmed: boolean;
  /** Código em aberto, para o adolescente mostrar ao responsável. Some depois da confirmação. */
  code: string | null;
}

function fallback(kind?: AccountKind): ParentStatus {
  return { parentEmail: null, confirmed: kind !== "teen", code: null };
}

function sixDigits(): string {
  return String(100000 + Math.floor(Math.random() * 900000));
}

export async function loadParentStatus(userId: string, kind?: AccountKind): Promise<ParentStatus> {
  if (isDemo) return demoParentStatus(userId);
  try {
    const { data, error } = await requireSupabase().rpc("parent_confirmation_status");
    if (error) return fallback(kind);
    const row = data as { parent_email?: string; confirmed?: boolean; code?: string | null } | null;
    if (!row) return fallback(kind);
    return {
      parentEmail: row.parent_email ?? null,
      confirmed: Boolean(row.confirmed),
      code: row.code ?? null,
    };
  } catch {
    return fallback(kind);
  }
}

export async function registerParentEmail(userId: string, parentEmail: string): Promise<ParentStatus> {
  const email = parentEmail.trim().toLowerCase();
  const code = sixDigits();
  if (isDemo) return demoRegisterParent(userId, email, code);
  const { data, error } = await requireSupabase().rpc("register_parent_email", {
    p_parent_email: email,
    p_code: code,
  });
  if (error) throw error;
  const row = data as { parent_email?: string; confirmed?: boolean; code?: string | null } | null;
  return {
    parentEmail: row?.parent_email ?? email,
    confirmed: Boolean(row?.confirmed),
    code: row?.code ?? code,
  };
}

/** Página pública: o responsável confirma com o e-mail dele e o código do adolescente. */
export async function confirmParentCode(parentEmail: string, code: string): Promise<boolean> {
  const email = parentEmail.trim().toLowerCase();
  const trimmed = code.trim();
  if (isDemo) return demoConfirmParent(email, trimmed);
  const { data, error } = await requireSupabase().rpc("confirm_parent_code", {
    p_parent_email: email,
    p_code: trimmed,
  });
  if (error) throw error;
  return Boolean(data);
}
