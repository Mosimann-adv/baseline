# Continuidade do desenvolvimento — Baseline by Arvoredo

Atualizado em 2026-09-13.

Leia nesta ordem:
1. `AGENTS.md` — regras que não mudam sem pedido explícito.
2. Este arquivo — produto, decisões, estado, como verificar e o que falta.
3. `README.md` — resumo de como rodar.

---

## 1. O produto em uma página

- **O que é:** app de treinos de basquete para **adultos** e para **crianças (6+) e adolescentes** acompanhados por um adulto. Nome público **Baseline**; marca **Baseline by Arvoredo**.
- **Quem mantém:** Instituto Arvoredo. A publicação no Google Play será por **conta de organização** do Instituto, que exige número D-U-N-S.
- **Modelo de conta:** a conta é a partir de **16 anos**, com e-mail, senha e a declaração **“tenho 16 anos ou mais”**. Sem ano de nascimento e sem e-mail de responsável no cadastro (decisão 2026-09-13).
  - A idade fica no perfil de treino. Quem cria um perfil próprio e quem cria perfil de criança usa a mesma conta.
  - Menores de 16 treinam só pelo perfil criado pelo responsável, sem login.
  - Conta sem perfis abre na tela **"Quem vai treinar?"**.
  - Contas antigas 16–17 com confirmação de responsável continuam no código (`#/confirmar-responsavel`).
- **Tela Conta** (componente `GuardianArea.tsx`, nome antigo "Área do responsável"):
  - abre direto, **sem PIN**;
  - é onde se criam e corrigem perfis, se revogam e renovam aceites, se baixa a cópia dos dados, se lêem os textos legais, se apoia o Instituto (Pix) e se sai da conta ou a exclui;
  - ações sem volta pedem confirmação em dois passos.
- **Escopo da v1:** não há área do treinador. O foco é quem treina:
  - treinos guiados com vídeo do exercício tocando na tela;
  - registro do treino (como foi de 1 a 5 e "algo doeu?" sim/não);
  - testes de habilidade a cada 4 semanas, com gráficos;
  - meta semanal, sequência de semanas e conquistas, sem comparar pessoas.
- **Faixas:** 6–8 Iniciação, 9–11 Minibasquete, 12–14 Fundamentos, 15–17 Desenvolvimento e **Adulto (18+)**. Na v1, a faixa Adulto usa os treinos e testes de 15–17 (`contentBand` em `src/lib/age.ts`).
- **Stack:** Vite 8 + TypeScript 7 + React 19, empacotado com Capacitor 8 (Android primeiro, iPhone depois). O banco é o Supabase: Auth, RLS e funções RPC.
- **Regras externas que o app segue** (por ter crianças no público):
  - LGPD art. 14 (consentimento específico de um dos pais);
  - LGPD art. 11 ("algo doeu?" é dado de saúde, por isso o adulto também consente);
  - ECA Digital (Lei 15.211/2025);
  - política de Famílias do Google Play: sem anúncios, sem ID de publicidade, sem análise de terceiros, exclusão de conta no app e na web, coleta mínima.
- **Repositório:** `Mosimann-adv/baseline`, privado, branch `main`.
  - Produto **separado** do app pessoal `basketball-workout`.
  - Não copie código, dados, plano de treino nem o Supabase do app pessoal.

## 2. Como trabalhar com o dono do projeto

- **Idioma:** sempre **português do Brasil**, com acentuação correta. Linguagem simples, sem jargão desnecessário.
- **Acompanha pelo celular** na maior parte do tempo.
  - Mudança visual vem com demonstração navegável (seção 6), não só com relato.
  - Evite pedir tarefas manuais longas. Quando forem inevitáveis (SQL no Supabase, painel da Vercel), mande **um arquivo só**, um passo a passo curto e, quando der, uma forma de confirmar que deu certo.
