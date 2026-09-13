import { useEffect, useState } from "react";
import { useAuth } from "./state/auth";
import { useAthletes } from "./state/athletes";
import { useSessions } from "./state/sessions";
import { useTests } from "./state/tests";
import { isSupabaseConfigured } from "./lib/supabase";
import { activeConsent } from "./lib/consent";
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

export default function App() {
  const { session, loading } = useAuth();
  const [publicDoc, closePublicDoc] = usePublicDoc();

  // Endereços públicos (#/privacidade, #/termos, #/excluir-conta) abrem sem login: o Google Play exige os links.
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

function usePublicDoc(): [LegalId | null, () => void] {
  const [doc, setDoc] = useState<LegalId | null>(() => legalIdFromHash(window.location.hash));

  useEffect(() => {
    const sync = () => setDoc(legalIdFromHash(window.location.hash));
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
  const family = useAthletes(guardianId);
  const training = useSessions(guardianId);
  const skill = useTests(guardianId);
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem(lastAthleteKey(guardianId));
    return saved ? { name: "athlete", athleteId: saved } : { name: "picker" };
  });

  useEffect(() => {
    if ("athleteId" in view) localStorage.setItem(lastAthleteKey(guardianId), view.athleteId);
  }, [view, guardianId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.name]);

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

  const canTrain = (athlete: Athlete) => Boolean(activeConsent(family.consents, athlete));
  const backTo = (from: Origin): View => (from === "first" ? { name: "picker" } : { name: "account" });

  if (view.name === "newSelf") {
    const from = view.from;
    return (
      <NewAthlete
        kind="self"
        first={from === "first"}
        onBack={() => setView(backTo(from))}
        onCreate={async (input) => {
          const athlete = await family.createSelf(input);
          setView({ name: "athlete", athleteId: athlete.id });
          return athlete;
        }}
      />
    );
  }

  if (view.name === "newAthlete") {
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
    return <ProfileChoice onSelf={() => setView({ name: "newSelf", from: "first" })} onMinor={() => setView({ name: "newAthlete", from: "first" })} />;
  }

  const toPicker = () => {
    localStorage.removeItem(lastAthleteKey(guardianId));
    setView({ name: "picker" });
  };

  if (view.name === "account") {
    return (
      <GuardianArea
        guardianId={guardianId}
        email={email}
        athletes={family.athletes}
        consents={family.consents}
        sessions={training.sessions}
        tests={skill.tests}
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

  if (view.name !== "picker") {
    // Perfil sem aceite ativo não abre: cai na escolha de perfil, onde aparece bloqueado.
    const athlete = family.athletes.find((a) => a.id === view.athleteId && canTrain(a));
    if (athlete) {
      const athleteId = athlete.id;
      const sessions = training.sessions.filter((s) => s.athlete_id === athleteId);
      const tests = skill.tests.filter((t) => t.athlete_id === athleteId);
      const home = () => setView({ name: "athlete", athleteId });

      if (view.name === "program" || view.name === "training") {
        const program = programById(view.programId);
        if (program && view.name === "training") {
          return <TrainingSession athlete={athlete} program={program} onExit={home} onSave={training.create} />;
        }
        if (program) {
          return <ProgramDetail program={program} onBack={home} onStart={() => setView({ name: "training", athleteId, programId: program.id })} />;
        }
      } else if (view.name === "progress") {
        return <Progress athlete={athlete} sessions={sessions} tests={tests} onBack={home} onStartTests={() => setView({ name: "tests", athleteId })} />;
      } else if (view.name === "tests") {
        return <TestSession athlete={athlete} tests={tests} onBack={() => setView({ name: "progress", athleteId })} onSave={skill.create} />;
      } else {
        return (
          <AthleteHome
            athlete={athlete}
            sessions={sessions}
            tests={tests}
            onSwitch={toPicker}
            onOpenProgram={(programId) => setView({ name: "program", athleteId, programId })}
            onOpenProgress={() => setView({ name: "progress", athleteId })}
            onStartTests={() => setView({ name: "tests", athleteId })}
          />
        );
      }
    }
  }

  return (
    <WhoTrains
      athletes={family.athletes}
      isLocked={(athlete) => !canTrain(athlete)}
      onPick={(athleteId) => setView({ name: "athlete", athleteId })}
      onAccount={() => setView({ name: "account" })}
    />
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
