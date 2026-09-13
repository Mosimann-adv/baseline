# AGENTS.md — Baseline by Arvoredo

App de treinos de basquete para adultos e para crianças (a partir de 6 anos) e adolescentes acompanhados por um adulto. Nome público: **Baseline**.

> **Vai continuar o desenvolvimento?** Leia primeiro `docs/CONTINUIDADE.md`: estado atual, padrões do código, próximos passos e pendências.

## Regras que não mudam sem pedido explícito

1. **A conta é sempre de um adulto (18+).**
   - Ele pode ter um perfil próprio de treino (`athletes.is_self`, no máximo um por conta).
   - Ele pode criar perfis de crianças e adolescentes (6–17).
   - Crianças não criam login, não informam e-mail e não têm perfil público.
2. **Nenhum perfil sem aceite registrado.** Perfil e aceite são gravados na mesma transação.
   - Perfil de menor: `create_athlete_with_consent`, com a autorização do responsável (`CONSENT_VERSION`).
   - Perfil próprio: `create_self_profile_with_consent`, com o consentimento do titular (`SELF_CONSENT_VERSION`), porque "algo doeu?" é dado de saúde.
   - Não há PIN na tela Conta (decisão do dono em 2026-09-12). As ações sem volta pedem confirmação em dois passos.
3. **Coleta mínima.** Apelido, ano de nascimento, nível e posição. Nada de nome completo, data de nascimento completa, foto, escola, localização, contatos ou chat.
4. **Sem anúncios, sem identificador de publicidade e sem ferramentas de análise de terceiros** (política de Famílias do Google Play).
5. **Dor e lesão são dados sensíveis.** No máximo “algo doeu?”, com orientação para avisar um adulto. Não guardar diagnóstico nem detalhe clínico.
6. **Vídeos externos** só pelo modo sem cookies do YouTube (`youtube-nocookie.com`).
7. **Exclusão de conta** precisa existir no app e por um link na web. Hoje: função `delete_my_account` + tela Conta + página pública `#/excluir-conta`.
   - Perfil sem autorização ativa (revogada ou de versão antiga do termo) fica bloqueado: não abre no app e o banco recusa treinos e testes novos.
   - Revogação é definitiva; autorizar de novo cria outro registro em `consents`.
   - O adulto corrige perfis, baixa a cópia dos dados da conta, revoga consentimentos e autorizações e exclui perfis na tela Conta.
8. **Nunca** colocar a `service_role`/`secret` key no app ou no repositório. O endereço e a chave `sb_publishable_` são públicos e ficam em `.env.production`.
9. Conteúdo de treino só é publicado depois de validado por profissional de educação física.
10. Responder em português do Brasil.

## Estrutura

- `src/state/auth.tsx` — sessão do responsável (Supabase Auth).
- `src/state/athletes.ts` — perfis de atleta e autorizações.
- `src/lib/consent.ts` — texto e versão do termo de autorização (**rascunho, pendente de revisão jurídica**).
- `src/content/legal.ts` — política de privacidade, termos de uso e página de exclusão (**rascunho; trechos entre colchetes a preencher**). Abrem sem login em `#/privacidade`, `#/termos` e `#/excluir-conta`.
- `src/lib/exportData.ts` — cópia dos dados da família em JSON.
- `src/lib/age.ts` — faixas etárias (6–8, 9–11, 12–14, 15–17).
- `supabase/migrations/` — schema e RLS. Cada tabela nova precisa de RLS presa ao responsável.

## Faixas etárias

| Faixa | Foco | Equipamento |
|---|---|---|
| 6–8 | Coordenação, domínio de bola, jogos | Bola 5, cesta 2,60 m |
| 9–11 | Drible com as duas mãos, bandeja, passe | Bola 5, cesta 2,60 m |
| 12–14 | Arremesso, mão fraca, físico com peso do corpo | Bola 6, cesta 3,05 m |
| 15–17 | Velocidade, salto, força com supervisão | Bola 7 (masc.) ou 6 (fem.), cesta 3,05 m |
| Adulto (18+) | Na v1, os mesmos treinos e testes de 15–17 (`contentBand`) | Bola 7 (masc.) ou 6 (fem.), cesta 3,05 m |

Sprint e salto só a partir de 12 anos. Nunca comparar atletas entre si.