- **Commit e push só com autorização explícita**, a cada vez ("Sim", "Pode", "Commit e push").
- **Decisões de produto:** ele gosta de receber opções com uma recomendação marcada e costuma escolher a recomendada. Não aprova restrição sem motivo claro: o PIN foi removido por isso.
- **Nunca** digite senhas nem faça login no lugar dele. **Nunca** use a chave `secret`/`service_role`.
- **Não invente IDs de vídeo do YouTube.** Use só IDs verificados; os existentes estão em `VIDEOS`, em `src/content/programs.ts`.
- Treinos e testes são **rascunho** até a validação do profissional de educação física.
- Textos legais e termos de aceite são **rascunho** até a revisão jurídica.

## 3. Registro de decisões

| Decisão | Motivo / detalhe |
|---|---|
| Produto novo, separado do app pessoal, repositório sem histórico dele | Público e regras de privacidade diferentes |
| React + Capacitor; Android primeiro; conta Google Play de organização (Instituto Arvoredo) | Escolha do dono; organização evita o teste fechado obrigatório de 12 testadores |
| Sem área do treinador na v1; vídeos externos do YouTube aceitos | Escolha do dono |
| Conteúdo validado por profissional de educação física antes do lançamento | Escolha do dono |
| Modo demonstração (dados no navegador) para prévias | O dono acompanha pelo celular e gostou do formato |
| Vídeo do exercício tocando na tela durante o treino | Pedido do dono: a pessoa faz o exercício enquanto vê |
| Ordem das etapas: evolução → privacidade → fila offline → Android | Proposta aceita pelo dono |
| Endereço e chave pública do Supabase versionados em `.env.production` | As variáveis cadastradas vazias na Vercel apagavam o arquivo; valores são públicos por natureza |
| **Adultos também usam o app:** conta 18+ com perfil próprio e perfis de menores na mesma conta | Pedido do dono: o app estava "excessivamente focado em pais" |
| Faixa Adulto reaproveita treinos e testes de 15–17 na v1 | Opção recomendada, escolhida pelo dono |
| Perfil próprio do adulto também exige consentimento (`SELF_CONSENT_VERSION`) | "Algo doeu?" é dado de saúde (LGPD art. 11, I); decisão técnica comunicada ao dono |
| **Sem PIN** na tela Conta | Pedido do dono: "Nao tem nada que demande tanta restrição"; ficam só as confirmações em dois passos |
| **Conta própria a partir de 16 anos** (2026-09-13; simplificada no mesmo dia) | Cadastro: e-mail, senha e “tenho 16 anos ou mais”. Sem ano de nascimento e sem e-mail de responsável no login. Idade fica no perfil. Contas teen antigas seguem válidas. |
| **App gratuito na v1; Apoie o Arvoredo na tela Conta** (2026-09-13) | Sem anúncio, sem compra no treino. Doação opcional no estilo do site (Pix CNPJ `56660275000106`, QR, WhatsApp). Cotas Bola / Uniforme / Cesta para empresas no site. Captação principal continua fora da loja (incentivo, patrocínio). |

## 4. Estado atual

| Commit | Conteúdo |
|---|---|
| `6cd42a4` | Fundação: cadastro, perfis com autorização, PIN (removido depois), exclusão de conta |
| `fac2cb3` | Treinos guiados por faixa etária e modo demonstração |
| `d752170` | Vídeo do exercício na tela durante o treino guiado |
| `a5f1a3c` | Evolução: testes a cada 4 semanas, meta semanal, sequência e conquistas |
| `0d1da1e` | Privacidade: política, termos, exclusão, revogar e renovar aceite, corrigir e excluir perfil, cópia dos dados; migração 0004 |
| `aae6fd2`, `94a9b77`, `793555b` | Supabase e Vercel registrados; `.env.production`; build ignora variáveis vazias |
| `f0dc858` | Adultos: perfil próprio, tela "Quem vai treinar?", faixa Adulto, consentimento do titular; migração 0005 |
| `8774ff6` | Remove o PIN; textos legais na versão `rascunho-3` |
| (este) | Fila offline; esqueci a senha; conta 16–17; projeto Android Capacitor (`br.org.arvoredo.baseline`); senha para excluir a conta; conversão 16/18 sem migrar histórico; rascunho dos formulários do Play em `docs/GOOGLE_PLAY.md`. Migração 0006. |

