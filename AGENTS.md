# AGENTS.md — Baseline by Arvoredo

App de treinos de basquete para adultos e para crianças (a partir de 6 anos) e adolescentes acompanhados por um adulto. Nome público: **Baseline**.

> **Vai continuar o desenvolvimento?** Leia primeiro `docs/CONTINUIDADE.md`: estado atual, padrões do código, próximos passos e pendências.

## Regras que não mudam sem pedido explícito

1. **A conta é a partir de 16 anos.**
   - 18+: adulto, com perfil próprio (`athletes.is_self`, no máximo um por conta) e, se quiser, perfis de crianças e adolescentes (6–17).
   - 16–17: o adolescente cria o próprio login; o responsável confirma pelo e-mail e um código (`#/confirmar-responsavel`). Sem a confirmação o perfil próprio fica bloqueado. Essa conta **não** cria perfis de outras crianças.
   - Menores de 16 não criam login: só treinam pelo perfil criado pelo responsável.
   - Perfil próprio de 16–17 usa `TEEN_CONSENT_VERSION`; o de 18+ usa `SELF_CONSENT_VERSION`.
2. **Nenhum perfil sem aceite registrado.** Perfil e aceite são gravados na mesma transação.
   - Perfil de menor: `create_athlete_with_consent`, com a autorização do responsável (`CONSENT_VERSION`).
   - Perfil próprio: `create_self_profile_with_consent`, com o consentimento do titular (`SELF_CONSENT_VERSION`), porque "algo doeu?" é dado de saúde.
   - Não há PIN na tela Conta (decisão do dono em 2026-09-12). As ações sem volta pedem confirmação em dois passos.
3. **Coleta mínima.** Apelido, ano de nascimento, nível e posição. Nada de nome completo, data de nascimento completa, foto, escola, localização, contatos ou chat.
4. **Sem anúncios, sem identificador de publicidade e sem ferramentas de análise de terceiros** (política de Famílias do Google Play).
5. **Dor e lesão são dados sensíveis.** No máximo "algo doeu?", com orientação para parar. Para menores, orientar também a avisar um adulto. Não guardar diagnóstico nem detalhe clínico.
6. **Vídeos externos** só pelo modo sem cookies do YouTube (`youtube-nocookie.com`).
7. **Exclusão de conta** precisa existir no app e por um link na web. Hoje: função `delete_my_account` + tela Conta + página pública `#/excluir-conta`.
   - Perfil sem autorização ativa (revogada ou de versão antiga do termo) fica bloqueado: não abre no app e o banco recusa treinos e testes novos.
   - Revogação é definitiva; autorizar de novo cria outro registro em `consents`.
   - O adulto corrige perfis, baixa a cópia dos dados da conta, revoga consentimentos e autorizações e exclui perfis na tela Conta.
8. **Nunca** colocar a `service_role`/`secret` key no app ou no repositório. O endereço e a chave `sb_publishable_` são públicos e ficam em `.env.production`.
9. Conteúdo de treino só é publicado depois de validado por profissional de educação física.
10. Responder em português do Brasil.
11. **O app é gratuito.** Sem anúncio, sem compra e sem paywall no treino. Doação opcional ("Apoie o Arvoredo") só na tela Conta do dono da conta, no estilo do site do Instituto (Pix CNPJ, QR, WhatsApp). **Nunca** na tela em que a criança treina. Cotas para empresas ficam no site, não no fluxo de treino.

## Estrutura

- `src/state/auth.tsx` — sessão do dono da conta (Supabase Auth), inclusive recuperação de senha por código.
- `src/state/athletes.ts` — perfis (próprio e de menores) e aceites.
- `src/lib/consent.ts` — textos e versões dos termos de aceite de menores, de adultos e de adolescentes 16–17 (**rascunho, pendente de revisão jurídica**).
- `src/lib/offlineQueue.ts` — fila de treinos e testes no aparelho, reenviada quando houver internet.
- `src/lib/parentConfirm.ts` — e-mail e código do responsável na conta 16–17.
- `src/screens/GuardianArea.tsx` — tela Conta (sem PIN). `src/screens/ProfileChoice.tsx` — "Quem vai treinar?".
- `src/screens/ConfirmParent.tsx` — página pública `#/confirmar-responsavel`.
- `src/content/legal.ts` — política de privacidade, termos de uso e página de exclusão (**rascunho; trechos entre colchetes a preencher**). Abrem sem login em `#/privacidade`, `#/termos` e `#/excluir-conta`.
- `src/content/support.ts` — CNPJ, Pix, WhatsApp, Instagram e endereços do site do Instituto. A tela Conta usa esses dados no bloco "Apoie o Arvoredo".
- `src/lib/exportData.ts` — cópia dos dados da conta em JSON.
- `src/lib/age.ts` — faixas etárias (6–8, 9–11, 12–14, 15–17, Adulto) e `contentBand`.
- `supabase/migrations/` — schema e RLS. Cada tabela nova precisa de RLS presa ao dono da conta (`guardian_id`). Migrações idempotentes; o dono roda no SQL Editor e o código só sobe depois.

## Faixas etárias

| Faixa | Foco | Equipamento |
|---|---|---|
| 6–8 | Coordenação, domínio de bola, jogos | Bola 5, cesta 2,60 m |
| 9–11 | Drible com as duas mãos, bandeja, passe | Bola 5, cesta 2,60 m |
| 12–14 | Arremesso, mão fraca, físico com peso do corpo | Bola 6, cesta 3,05 m |
| 15–17 | Velocidade, salto, força com supervisão | Bola 7 (masc.) ou 6 (fem.), cesta 3,05 m |
| Adulto (18+) | Na v1, os mesmos treinos e testes de 15–17 (`contentBand`) | Bola 7 (masc.) ou 6 (fem.), cesta 3,05 m |

Sprint e salto só a partir de 12 anos. Nunca comparar atletas entre si.
