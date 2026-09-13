import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./state/auth";
import { useAthletes } from "./state/athletes";
import { useSessions } from "./state/sessions";
import { useTests } from "./state/tests";
import { isSupabaseConfigured } from "./lib/supabase";
import { activeConsent } from "./lib/consent";
import { canCreateMinorProfiles, metaFromSession } from "./lib/account";
import { listenBackButton } from "./lib/native";
import { pendingSummary } from "./lib/offlineQueue";
import { loadParentStatus, registerParentEmail, type ParentStatus } from "./lib/parentConfirm";
import { programById } from "./content/programs";
import { LEGAL_DOCS, legalIdFromHash, type LegalId } from "./content/legal";
import { AuthFlow } from "./screens/AuthScreens";
import { NewAthlete } from "./screens/NewAthlete";
import { ProfileChoice } from "./screens/ProfileChoice";
import { WhoTrains } from "./screens/WhoTrains";
import { AthleteHome } from "./screens/AthleteHome";
import { ProgramDetail } from "./screens/ProgramDetail";
import { TrainingSession } from "./screens/TrainingSession";
import { Progress } from "./screens/Progress";
import { TestSession } from "./screens/TestSession";
import { GuardianArea } from "./screens/GuardianArea";
import { LegalScreen } from "./screens/LegalScreen";
import { ConfirmParent } from "./screens/ConfirmParent";
import { TabBar, type TabId } from "./components/TabBar";
import { Notice, PrimaryButton, Screen } from "./components/ui";
import type { Athlete } from "./lib/types";

type Origin = "first" | "account";

type View =
  | { name: "picker" }
  | { name: "account" }
  | { name: "newSelf"; from: Origin }
  | { name: "newAthlete"; from: Origin }
  | { name: "athlete"; athleteId: string }
  | { name: "program"; athleteId: string; programId: string }
  | { name: "training"; athleteId: string; programId: string }
  | { name: "progress"; athleteId: string }
  | { name: "tests"; athleteId: string };

const lastAthleteKey = (guardianId: string) => `baseline.athlete.${guardianId}`;

function publicRouteFromHash(hash: string): LegalId | "confirmar-responsavel" | null {
  const id = hash.replace(/^#\/?/, "");
  if (id === "confirmar-responsavel") return "confirmar-responsavel";
  return legalIdFromHash(hash);
}

export default function App() {
  const { session, loading } = useAuth();
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
  const { session } = useAuth();
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
  if (loadError) {
    return (
      <Screen title="Sem conexão">
        <div className="stack">
          <Notice tone="error">{loadError}</Notice>
          <PrimaryButton onClick={() => void Promise.all([family.reload(), training.reload(), skill.reload()])}>Tentar de novo</PrimaryButton>
        </div>
      </Screen>
    );
  }

  const canTrain = (athlete: Athlete) => {
    if (meta.kind === "teen" && athlete.is_self && !parent.confirmed) return false;
    return Boolean(activeConsent(family.consents, athlete));
  };
  const backTo = (from: Origin): View => (from === "first" ? { name: "picker" } : { name: "account" });
  const allowMinors = canCreateMinorProfiles(meta.kind);

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

  if (family.athletes.length === 0) {
    return (
      <ProfileChoice
        kind={meta.kind}
        onSelf={() => setView({ name: "newSelf", from: "first" })}
        onMinor={() => setView({ name: "newAthlete", from: "first" })}
      />
    );
  }

  const toPicker = () => {
    localStorage.removeItem(lastAthleteKey(guardianId));
    setView({ name: "picker" });
  };

  // Abas do rodapé: só existem com um atleta válido em memória.
  const tabAthlete = family.athletes.find((a) => a.id === lastAthleteId && canTrain(a));
  const onTab = (tab: TabId) => {
    if (!tabAthlete) return;
    if (tab === "profile") {
      toPicker();
      return;
    }
    setView(tab === "progress" ? { name: "progress", athleteId: tabAthlete.id } : { name: "athlete", athleteId: tabAthlete.id });
  };
  const withTabs = (node: ReactNode, current: TabId): ReactNode =>
    tabAthlete ? (
      <>
        <div className="has-tabbar">{node}</div>
        <TabBar current={current} onSelect={onTab} />
      </>
    ) : (
      node
    );

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
          return <TrainingSession athlete={athlete} program={program} onExit={home} onSave={training.create} />;
        }
        if (program) {
          return <ProgramDetail program={program} onBack={home} onStart={() => setView({ name: "training", athleteId, programId: program.id })} />;
        }
      } else if (view.name === "progress") {
        return withTabs(
          <Progress athlete={athlete} sessions={sessions} tests={tests} onBack={home} onStartTests={() => setView({ name: "tests", athleteId })} />,
          "progress",
        );
      } else if (view.name === "tests") {
        return <TestSession athlete={athlete} tests={tests} onBack={() => setView({ name: "progress", athleteId })} onSave={skill.create} />;
      } else {
        return withTabs(
          <AthleteHome
            athlete={athlete}
            sessions={sessions}
            tests={tests}
            pending={pending}
            onOpenProgram={(programId) => setView({ name: "program", athleteId, programId })}
            onStartTests={() => setView({ name: "tests", athleteId })}
            onRetryPending={retry}
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
    />,
    "profile",
  );
}

function Splash() {
  return (
    <main className="splash" aria-busy="true">
      <img src="icons/icon-192.png" alt="" width={72} height={72} />
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