Etapas do `README.md`:
1. Fundação — pronta.
2. Treino — pronta.
3. Evolução — pronta.
4. Privacidade e loja — parte do app pronta; rascunho dos formulários em `docs/GOOGLE_PLAY.md` (preencher no Console).
5. Teste e publicação — falta conta de organização, AAB assinado e a migração 0006 no banco real.

**No ar:** https://baseline-six-sigma.vercel.app/ — o commit desta etapa entra no próximo deploy automático, **depois** de o dono rodar a migração 0006.

**Banco:** migrações 0001–0005 aplicadas. **0006 ainda não:** o dono precisa colar `supabase/migrations/0006_conta_16.sql` no SQL Editor antes de adolescentes 16–17 criarem conta no site real.

**Verificação feita:** `npm run build` e `npm run build:demo` passam, o que inclui `tsc --noEmit`. **Não existe suíte de testes.**

**Não conferido:**
- Nenhuma tela das etapas 3 e 4, nem de adultos e sem PIN, foi aberta em navegador por um agente: a automação de navegador travou nesta máquina.
- O dono ainda não confirmou o teste de ponta a ponta no site real (roteiro na seção 9).

## 5. Como rodar

```bash
npm install
npm run dev                   # usa .env.production; crie .env.local para apontar para outro projeto
npm run dev -- --mode demo    # modo demonstração: sem servidor, dados no localStorage
npm run build                 # typecheck + build em dist/
npm run build:demo            # typecheck + build demo em dist-demo/
npx vite preview --outDir dist-demo   # servir a demo localmente
```

- **Ambiente do dono:** Windows 11 com PowerShell. Os avisos do Git sobre LF/CRLF são inofensivos.
- **Memória da máquina:** tarefas longas em segundo plano (loops de `curl` esperando deploy) já foram encerradas por falta de memória. Prefira uma checagem pontual.
- **Aviso de bundle:** o build avisa que o chunk passa de 500 kB. É o `supabase-js`, que entra desde que o site ficou configurado. Dividir o código é opcional.

## 6. Demonstração (prévia pelo celular)

- **Prévia navegável:** modo demonstração (`npm run dev -- --mode demo`). Na tela inicial: **Explorar como adulto** (Rafa + Léo, com treinos e teste) e **Explorar como 16 anos** (Dani, aguardando responsável). Confirmação: `#/confirmar-responsavel`, e-mail `mae@exemplo.com`, código `482193`.
  - Publicada como Artifact do Claude Code a partir de `dist-demo/assets/*`, com uma página de entrada mínima.
  - O CSP da prévia provavelmente bloqueia o player do YouTube, e o download da cópia de dados não funciona dentro dela.
  - Dados antigos da demo podem aparecer como "Precisa de autorização" depois de trocas de versão do termo. É esperado; exclua a conta dentro da demo para recomeçar.
- **Para republicar:** rode `npm run build:demo` e use como página de entrada:
  ```html
  <title>Baseline Demo</title>
  <meta name="theme-color" content="#0d2742">
  <link rel="icon" type="image/png" href="icons/favicon-64.png">
  <link rel="stylesheet" href="assets/index-<hash>.css">
  <div id="root"></div>
  <script type="module" src="assets/index-<hash>.js"></script>
  ```
  Publique os novos `assets/index-*.css|js` e remova os antigos.
- **Plano original do produto:** https://claude.ai/code/artifact/0cfc5c80-19f6-4328-b7fc-f7ca770515b0. Anterior à mudança para adultos.
- **Sem acesso às prévias:** `npm run build:demo` e `npx vite preview --outDir dist-demo`.

## 7. Banco de dados (Supabase)

