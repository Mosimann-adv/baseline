import { useEffect, useState } from "react";
import { useAuth } from "./state/auth";
import { useAthletes } from "./state/athletes";
import { useSessions } from "./state/sessions";
import { isSupabaseConfigured } from "./lib/supabase";
import { programById } from "./content/programs";
import { AuthFlow } from "./screens/AuthScreens";
import { NewAthlete } from "./screens/NewAthlete";
import { WhoTrains } from "./screens/WhoTrains";
import { AthleteHome } from "./screens/AthleteHome";
import { ProgramDetail } from "./screens/ProgramDetail";
import { TrainingSession } from "./screens/TrainingSession";
import { GuardianArea } from "./screens/GuardianArea";
import { Notice, PrimaryButton, Screen } from "./components/ui";

type View =
  | { name: "picker" }
  | { name: "guardian" }
  | { name: "newAthlete" }
  | { name: "athlete"; athleteId: string }
  | { name: "program"; athleteId: string; programId: string }
  | { name: "training"; athleteId: string; programId: string };

const lastAthleteKey = (guardianId: string) => `baseline.athlete.${guardianId}`;

export default function App() {
  const { session, loading } = useAuth();
  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <Splash />;
  if (!session) return <AuthFlow />;
  return <Family key={session.user.id} guardianId={session.user.id} email={session.user.email ?? ""} />;
}

function Family({ guardianId, email }: { guardianId: string; email: string }) {
  const family = useAthletes(guardianId);
  const training = useSessions(guardianId);
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

  if (family.loading || training.loading) return <Splash />;
  const loadError = family.error ?? training.error;
  if (loadError) {
    return (
      <Screen title="Sem conexão">
        <div className="stack">
          <Notice tone="error">{loadError}</Notice>
          <PrimaryButton onClick={() => void Promise.all([family.reload(), training.reload()])}>Tentar de novo</PrimaryButton>
        </div>
      </Screen>
    );
  }

  // Logo depois do cadastro o adulto ainda está com o aparelho: o primeiro atleta não pede PIN.
  if (family.athletes.length === 0) {
    return (
      <NewAthlete
        first
        onCreate={async (input) => {
          const athlete = await family.create(input);
          setView({ name: "athlete", athleteId: athlete.id });
          return athlete;
        }}
      />
    );
  }

  const toPicker = () => {
    localStorage.removeItem(lastAthleteKey(guardianId));
    setView({ name: "picker" });
  };

  switch (view.name) {
    case "newAthlete":
      return (
        <NewAthlete
          first={false}
          onBack={() => setView({ name: "guardian" })}
          onCreate={async (input) => {
            const athlete = await family.create(input);
            setView({ name: "picker" });
            return athlete;
          }}
        />
      );
    case "guardian":
      return (
        <GuardianArea
          guardianId={guardianId}
          email={email}
          athletes={family.athletes}
          consents={family.consents}
          onBack={() => setView({ name: "picker" })}
          onAddAthlete={() => setView({ name: "newAthlete" })}
        />
      );
    case "athlete":
    case "program":
    case "training": {
      const athlete = family.athletes.find((a) => a.id === view.athleteId);
      if (!athlete) break;
      const home = () => setView({ name: "athlete", athleteId: athlete.id });

      if (view.name !== "athlete") {
        const program = programById(view.programId);
        if (!program) break;
        if (view.name === "training") {
          return <TrainingSession athlete={athlete} program={program} onExit={home} onSave={training.create} />;
        }
        return (
          <ProgramDetail
            program={program}
            onBack={home}
            onStart={() => setView({ name: "training", athleteId: athlete.id, programId: program.id })}
          />
        );
      }

      return (
        <AthleteHome
          athlete={athlete}
          sessions={training.sessions}
          onSwitch={toPicker}
          onOpenProgram={(programId) => setView({ name: "program", athleteId: athlete.id, programId })}
        />
      );
    }
    case "picker":
      break;
  }

  return (
    <WhoTrains
      athletes={family.athletes}
      onPick={(athleteId) => setView({ name: "athlete", athleteId })}
      onGuardian={() => setView({ name: "guardian" })}
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
