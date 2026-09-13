import { isDemo, requireSupabase } from "./supabase";
import { demoLoad } from "./demo";
import { isNative, shareJsonFile } from "./native";
import type { Athlete, SkillTestRecord, TrainingSession } from "./types";

/** Cópia dos dados da família (portabilidade e acesso, art. 18 da LGPD). */
export async function collectFamilyData(guardianId: string, email: string) {
  let athletes: Athlete[];
  let consents: unknown[];
  let sessions: TrainingSession[];
  let tests: SkillTestRecord[];

  if (isDemo) {
    const data = demoLoad();
    athletes = data.athletes.filter((a) => a.guardian_id === guardianId);
    const ids = new Set(athletes.map((a) => a.id));
    consents = data.consents.filter((c) => ids.has(c.athlete_id));
    sessions = data.sessions.filter((s) => s.guardian_id === guardianId);
    tests = data.tests.filter((t) => t.guardian_id === guardianId);
  } else {
    const client = requireSupabase();
    const [athletesRes, consentsRes, sessionsRes, testsRes] = await Promise.all([
      client.from("athletes").select("*").eq("guardian_id", guardianId).order("created_at"),
      client.from("consents").select("*").eq("guardian_id", guardianId).order("accepted_at"),
      client.from("training_sessions").select("*").eq("guardian_id", guardianId).order("performed_on"),
      client.from("skill_tests").select("*").eq("guardian_id", guardianId).order("tested_on"),
    ]);
    const failed = athletesRes.error ?? consentsRes.error ?? sessionsRes.error ?? testsRes.error;
    if (failed) throw failed;
    athletes = athletesRes.data as Athlete[];
    consents = consentsRes.data ?? [];
    sessions = sessionsRes.data as TrainingSession[];
    tests = testsRes.data as SkillTestRecord[];
  }

  return {
    app: "Baseline",
    exportado_em: new Date().toISOString(),
    aviso: "Arquivo gerado pela tela Conta do Baseline. Pode conter dados de crianças e adolescentes: guarde em local seguro.",
    conta: { email },
    atletas: athletes,
    autorizacoes: consents,
    treinos: sessions,
    testes: tests,
  };
}

/** Compartilha o arquivo quando o aparelho permite; senão, baixa. */
export async function saveJsonFile(data: unknown, fileName: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const text = JSON.stringify(data, null, 2);
  if (isNative) {
    try {
      return await shareJsonFile(fileName, text);
    } catch {
      // Cai no download da web view se o plugin falhar.
    }
  }
  const file = new File([text], fileName, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Dados do Baseline" });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Compartilhamento indisponível neste contexto: segue para o download.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