- **Projeto:** ref `szpmzcrxyisehrvwlene` (`https://szpmzcrxyisehrvwlene.supabase.co`), criado em 2026-09-12.
- **Migrações:** 0001–0005 aplicadas.
- **Auth:** e-mail ativo, confirmação de e-mail obrigatória, cadastro aberto.
- **Chave pública (publishable):** em `.env.production`, versionado. **Nunca** usar a `secret`/`service_role`.
- **E-mail:** SMTP padrão do Supabase, que só entrega para membros da equipe do projeto e com limite baixo por hora. Antes de abrir para outras famílias, configure SMTP próprio (ex.: Resend).

| Migração | O que faz |
|---|---|
| `0001_fundacao.sql` | `athletes`, `consents`, RLS, `create_athlete_with_consent` (perfil + autorização na mesma transação, 6–17), `delete_my_account` (security definer) |
| `0002_treinos.sql` | `training_sessions` (sem update; `discomfort` booleano) |
| `0003_evolucao.sql` | `athletes.weekly_goal` (1–7, padrão 3) e `skill_tests` (`results` jsonb `{id_do_teste: valor}`) |
| `0004_privacidade.sql` | Unicidade do aceite só entre ativos; revogação definitiva por trigger; insert de treino e teste exige aceite ativo |
| `0005_adultos.sql` | `athletes.is_self` (um por conta, imutável); ano de nascimento a partir de 1900; idade por tipo no cadastro e na correção; `create_self_profile_with_consent` |
| `0006_conta_16.sql` | Perfil próprio a partir de 16; tabela `parent_confirmations`; RPCs `parent_confirmation_status`, `register_parent_email`, `confirm_parent_code` |

### Como aplicar uma migração nova

1. Crie `supabase/migrations/0006_<nome>.sql`. Escreva de forma **idempotente** (`if not exists`, `drop ... if exists`, `create or replace`), como as atuais, para poder rodar de novo sem estrago.
2. Mande o arquivo ao dono e peça para rodar **inteiro** no SQL Editor do projeto. Pelo celular, só parte do texto já chegou a ser colada.
   - Terminar com `select 'baseline: 0006 aplicada' as resultado;` dá um sinal claro de que o arquivo foi colado inteiro.
3. **Suba o código só depois** de o banco estar atualizado.
4. Confira pela API pública, com a chave de `.env.production`:
   ```bash
   U=https://szpmzcrxyisehrvwlene.supabase.co; K=<VITE_SUPABASE_ANON_KEY de .env.production>
   curl -s "$U/rest/v1/athletes?select=id,is_self&limit=1" -H "apikey: $K"
   ```
   - `42501 permission denied`: a tabela ou coluna existe e está protegida. É o certo.
   - `42703 does not exist` ou `PGRST205`/`PGRST202`: falta rodar a migração.

## 8. Site na Vercel

