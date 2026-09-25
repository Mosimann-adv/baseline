import { lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { useAuth } from "./state/auth";
import { useAthletes } from "./state/athletes";
import { useSessions } from "./state/sessions";
import { useTests } from "./state/tests";
import { isSupabaseConfigured } from "./lib/supabase";
import { activeConsent } from "./lib/consent";
import { canCreateMinorProfiles, metaFromSession } from "./lib/account";
import { listenBackButton } from "./lib/native";
import { pendingSummary } from "./lib/offlineQueue";
import type { ResumeState } from "./lib/resumeSession";
import { loadParentStatus, registerParentEmail, type ParentStatus } from "./lib/parentConfirm";
import { ageThisYear, bandFor } from "./lib/age";
import { isTestDue } from "./lib/progress";
import { programById } from "./content/programs";
import { LEGAL_DOCS, legalIdFromHash, type LegalId } from "./content/legal";
import { LegalScreen } from "./screens/LegalScreen";
import { ConfirmParent } from "./screens/ConfirmParent";
import { TabBar, type TabId } from "./components/TabBar";
import { ListSkeleton, Notice, PrimaryButton, Screen } from "./components/ui";
import type { Athlete } from "./lib/types";

// Telas fora do caminho crítico carregam sob demanda: a primeira pintura fica leve
// e o vendor (react/supabase) não se mistura com o código das telas no cache.
// Depois de um deploy, o index.html em cache pode pedir um chunk que não existe mais:
// um recarregamento resolve (uma vez só, para não virar loop offline).
function lazyScreen<T extends ComponentType<any>>(load: () => Promise<{ default: T }>): LazyExoticComponent<T> {
  const flag = "baseline.chunkReload";
  return lazy(() =>
    load().then(
      (mod) => {
        sessionStorage.removeItem(flag);
        return mod;
      },
      (err: unknown) => {
        if (navigator.onLine && !sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, "1");
          window.location.reload();
        }
        throw err;
      },
    ),
  );
}

const AuthFlow = lazyScreen(() => import("./screens/AuthScreens").then((m) => ({ default: m.AuthFlow })));
const NewAthlete = lazyScreen(() => import("./screens/NewAthlete").then((m) => ({ default: m.NewAthlete })));
const ProfileChoice = lazyScreen(() => import("./screens/ProfileChoice").then((m) => ({ default: m.ProfileChoice })));
const WhoTrains = lazyScreen(() => import("./screens/WhoTrains").then((m) => ({ default: m.WhoTrains })));
const AthleteHome = lazyScreen(() => import("./screens/AthleteHome").then((m) => ({ default: m.AthleteHome })));
const Channel = lazyScreen(() => import("./screens/Channel").then((m) => ({ default: m.Channel })));
const ProgramDetail = lazyScreen(() => import("./screens/ProgramDetail").then((m) => ({ default: m.ProgramDetail })));
const TrainingSession = lazyScreen(() => import("./screens/TrainingSession").then((m) => ({ default: m.TrainingSession })));
const TestSession = lazyScreen(() => import("./screens/TestSession").then((m) => ({ default: m.TestSession })));
const Progress = lazyScreen(() => import("./screens/Progress").then((m) => ({ default: m.Progress })));
const GuardianArea = lazyScreen(() => import("./screens/GuardianArea").then((m) => ({ default: m.GuardianArea })));

function LazyFallback() {
  return (
    <Screen title="Carregando">
      <ListSkeleton />
    </Screen>
  );
}

type Origin = "first" | "account";

type View =
  | { name: "picker" }
  | { name: "account" }
  | { name: "newSelf"; from: Origin }
  | { name: "newAthlete"; from: Origin }
  | { name: "athlete"; athleteId: string }
  | { name: "program"; athleteId: string; programId: string }
  | { name: "training"; athleteId: string; programId: string; resume?: ResumeState }
  | { name: "progress"; athleteId: string }
  | { name: "videos"; athleteId: string }
  | { name: "tests"; athleteId: string };

const lastAthleteKey = (guardianId: string) => `baseline.athlete.${guardianId}`;

