# Continuidade do desenvolvimento — Baseline by Arvoredo

Atualizado em 2026-09-12. Este arquivo é a passagem de bastão para quem continuar o projeto (pessoa ou agente).
Leia junto com `AGENTS.md` (regras que não mudam sem pedido explícito) e `README.md` (como rodar).

---

## 1. O produto em uma página

- **O que é:** app de treinos de basquete para crianças (a partir de 6 anos) e adolescentes (até 17). Nome público **Baseline**; marca **Baseline by Arvoredo**.
- **Quem mantém:** Instituto Arvoredo. A publicação no Google Play será por **conta de organização** do Instituto, que exige número D-U-N-S.
- **Modelo de conta:** o cadastro é sempre do **responsável** (adulto). Ele cria os perfis dos atletas, que não têm login nem e-mail.
- **Área do responsável:** protegida por PIN de 4 dígitos, que funciona só como trava contra a criança no aparelho.
- **Escopo da v1:** não há área do treinador. O foco é o atleta:
  - treinos guiados com vídeo;
  - registro dos treinos;
  - testes a cada 4 semanas;
  - meta semanal e conquistas.
- **Stack:** Vite 8 + TypeScript 7 + React 19, empacotado com Capacitor 8 (Android primeiro, iPhone depois). O banco é o Supabase (Auth por e-mail e senha, RLS, funções RPC).
- **Conteúdo dos treinos:** precisa ser validado por um profissional de educação física antes do lançamento.
- **Público infantil:** o app tem de cumprir três conjuntos de regras.
  - LGPD art. 14 (consentimento específico de um dos pais).
  - ECA Digital (Lei 15.211/2025).
  - Política de Famílias do Google Play: sem anúncios, sem identificador de publicidade, sem ferramentas de análise de terceiros, exclusão de conta no app e na web, coleta mínima.
- **Repositório:** `Mosimann-adv/baseline`, privado, branch `main`.
  - É um produto separado do app pessoal `basketball-workout`.
  - Não copie código, dados, plano de treino nem configuração do Supabase do app pessoal.

## 2. Como trabalhar com o dono do projeto

- Responda sempre em **português do Brasil**, com acentuação correta.
- O dono costuma acompanhar **pelo celular**. Mudança visual deve vir com uma demonstração navegável (modo demo, seção 6), não só com um relato em texto.
- **Commit e push só com autorização explícita** a cada vez.
- **Nunca** digite senhas nem faça login no lugar dele. **Nunca** use a chave `service_role` no app ou no repositório.
- **Não invente IDs de vídeo do YouTube.** Use só IDs verificados; os que já existem estão em `VIDEOS`, em `src/content/programs.ts`.
- Treinos e testes são **rascunho** até a validação do profissional de educação física.
- Textos legais e o termo de autorização são **rascunho** até a revisão jurídica.

## 3. Estado atual

| Commit | Conteúdo |
|---|---|
| `6cd42a4` | Fundação: cadastro do responsável, perfis com autorização, PIN, exclusão de conta |
| `fac2cb3` | Treinos guiados por faixa etária e modo demonstração |
| `d752170` | Vídeo do exercício na tela durante o treino guiado |
| `a5f1a3c` | Evolução: testes a cada 4 semanas, meta semanal, sequência de semanas e conquistas |
| (este commit) | Privacidade: política, termos, página de exclusão, revogar e renovar autorização, corrigir e excluir perfil, cópia dos dados; migração 0004; este documento |

Etapas do `README.md`:
1. Fundação — pronta.
2. Treino — pronta.
3. Evolução — pronta.
4. Privacidade e loja — parte do app pronta; formulários do Google Play pendentes.
5. Teste e publicação — não começou.

**Verificação feita:** `npm run build` e `npm run build:demo` passam, o que inclui `tsc --noEmit`. **Não existe suíte de testes.**

As telas das etapas 3 e 4 **não foram conferidas no navegador**: a automação travou. Antes de avançar, abra o modo demo e percorra estes fluxos:
- Evolução: meta, testes, conquistas, gráfico.
- Área do responsável: corrigir perfil, revogar e renovar autorização, excluir perfil, baixar dados.
- Textos legais.