- **Endereço:** https://baseline-six-sigma.vercel.app/
- **Deploy:** automático a cada push na `main` (preset Vite, `npm run build`, pasta `dist`). O status aparece no commit do GitHub (`gh api repos/Mosimann-adv/baseline/commits/<sha>/status`).
- **Supabase no build:** vem de `.env.production`.
  - Na Vercel existem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` **vazias**. O `vite.config.ts` ignora variáveis vazias; uma com valor teria prioridade sobre o arquivo.
  - Arrumação opcional: apagar essas duas variáveis no painel.
- **Conferir um deploy:**
  ```bash
  S=https://baseline-six-sigma.vercel.app
  js=$(curl -s "$S/" | grep -o 'assets/index-[^"]*\.js' | head -1); curl -s "$S/$js" | grep -c szpmzcrxyisehrvwlene
  ```
  Resultado `1` significa que o site tem o Supabase. Um trecho de texto novo da interface também serve para confirmar que a versão nova entrou.
- **Páginas públicas** (exigidas pelo Google Play):
  - https://baseline-six-sigma.vercel.app/#/privacidade
  - https://baseline-six-sigma.vercel.app/#/termos
  - https://baseline-six-sigma.vercel.app/#/excluir-conta

## 9. Mapa do código e padrões

```
src/
  main.tsx              faixa "demonstração" quando VITE_DEMO=1; AuthProvider + App
  App.tsx               navegação por estado (union View, sem router) e rotas públicas por hash
  components/ui.tsx     Screen, Group, Field, SwitchRow, Segmented, PrimaryButton, PlainButton, Notice
  state/
    auth.tsx            sessão do adulto dono da conta: signUp, signIn, signOut, deleteAccount
    athletes.ts         perfis + aceites: create (menor, RPC), createSelf (adulto, RPC), update, revoke, authorize, remove
    sessions.ts         treinos registrados (máx. 300 carregados)
    tests.ts            baterias de testes
  lib/
    supabase.ts         isDemo, isSupabaseConfigured, cliente
    demo.ts             backend falso em localStorage (baseline.demo.session / baseline.demo.data)
    types.ts            tipos de domínio (Athlete.is_self, AthletePatch, SkillTestRecord…)
    age.ts              faixas 6–8…15–17 e Adulto; contentBand; allowedBirthYears / adultBirthYears
    consent.ts          termos de menor, adulto e adolescente 16–17
    progress.ts         semanas, sequência da meta, próxima data de teste, evolução por teste, conquistas
    exportData.ts       cópia JSON dos dados da conta (compartilhar ou baixar)
    dates.ts            datas locais (nunca toISOString para dia); semana começa na segunda
    profile.ts          opções de nível e posição
    errors.ts           mensagens amigáveis a partir de erros do Supabase
    offlineQueue.ts     fila de treinos e testes no localStorage; UUID no cliente
    parentConfirm.ts    código e e-mail do responsável (16–17)
    counts.ts           contagem exata de treinos e testes por perfil (além do recorte de 300)
    account.ts          adult vs teen; meta da sessão; idade manda sobre o tipo gravado
    native.ts           botão voltar, tela ligada, compartilhar arquivo e texto no Android
  content/
    programs.ts         11 programas por faixa e nível; VIDEOS com IDs verificados
    tests.ts            7 testes de habilidade; sprint e salto só a partir de 12 anos
    legal.ts            política, termos e página de exclusão (LEGAL_VERSION)
    support.ts          CNPJ, Pix, WhatsApp, Instagram, URLs do site (Apoie o Arvoredo)
  screens/
    AuthScreens         boas-vindas, entrar, criar conta (16+), esqueci a senha por código
    ProfileChoice       "Quem vai treinar?" para conta sem perfis
    NewAthlete          cria perfil: kind "self" (16+) ou "minor" (com declaração de responsável)
    WhoTrains           escolha de perfil; perfil sem aceite aparece bloqueado
    AthleteHome, ProgramDetail, TrainingSession, Progress, TestSession
    GuardianArea        tela Conta (perfis, aceites, dados, Apoie o Arvoredo, código do responsável, textos legais, sair, excluir)
    ConfirmParent       página pública #/confirmar-responsavel
    LegalScreen         renderiza os textos de legal.ts
  styles.css            tokens de design (azul-marinho, laranja, amarelo, creme) e componentes