function publicRouteFromHash(hash: string): LegalId | "confirmar-responsavel" | null {
  const id = hash.replace(/^#\/?/, "");
  if (id === "confirmar-responsavel") return "confirmar-responsavel";
  return legalIdFromHash(hash);
}

export default function App() {
  const { session, loading, authError } = useAuth();
  const [publicDoc, closePublicDoc] = usePublicDoc();

  // Endereços públicos (#/privacidade, #/termos, #/excluir-conta, #/confirmar-responsavel) abrem sem login.
  if (publicDoc === "confirmar-responsavel") {
    return <ConfirmParent onBack={closePublicDoc} />;
  }
  if (publicDoc) {
    return (
      <LegalScreen doc={LEGAL_DOCS[publicDoc]} onBack={closePublicDoc}>
        {publicDoc === "excluir-conta" && (
          <div className="stack legal-cta">
            <PrimaryButton onClick={closePublicDoc}>{session ? "Abrir o Baseline" : "Entrar para excluir a conta"}</PrimaryButton>
          </div>
        )}
      </LegalScreen>
    );
  }

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <Splash />;
  if (authError) return <AuthBroken />;
  if (!session) return <AuthFlow />;
  return <Family key={session.user.id} guardianId={session.user.id} email={session.user.email ?? ""} />;
}

function usePublicDoc(): [LegalId | "confirmar-responsavel" | null, () => void] {
  const [doc, setDoc] = useState<LegalId | "confirmar-responsavel" | null>(() => publicRouteFromHash(window.location.hash));

  useEffect(() => {
    const sync = () => setDoc(publicRouteFromHash(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const close = () => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setDoc(null);
  };
  return [doc, close];
}

function Family({ guardianId, email }: { guardianId: string; email: string }) {
  const { session, signOut } = useAuth();
  const meta = metaFromSession(session);
  const family = useAthletes(guardianId);
  const training = useSessions(guardianId);
  const skill = useTests(guardianId);
  const [parent, setParent] = useState<ParentStatus>({ parentEmail: meta.parentEmail, confirmed: meta.kind !== "teen", code: null });
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem(lastAthleteKey(guardianId));
    return saved ? { name: "athlete", athleteId: saved } : { name: "picker" };
  });
  // Memória do último atleta aberto: mantém as abas funcionando na tela "Quem vai treinar?".
  const [lastAthleteId, setLastAthleteId] = useState<string | null>(() => localStorage.getItem(lastAthleteKey(guardianId)));

  useEffect(() => {
    if ("athleteId" in view) {
      localStorage.setItem(lastAthleteKey(guardianId), view.athleteId);
      setLastAthleteId(view.athleteId);
    }
  }, [view, guardianId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.name]);

  // Depois da primeira carga bem-sucedida, falha de reload vira aviso — não derruba a tela aberta.
  const [loadedOnce, setLoadedOnce] = useState(false);
  useEffect(() => {
    if (!family.loading && !training.loading && !skill.loading && !(family.error ?? training.error ?? skill.error)) {
      setLoadedOnce(true);
    }
  }, [family.loading, training.loading, skill.loading, family.error, training.error, skill.error]);

  useEffect(() => {
    if (meta.kind !== "teen") return;
    void loadParentStatus(guardianId, meta.kind).then(async (status) => {
      if (!status.confirmed && !status.code && meta.parentEmail) {
        try {
          setParent(await registerParentEmail(guardianId, meta.parentEmail));
          return;
        } catch {
          setParent(status);
          return;
        }
      }
      setParent(status);
    });
  }, [guardianId, meta.kind, meta.parentEmail]);

  useEffect(() => {
    return listenBackButton(() => {
      if (view.name === "picker") return false;
      if (view.name === "account" || view.name === "athlete") {
        setView({ name: "picker" });
        return true;
      }
      if (view.name === "newSelf" || view.name === "newAthlete") {
        setView(view.from === "first" ? { name: "picker" } : { name: "account" });
        return true;
      }
      if ("athleteId" in view) {
        setView({ name: "athlete", athleteId: view.athleteId });
        return true;
      }
      return false;
    });
  }, [view]);

  if (family.loading || training.loading || skill.loading) return <Splash />;
  const loadError = family.error ?? training.error ?? skill.error;
  const retryLoads = () => void Promise.all([family.reload(), training.reload(), skill.reload()]);
  // Sem dados nenhum, a tela de erro é a única saída honesta.
  if (loadError && !loadedOnce) {
    return (
      <Screen title={loadError.startsWith("Sem conexão") ? "Sem conexão" : "Algo não funcionou"}>
        <div className="stack">
          <Notice tone="error">{loadError}</Notice>
          <PrimaryButton onClick={retryLoads}>Tentar de novo</PrimaryButton>
        </div>
      </Screen>
    );
  }
  // Com dados já em memória, a falha de atualização vira aviso no topo e a tela segue usável.
  const staleBanner =
    loadError && loadedOnce ? (
      <div className="stale-banner" role="status">
        <p>Não conseguimos atualizar. Você está vendo os dados salvos no aparelho.</p>
        <button type="button" className="secondary-button" onClick={retryLoads}>
          Tentar de novo
        </button>
      </div>
    ) : null;

  const canTrain = (athlete: Athlete) => {
    if (meta.kind === "teen" && athlete.is_self && !parent.confirmed) return false;
    return Boolean(activeConsent(family.consents, athlete));
  };
  const backTo = (from: Origin): View => (from === "first" ? { name: "picker" } : { name: "account" });
  const allowMinors = canCreateMinorProfiles(meta.kind);

  const toPicker = () => {
    localStorage.removeItem(lastAthleteKey(guardianId));
    setView({ name: "picker" });
  };

  // Abas do rodapé: só existem com um atleta válido em memória.
  const tabAthlete = family.athletes.find((a) => a.id === lastAthleteId && canTrain(a));
  // Pontinho na Evolução quando os testes estão na hora (a chamada saiu da aba Treinos).
  const tabTestDue =
    !!tabAthlete &&
    bandFor(ageThisYear(tabAthlete.birth_year)) !== null &&
    isTestDue(skill.tests.filter((t) => t.athlete_id === tabAthlete.id));
  const onTab = (tab: TabId) => {
    if (!tabAthlete) return;
    if (tab === "profile") {
      toPicker();
      return;
    }
    if (tab === "progress") {
      setView({ name: "progress", athleteId: tabAthlete.id });
      return;
    }
    if (tab === "videos") {
      setView({ name: "videos", athleteId: tabAthlete.id });
      return;
    }
    setView({ name: "athlete", athleteId: tabAthlete.id });
  };
  const withTabs = (node: ReactNode, current: TabId): ReactNode =>
    tabAthlete ? (
      <>
        <div className="has-tabbar">{node}</div>
        <TabBar current={current} onSelect={onTab} badges={{ progress: tabTestDue }} />
      </>
    ) : (
      node
    );

  const body = () => {
    if (view.name === "newSelf") {
      const from = view.from;
      return (
        <NewAthlete
          kind="self"
          first={from === "first"}
          lockedBirthYear={meta.birthYear}
          onBack={() => setView(backTo(from))}
          onCreate={async (input) => {
            const athlete = await family.createSelf(input);
            setView({ name: "athlete", athleteId: athlete.id });
            return athlete;
          }}
        />
      );
    }

    if (view.name === "newAthlete" && allowMinors) {
      const from = view.from;
      return (
        <NewAthlete
          kind="minor"
          first={from === "first"}
          onBack={() => setView(backTo(from))}
          onCreate={async (input) => {
            const athlete = await family.create(input);
            // Primeiro perfil da conta vai direto para o treino; os seguintes aparecem na escolha de perfil.
            setView(from === "first" ? { name: "athlete", athleteId: athlete.id } : { name: "picker" });
            return athlete;
          }}
        />
      );
    }

    // A Conta fica acessível mesmo sem perfis: apagar o último perfil não pode prender a pessoa fora dela.
    if (view.name === "account") {
      return (
        <GuardianArea
          guardianId={guardianId}
          email={email}
          athletes={family.athletes}
          consents={family.consents}
          sessions={training.sessions}
          tests={skill.tests}
          accountKind={meta.kind}
          parent={parent}
          onRefreshParent={() => void loadParentStatus(guardianId, meta.kind).then(setParent)}
          onBack={() => setView({ name: "picker" })}
          onAddAthlete={() => setView({ name: "newAthlete", from: "account" })}
          onAddSelf={() => setView({ name: "newSelf", from: "account" })}
          onUpdate={family.update}
          onRevoke={family.revoke}
          onAuthorize={family.authorize}
          onDeleteAthlete={async (athleteId) => {
            await family.remove(athleteId);
            await Promise.all([training.reload(), skill.reload()]);
          }}
        />
      );
    }

    if (family.athletes.length === 0) {
      return (
        <ProfileChoice
          kind={meta.kind}
          onSelf={() => setView({ name: "newSelf", from: "first" })}
          onMinor={() => setView({ name: "newAthlete", from: "first" })}
        />
      );
    }

    if (view.name !== "picker" && "athleteId" in view) {
      // Perfil sem aceite ativo não abre: cai na escolha de perfil, onde aparece bloqueado.
      const athlete = family.athletes.find((a) => a.id === view.athleteId && canTrain(a));
      if (athlete) {
        const athleteId = athlete.id;
        const sessions = training.sessions.filter((s) => s.athlete_id === athleteId);
        const tests = skill.tests.filter((t) => t.athlete_id === athleteId);
        const home = () => setView({ name: "athlete", athleteId });
        const pending = pendingSummary(guardianId, athleteId);
        const retry = () => void Promise.all([training.sync(), skill.sync()]);

        if (view.name === "program" || view.name === "training") {
          const program = programById(view.programId);
          if (program && view.name === "training") {
            return <TrainingSession athlete={athlete} program={program} resume={view.resume} onExit={home} onSave={training.create} />;
          }
          if (program) {
            const programSessions = training.sessions.filter((s) => s.program_id === program.id);
            return (
              <ProgramDetail
                program={program}
                doneCount={programSessions.length}
                lastDone={programSessions[0]?.performed_on ?? null}
                onBack={home}
                onStart={() => setView({ name: "training", athleteId, programId: program.id })}
              />
            );
          }
        } else if (view.name === "progress") {
          return withTabs(
            <Progress
              athlete={athlete}
              sessions={sessions}
              tests={tests}
              onBack={home}
              onStartTests={() => setView({ name: "tests", athleteId })}
              onOpenProgram={(programId) => setView({ name: "program", athleteId, programId })}
              onUpdateGoal={(goal) => family.update(athleteId, { weekly_goal: goal })}
            />,
            "progress",
          );
        } else if (view.name === "videos") {
          return withTabs(<Channel />, "videos");
        } else if (view.name === "tests") {
          return <TestSession athlete={athlete} tests={tests} onBack={() => setView({ name: "progress", athleteId })} onSave={skill.create} />;
        } else {
          return withTabs(
            <AthleteHome
              athlete={athlete}
              pending={pending}
              onOpenProgram={(programId) => setView({ name: "program", athleteId, programId })}
              onRetryPending={retry}
              onOpenAccount={() => setView({ name: "account" })}
              onResume={(r) => setView({ name: "training", athleteId, programId: r.programId, resume: r })}
            />,
            "trainings",
          );
        }
      }
    }

    return withTabs(
      <WhoTrains
        athletes={family.athletes}
        isLocked={(athlete) => !canTrain(athlete)}
        lockLabel={(athlete) =>
          meta.kind === "teen" && athlete.is_self && !parent.confirmed
            ? "Aguardando o responsável"
            : athlete.is_self
              ? "Precisa de consentimento"
              : "Precisa de autorização"
        }
        onPick={(athleteId) => setView({ name: "athlete", athleteId })}
        onAccount={() => setView({ name: "account" })}
        onSignOut={signOut}
      />,
      "profile",
    );
  };

  return (
    <>
      {staleBanner}
      <Suspense fallback={<LazyFallback />}>{body()}</Suspense>
    </>
  );
}

function Splash() {
  return (
    <main className="splash" aria-busy="true">
      <img src="icons/icon-192.png" alt="" width={72} height={72} />
      <p>Carregando…</p>
    </main>
  );
}

function SetupNotice() {
  return (
    <Screen title="Falta configurar">
      <Notice tone="error">
        Crie o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do projeto Supabase do Baseline (veja .env.example) e reinicie o app.
      </Notice>
    </Screen>
  );
}

// A sessão não pôde ser verificada (storage bloqueado, rede parada na abertura): em vez de
// splash eterno, uma tela com saída clara.
function AuthBroken() {
  return (
    <Screen title="Não conseguimos abrir">
      <div className="stack">
        <Notice tone="error">Não deu para verificar sua sessão. Confira a internet e tente de novo.</Notice>
        <PrimaryButton onClick={() => window.location.reload()}>Tentar de novo</PrimaryButton>
      </div>
    </Screen>
  );
}
