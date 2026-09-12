import { useEffect, useState } from "react";
import { useAuth } from "./state/auth";
import { useAthletes } from "./state/athletes";
import { isSupabaseConfigured } from "./lib/supabase";
import { AuthFlow } from "./screens/AuthScreens";
import { NewAthlete } from "./screens/NewAthlete";
import { WhoTrains } from "./screens/WhoTrains";
import { AthleteHome } from "./screens/AthleteHome";
import { GuardianArea } from "./screens/GuardianArea";
import { Notice, PrimaryButton, Screen } from "./components/ui";

type View = { name: "picker" } | { name: "athlete"; id: string } | { name: "guardian" } | { name: "newAthlete" };

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
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem(lastAthleteKey(guardianId));
    return saved ? { name: "athlete", id: saved } : { name: "picker" };
  });

  useEffect(() => {
    if (view.name === "athlete") localStorage.setItem(lastAthleteKey(guardianId), view.id);
  }, [view, guardianId]);

  if (family.loading) return <Splash />;
  if (family.error) {
    return (
      <Screen title="Sem conexão">
        <div className="stack">
          <Notice tone="error">{family.error}</Notice>
          <PrimaryButton onClick={() => void family.reload()}>Tentar de novo</PrimaryButton>
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
          setView({ name: "athlete", id: athlete.id });
          return athlete;
        }}
      />
    );
  }

  if (view.name === "newAthlete") {
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
  }

  if (view.name === "guardian") {
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
  }

  if (view.name === "athlete") {
    const athlete = family.athletes.find((a) => a.id === view.id);
    if (athlete) {
      return (
        <AthleteHome
          athlete={athlete}
          onSwitch={() => {
            localStorage.removeItem(lastAthleteKey(guardianId));
            setView({ name: "picker" });
          }}
        />
      );
    }
  }

  return <WhoTrains athletes={family.athletes} onPick={(id) => setView({ name: "athlete", id })} onGuardian={() => setView({ name: "guardian" })} />;
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