supabase/migrations/    0001 fundação · 0002 treinos · 0003 evolução · 0004 privacidade · 0005 adultos · 0006 conta 16
```

### Padrões que o código segue

- **Modo demo em toda operação de dados:** cada hook em `src/state/` tem um ramo `if (isDemo)` que chama `src/lib/demo.ts`. Toda função nova de dados precisa desse ramo.
- **`loading` só na primeira carga.** Não volte a marcar `loading = true` num `reload`: o `App` troca a tela pelo splash e desmonta a tela aberta.
- **Aceite manda no acesso.**
  - `activeConsent(consents, athlete)` exige aceite **não revogado e da versão atual** do termo daquele tipo de perfil: `CONSENT_VERSION` para menor, `SELF_CONSENT_VERSION` para adulto.
  - Sem aceite, o perfil aparece bloqueado e o banco recusa treinos e testes novos (policies da 0004).
  - Mudou o texto de um termo? Troque a versão dele. **Todos os perfis daquele tipo ficam bloqueados** até novo aceite, então só troque quando o texto mudar de verdade.
  - `LEGAL_VERSION` (política e termos) é só informativa e não bloqueia nada.
- **RLS em toda tabela nova.**
  - `guardian_id = auth.uid()` e verificação de que o perfil é da conta.
  - Em inserts de dados de treino, exija também aceite ativo.
  - Dentro de subselects, **qualifique as colunas com o nome da tabela** (`skill_tests.athlete_id`). Sem isso, `athlete_id` sozinho vira a coluna da tabela do subselect e a verificação passa sempre.
- **Nomes internos antigos:** `guardian_id` significa "dono da conta", e `GuardianArea` é a tela Conta. Renomear exigiria migração e não traz ganho.
- **Coleta mínima e dado de saúde mínimo:** a dor é só `discomfort` sim/não. Não crie campo de texto livre sobre saúde.
- **Textos por tipo de perfil:** mensagens de segurança mudam para adulto (`athlete.is_self`), por exemplo "Pare de treinar agora" em vez de "conte para um adulto".
- **Visual:**
  - listas agrupadas no estilo nativo;
  - títulos na fonte Breymont com `text-transform: lowercase`, porque as maiúsculas são estilizadas e a fonte não tem – nem —;
  - nenhuma biblioteca de interface externa;
  - vídeos só por `youtube-nocookie.com`.
  - doação só na tela Conta; constantes em `src/content/support.ts`.

## 10. Próximos passos

### 10.1 Pendentes de confirmação com o dono

- **Roteiro de teste no site real** (pelo celular), ainda sem retorno:
  1. Criar conta com o próprio e-mail, confirmar pelo link e entrar.
  2. "Quem vai treinar?" → **Eu** → criar perfil de adulto → treino com **vídeo tocando** → salvar.
  3. Evolução: meta, registrar um teste, gráfico, conquistas.
  4. Conta (abre sem PIN) → adicionar criança ou adolescente → revogar e autorizar de novo → corrigir perfil → baixar dados.
  5. Abrir `#/privacidade` e `#/excluir-conta`.
- **URL Configuration** no Supabase (Site URL `https://baseline-six-sigma.vercel.app` e Redirect URL `https://baseline-six-sigma.vercel.app/**`). Foi pedida ao dono, mas não foi confirmada. Sem ela, o link de confirmação de e-mail vai para o endereço errado.

### 10.2 Código (ordem combinada)

1. **Fila offline para treinos e testes** — feita.
2. **Esqueci a senha** — feita.
3. **Conta a partir de 16 anos** — feita no app. Rodar a migração **0006** no Supabase antes de usar no site real.
4. **Projeto Android (Capacitor)** — pasta `android/` no repositório, `appId` `br.org.arvoredo.baseline`, sem `AD_ID`, sem backup na nuvem, ícone da marca. Falta JDK 21 / Android Studio na máquina do dono para `npm run android:sync` e gerar o AAB.
5. **Formulários do Google Play** — rascunho em `docs/GOOGLE_PLAY.md`. Preencher no Console (dono).
6. **Senha para excluir a conta** — feita (alternativa combinada ao PIN).
7. **Conversão 16/18** — feita como aviso, sem migrar histórico: o perfil de menor permanece na conta do responsável; a pessoa pode criar login próprio se quiser. Aos 18, o adolescente vira adulto pela idade e precisa do termo de adulto para seguir treinando.
8. **Vídeos dos exercícios** — 40 de 44 com ID conferido (Jr. NBA, USA Basketball e os cinco já usados). Sem vídeo: cintura, polichinelo, pular num pé só, equilíbrio de cegonha.

Não há mais item de código da v1 além da revisão jurídica, da validação do profissional e do que depende do dono (migração 0006, Play, AAB).

### 10.3 Captação de recursos (decidida em 2026-09-13)