## 4. Como rodar

```bash
npm install
cp .env.example .env.local    # VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do projeto do Baseline
npm run dev                   # sem .env.local aparece a tela "Falta configurar"
npm run dev -- --mode demo    # modo demonstração: sem servidor, dados no localStorage
npm run build                 # typecheck + build em dist/
npm run build:demo            # typecheck + build demo em dist-demo/
npx vite preview --outDir dist-demo   # servir a demo localmente
```

Ambiente do dono: Windows 11 com PowerShell. Os avisos do Git sobre LF/CRLF são inofensivos.

## 5. Mapa do código

```
src/
  main.tsx              faixa "demonstração" quando VITE_DEMO=1; AuthProvider + App
  App.tsx               navegação por estado (union View, sem router) e rotas públicas por hash
  components/ui.tsx     Screen, Group, Field, SwitchRow, Segmented, PrimaryButton, PlainButton, Notice
  state/
    auth.tsx            sessão do responsável; signOut e deleteAccount apagam o PIN do aparelho
    athletes.ts         perfis + autorizações: create (RPC), update, revoke, authorize, remove
    sessions.ts         treinos registrados (máx. 300 carregados)
    tests.ts            baterias de testes
  lib/
    supabase.ts         isDemo, isSupabaseConfigured, cliente
    demo.ts             backend falso em localStorage (baseline.demo.session / baseline.demo.data)
    types.ts            tipos de domínio
    age.ts              faixas 6–8, 9–11, 12–14, 15–17; allowedBirthYears
    consent.ts          CONSENT_VERSION, CONSENT_POINTS, activeConsent()
    pin.ts              PIN com sal + SHA-256 no localStorage
    progress.ts         semanas, sequência da meta, próxima data de teste, evolução por teste, conquistas
    exportData.ts       cópia JSON da família (compartilhar ou baixar)
    dates.ts            datas locais (nunca toISOString para dia); semana começa na segunda
    profile.ts          opções de nível e posição
    errors.ts           mensagens amigáveis a partir de erros do Supabase
  content/
    programs.ts         11 programas por faixa e nível; VIDEOS com IDs verificados
    tests.ts            7 testes de habilidade; sprint e salto só a partir de 12 anos
    legal.ts            política, termos e página de exclusão (LEGAL_VERSION)
  screens/              AuthScreens, NewAthlete, WhoTrains, AthleteHome, ProgramDetail,
                        TrainingSession, Progress, TestSession, GuardianArea, LegalScreen
  styles.css            tokens de design (azul-marinho, laranja, amarelo, creme) e componentes
supabase/migrations/    0001 fundação · 0002 treinos · 0003 evolução · 0004 privacidade
```

### Padrões que o código segue

- **Modo demo em toda operação de dados:** cada hook em `src/state/` tem um ramo `if (isDemo)` que chama `src/lib/demo.ts`. Toda função nova de dados precisa desse ramo.
- **`loading` só na primeira carga.** Não volte a marcar `loading = true` num `reload`: o `App` troca a tela pelo splash, desmonta a Área do responsável e ela pede o PIN de novo.
- **Autorização manda no acesso.**
  - `activeConsent()` exige autorização **não revogada e da versão atual** do termo.
  - Sem ela, o perfil fica bloqueado na tela "Quem vai treinar?" e o banco recusa treinos e testes novos (policies da 0004).
  - Mudou o texto de `CONSENT_POINTS`? Troque `CONSENT_VERSION`. Com isso **todos os perfis ficam bloqueados** até o responsável autorizar de novo.
- **RLS em toda tabela nova.**
  - `guardian_id = auth.uid()` e verificação de que o atleta é da família.
  - Em inserts de dados do atleta, exija também autorização ativa.
  - Dentro de subselects, **qualifique as colunas com o nome da tabela** (`skill_tests.athlete_id`). Sem isso, `athlete_id` sozinho vira a coluna da tabela do subselect e a verificação passa sempre.
- **Coleta mínima e dado de saúde mínimo:** a dor é só `discomfort` sim/não. Não crie campo de texto livre sobre saúde.
- **Visual:**
  - listas agrupadas no estilo nativo;
  - títulos na fonte Breymont com `text-transform: lowercase`, porque as maiúsculas da fonte são estilizadas e ela não tem os travessões – e —;
  - nenhuma biblioteca de interface externa;
  - vídeos só por `youtube-nocookie.com`.

