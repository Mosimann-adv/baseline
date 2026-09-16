import { useEffect, type ReactNode } from "react";
import { Screen } from "../components/ui";
import type { LegalDoc } from "../content/legal";

export function LegalScreen({ doc, onBack, children }: { doc: LegalDoc; onBack: () => void; children?: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [doc.id]);

  return (
    <Screen eyebrow="Baseline" title={doc.title} onBack={onBack}>
      <article className="legal">
        <p className="legal-intro">{doc.intro}</p>
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.blocks.map((block, index) => {
              if (typeof block === "string") return <p key={index}>{block}</p>;
              const items = block.list.map((item) => <li key={item}>{item}</li>);
              return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
            })}
          </section>
        ))}
      </article>
      {children}
    </Screen>
  );
}