- **App gratuito na v1.** Sem compra, sem assinatura, sem anúncio.
- **"Apoie o Arvoredo" na tela Conta**, no estilo do site [arvoredobasquete.pages.dev](https://arvoredobasquete.pages.dev/#doar): texto "Cada real vira treino, bola e oportunidade", QR Pix, copiar chave CNPJ `56660275000106`, WhatsApp e Instagram. Link para cotas de empresas (Bola, Uniforme, Cesta) no site. **Nunca** na tela de treino.
- Doação é para o Instituto, fora do Google Play Billing. Se a política de Pagamentos do Play mudar, o advogado revisa antes da publicação na loja.
- **Captação principal fora da loja:** Lei de Incentivo ao Esporte (Lei 11.438/2006, permanente pela Lei 14.439/2022), Fundos da Infância e Adolescência (art. 260 do ECA), termos de fomento (Lei 13.019/2014), patrocínio e editais, e Google for Nonprofits (anúncios para divulgação). Confirmar os percentuais de dedução vigentes.
- **Indicadores de impacto** (perfis ativos, treinos, evolução média) só com dados **agregados e anônimos**, e depois de incluir essa finalidade na política e nos termos de aceite. Isso significa nova versão dos termos e novo aceite. **Não está na v1.**

## 11. Pendências fora do código (dependem do dono)

- [x] Projeto Supabase criado e migrações 0001–0005 aplicadas.
- [x] Deploy web na Vercel funcionando com o Supabase.
- [ ] Rodar a migração 0006 (`supabase/migrations/0006_conta_16.sql`) no SQL Editor.
- [ ] Confirmar a URL Configuration no Supabase (seção 10.1).
- [ ] Testar de ponta a ponta no site real (seção 10.1).
- [ ] SMTP próprio no Supabase antes de abrir para outras famílias.
- [ ] (Opcional) Apagar as variáveis vazias `VITE_SUPABASE_*` na Vercel.
- [x] Projeto Android Capacitor no repositório (`android/`, `appId` `br.org.arvoredo.baseline`).
- [ ] JDK 21 / Android Studio na máquina do dono, para gerar o AAB.
- [ ] Conta de organização no Google Play (Instituto Arvoredo, D-U-N-S).
- [x] `appId` definido (`br.org.arvoredo.baseline`); permanente depois da primeira publicação.
- [ ] Revisão jurídica de `src/lib/consent.ts` e `src/content/legal.ts`. Ainda faltam:
  - e-mail de privacidade e nome do encarregado (hoje o canal é o WhatsApp);
  - nome e CREF do profissional de educação física.
  Já preenchidos: CNPJ, endereço de treino, região São Paulo do Supabase, prazo de 15 dias úteis para exclusão por WhatsApp, app gratuito.
- [x] CNPJ do Instituto preenchido (`56.660.275/0001-06`); app descrito como gratuito; Apoie o Arvoredo na tela Conta.
- [ ] Validação dos 11 programas e dos 7 testes por profissional de educação física, inclusive o uso deles para adultos.
- [ ] Vídeos: **40 de 44 exercícios** têm vídeo conferido; lista em `docs/VIDEOS.md`. Sem vídeo: bola em volta da cintura, polichinelo, pular num pé só, equilíbrio de cegonha.
- [ ] Copiar `docs/GOOGLE_PLAY.md` no Play Console.

## 12. Riscos e questões em aberto

- **Sem PIN:** uma criança com o aparelho do adulto ainda abre a Conta. **Excluir a conta pede a senha.** Revogar aceite e excluir perfil continuam só com confirmação em dois passos.
- **Revogação guarda os registros** até novo aceite ou exclusão do perfil. A revisão jurídica pode preferir exclusão automática após um prazo.
- **Menor que completa 16 ou 18 anos:** o perfil continua no responsável. O app avisa que a pessoa pode criar conta própria; o histórico **não migra**. Aos 18, conta de adolescente passa a ser adulta pela idade e o termo de adulto precisa ser aceito de novo.
- **Faixa Adulto:** reaproveita o conteúdo de 15–17. Treinos específicos para adultos dependem do profissional de educação física.
- **Contagens com limite:** a lista da Evolução carrega no máximo 300 treinos; a tela Conta usa a contagem exata no banco.
- **Idade por ano:** calculada como `ano atual − ano de nascimento`, no app e no banco.
- **Comparação só consigo mesmo:** conquistas e testes nunca comparam pessoas. Mantenha assim.
