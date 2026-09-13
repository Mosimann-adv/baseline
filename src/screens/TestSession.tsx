import { useState } from "react";
import { Group, Notice, PrimaryButton, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { friendlyError } from "../lib/errors";
import { formatTestValue, testsFor } from "../content/tests";
import type { Athlete, NewTestInput, SkillTestRecord } from "../lib/types";

export function TestSession({
  athlete,
  tests,
  onBack,
  onSave,
}: {
  athlete: Athlete;
  tests: SkillTestRecord[];
  onBack: () => void;
  onSave: (input: NewTestInput) => Promise<void>;
}) {
  const band = bandFor(ageThisYear(athlete.birth_year));
  const defs = band ? testsFor(band.id) : [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results: Record<string, number> = {};
  const invalid: string[] = [];
  for (const def of defs) {
    const raw = values[def.id]?.trim();
    if (!raw) continue;
    const value = Number(raw.replace(",", "."));
    const valid = Number.isFinite(value) && value >= def.min && value <= def.max && (def.step === "decimal" || Number.isInteger(value));
    if (valid) results[def.id] = value;
    else invalid.push(def.name);
  }
  const ready = Object.keys(results).length > 0 && invalid.length === 0;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await onSave({ athleteId: athlete.id, results });
      onBack();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow={`${athlete.nickname} · a cada 4 semanas`} title="Testes" onBack={onBack}>
      <p className="lead">
        {athlete.is_self ? "Aqueça antes e faça os testes em local seguro." : "Faça os testes com um adulto por perto."} Preencha só o que fizer hoje.
      </p>

      {defs.length === 0 && <Notice tone="error">Não há testes para a idade do perfil. Confira o ano de nascimento na tela Conta.</Notice>}

      {defs.map((def) => {
        const previous = tests.find((record) => typeof record.results[def.id] === "number")?.results[def.id];
        const inputId = `test-${def.id}`;
        return (
          <Group key={def.id} header={def.name} footer={def.protocol}>
            <label className="row" htmlFor={inputId}>
              <span className="row-label">
                Resultado
                <small>{previous !== undefined ? `Última marca: ${formatTestValue(def, previous)}` : "Primeira vez"}</small>
              </span>
              <input
                id={inputId}
                className="row-input test-input"
                inputMode={def.step === "int" ? "numeric" : "decimal"}
                autoComplete="off"
                placeholder={def.unit}
                value={values[def.id] ?? ""}
                onChange={(e) => setValues((current) => ({ ...current, [def.id]: e.target.value }))}
              />
            </label>
          </Group>
        );
      })}

      {invalid.length > 0 && <Notice tone="error">Confira o valor de: {invalid.join(", ")}.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {defs.length > 0 && (
        <div className="bottom-cta">
          <PrimaryButton onClick={() => void save()} disabled={!ready || busy}>
            {busy ? "Salvando…" : "Salvar testes"}
          </PrimaryButton>
        </div>
      )}
    </Screen>
  );
}