## 6. Demonstração publicada

- **Prévia navegável (privada, do dono):** https://claude.ai/code/artifact/22f74c46-a71c-45e8-a676-73c5bd4fbc47 (versão 5, com privacidade).
  - Foi publicada a partir de `dist-demo/assets/*`, com uma página de entrada que aponta para o CSS e o JS gerados.
  - O CSP da prévia provavelmente bloqueia o player do YouTube.
  - O download da cópia de dados é bloqueado dentro da prévia.
- **Plano do produto:** https://claude.ai/code/artifact/0cfc5c80-19f6-4328-b7fc-f7ca770515b0
- Sem acesso a essas prévias, rode `npm run build:demo` e `npx vite preview --outDir dist-demo`.

## 7. Banco de dados (Supabase)

**Projeto criado em 2026-09-12:** ref `szpmzcrxyisehrvwlene` (`https://szpmzcrxyisehrvwlene.supabase.co`).

- **Migrações:** 0001–0004 aplicadas. A conferência foi feita pela API pública:
  - as 4 tabelas respondem "permission denied" ao acesso anônimo;
  - a coluna `weekly_goal` existe.
- **Auth:** e-mail ativo, confirmação de e-mail obrigatória, cadastro aberto.
- **Chave pública (publishable):** configurada nas variáveis da Vercel e no `.env.local` local, que não vai para o repositório. **Nunca** usar a `secret`/`service_role`.
- **E-mail:** usa o SMTP padrão do Supabase, que só entrega para membros da equipe do projeto e com limite baixo por hora. Antes de convidar outras famílias, configure um SMTP próprio (ex.: Resend).

| Migração | O que faz |
|---|---|
| `0001_fundacao.sql` | `athletes`, `consents`, RLS, `create_athlete_with_consent` (atleta + autorização na mesma transação, idade 6–17), `delete_my_account` (security definer) |
| `0002_treinos.sql` | `training_sessions` (sem update; `discomfort` booleano) |
| `0003_evolucao.sql` | `athletes.weekly_goal` (1–7, padrão 3) e `skill_tests` (`results` jsonb `{id_do_teste: valor}`) |
| `0004_privacidade.sql` | Unicidade da autorização só entre ativas; revogação definitiva por trigger; idade 6–17 também na correção; insert de treino e teste exige autorização ativa |

Migração nova: crie `supabase/migrations/0005_...sql` e rode-a no SQL Editor do projeto acima. Escreva migrações idempotentes (`if not exists`, `drop ... if exists`, `create or replace`), como as atuais.

## 7.1 Site na Vercel

- **Endereço:** https://baseline-six-sigma.vercel.app/
- **Deploy:** automático a cada push na `main` (preset Vite, `npm run build`, pasta `dist`).
- **Variáveis de ambiente** (Production e Preview): `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
  - Elas só entram no site depois de um novo build.
  - Para confirmar, procure `szpmzcrxyisehrvwlene` dentro do `assets/index-*.js` publicado.
- **Páginas públicas:**
  - https://baseline-six-sigma.vercel.app/#/privacidade
  - https://baseline-six-sigma.vercel.app/#/termos
  - https://baseline-six-sigma.vercel.app/#/excluir-conta

## 8. Próximos passos de código (ordem combinada)

### 8.1 Fila offline para treinos e testes
O próximo passo proposto ao dono, ainda sem início.
- **Idempotência:** gerar o `id` (UUID) no cliente e mandá-lo no insert (as tabelas aceitam `id` informado). Assim o reenvio não duplica.
- **Fila:** guardar os pendentes no `localStorage`, por responsável.
- **Envio:** tentar ao salvar, no evento `online` e ao reabrir o app.
- **Registro já enviado:** erro de chave duplicada (`23505`/`duplicate key`) significa sucesso. Hoje `friendlyError` traduz "duplicate key" como "Este atleta já está autorizado", então trate esse caso **antes** de chegar ali.
- **Recusa por RLS** (autorização revogada no meio do caminho): manter o item e mostrar o motivo, sem apagar em silêncio.
- **Interface:** mostrar na tela do atleta o que está pendente de envio, somando os pendentes às listas locais.
- **Modo demo:** não precisa de fila.

### 8.2 Projeto Android (Capacitor)
- **Pré-requisito:** JDK 21. A máquina do dono tem só Java 1.8; o Android Studio traz um JDK em `jbr`.
- **Criar o projeto:** `npx cap add android`, depois `npm run android:sync` e `npm run android:open`.
- **appId:** confirmar `br.org.arvoredo.baseline` em `capacitor.config.ts`. Ele é **permanente** depois da primeira publicação.
- **Ícones e splash:** `@capacitor/assets`, a partir de `public/icons`.
- **Botão voltar do Android:** o app não usa router. Use `@capacitor/app` (`backButton`) para chamar o `onBack` da tela atual.
- **Cópia de dados:** no WebView do Android, `navigator.share` com arquivo não funciona. Use `@capacitor/filesystem` + `@capacitor/share`.
- **Vídeo:**
  - testar o embed `youtube-nocookie` no WebView, porque a origem do Capacitor é `https://localhost`;
  - testar tela sempre ligada (Wake Lock), com `@capacitor-community/keep-awake` como alternativa;
  - testar vibração.

### 8.3 "Esqueci a senha"
Não existe. Hoje `detectSessionInUrl: false`. Avalie código OTP por e-mail (evita deep link) ou link com deep link no Android. Enquanto não existir, a página de exclusão manda escrever para o e-mail de privacidade.

### 8.4 Google Play
Formulários de Segurança dos dados, público-alvo (Famílias), classificação de conteúdo e URL da política. Os endereços públicos estão na seção 7.1.

## 9. Pendências fora do código (dependem do dono)

- [x] Criar o projeto Supabase do Baseline e rodar as migrações 0001–0004.
- [x] Deploy web na Vercel, com variáveis de ambiente.
- [ ] Confirmar no Supabase, em **Authentication → URL Configuration**, a Site URL `https://baseline-six-sigma.vercel.app` e a Redirect URL `https://baseline-six-sigma.vercel.app/**`. Ainda não foi verificado.
- [ ] Testar de ponta a ponta no site real, pelo celular:
  - cadastro com confirmação de e-mail e login;
  - criar atleta;
  - treino com vídeo tocando;
  - teste de habilidade;
  - revogar e renovar autorização;
  - baixar dados.
- [ ] Configurar SMTP próprio no Supabase antes de convidar outras famílias.
- [ ] Instalar JDK 21 / Android Studio.
- [ ] Conta de organização no Google Play (Instituto Arvoredo, D-U-N-S).
- [ ] Confirmar o `appId`.
- [ ] Revisão jurídica de `src/lib/consent.ts` e `src/content/legal.ts`. Preencher os trechos entre colchetes:
  - CNPJ do Instituto Arvoredo;
  - e-mail de privacidade e nome do encarregado;
  - prazo das cópias de segurança do provedor;
  - prazo para atender pedido de exclusão por e-mail;
  - região do Supabase;
  - nome e CREF do profissional de educação física;
  - se o uso é gratuito.
- [ ] Validação dos 11 programas (`src/content/programs.ts`) e dos 7 testes (`src/content/tests.ts`) por profissional de educação física.
- [ ] Vídeos: só **9 dos 44 exercícios** têm vídeo. Os IDs novos precisam ser escolhidos e verificados.

## 10. Riscos e decisões em aberto

- **Revogação guarda os registros** até o responsável autorizar de novo ou excluir o perfil. A revisão jurídica pode preferir exclusão automática após um prazo.
- **Contagens com limite:** `useSessions` carrega no máximo 300 treinos, então as contagens da Área do responsável podem ficar abaixo do real em famílias muito ativas. A cópia de dados busca tudo, dentro do limite padrão de 1000 linhas por consulta do Supabase.
- **Idade por ano:** é calculada pela diferença de anos do calendário (`ano atual − ano de nascimento`), tanto no app quanto no banco.
- **Comparação só consigo mesmo:** conquistas e testes nunca comparam atletas. Mantenha assim.
