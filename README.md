# Baseline by Arvoredo

App de treinos de basquete para adultos, para adolescentes a partir de 16 anos e para crianças e adolescentes acompanhados por um responsável. A conta é a partir de 16 anos: quem cria declara ter 16 anos ou mais. Cada perfil treina, registra e acompanha a própria evolução. O app inclui treino guiado retomável, evolução por testes, calendário e uma aba com vídeos do Instituto. É gratuito; na tela Conta há um Apoie o Arvoredo (Pix), no estilo do site do Instituto.

Stack: Vite + TypeScript + React, empacotado para Android com Capacitor. Dados no Supabase.

- **No ar:** https://baseline-six-sigma.vercel.app/ (deploy automático a cada push na `main`).
- **Para continuar o desenvolvimento:** leia `AGENTS.md` e `docs/CONTINUIDADE.md` (decisões, estado, verificação e próximos passos).

## Rodar localmente

```bash
npm install
npm run dev                  # usa o projeto Supabase de .env.production
npm run dev -- --mode demo   # demonstração sem servidor (dados no navegador)
npm run dev:demo            # a mesma demonstração, acessível na rede local
npm test                     # suíte Vitest
npm run build                # typecheck + build de produção
```

### Experiência local de 29/09/2026

Navegação: **Treinar · Evolução · Aprender · Conta**, com troca de perfil no cabeçalho.
A biblioteca distingue blocos curtos e sessões maiores. Há exploração antes do cadastro,
início direto com preparação, conclusão retomável por perfil,
testes individuais com cronômetro e recência própria, metas históricas e conquistas
permanentes. As demonstrações ficam na aba Aprender; as trilhas estão pausadas por
decisão do dono, até haver material suficiente. A escolha assistida por tempo/equipamento/acompanhamento foi excluída
por decisão do dono.

Para testar sem servidor: `npm run dev:demo` → **Explorar** (Rafa/Léo) ou
**Conhecer os treinos** (sem conta). Para testar abertura offline da versão web,
use o build (`npm run build:demo` e `npx vite preview --outDir dist-demo`) em
localhost ou HTTPS; o servidor de desenvolvimento não instala o cache de arquivos.

Antes de usar as novas sessões no banco real, aplique
`supabase/migrations/0007_experiencia_pratica.sql`, depois da 0006. A demo dispensa
essa operação. Conteúdo novo e sessões são **rascunho pedagógico**.
Detalhes e verificações: `docs/IMPLEMENTACAO_UX_2026-09-29.md`.

## Banco (Supabase)

1. Criar um projeto novo, região São Paulo (não usar o projeto do app pessoal).
2. Em **Authentication**, deixar ativo o login por e-mail e senha, com confirmação de e-mail.
3. Rodar no SQL Editor, em ordem, os arquivos de `supabase/migrations/` (`0001_fundacao.sql` … `0007_experiencia_pratica.sql`).
4. Copiar a Project URL e a chave pública para `.env.production`, ou para `.env.local` se for um projeto só de desenvolvimento.
5. Em **Authentication → URL Configuration**, usar o endereço do site como Site URL e `<site>/**` como Redirect URL.

O projeto em uso (`szpmzcrxyisehrvwlene`) já tem as migrações 0001–0005. A 0006 (conta 16–17) precisa ser rodada no SQL Editor antes do cadastro de adolescentes.

## Android

```bash
npm run android:sync   # build + copia para o projeto Android
npm run android:open   # abre no Android Studio
```

Requer JDK 21 (o Android Studio já traz um em `jbr`). O projeto `android/` já está no repositório (`appId` `br.org.arvoredo.baseline`). Formulários da loja: `docs/GOOGLE_PLAY.md`.

## Etapas

1. **Fundação** — cadastro, perfis com aceite, exclusão de conta ✓ (depois: perfil próprio para adultos; PIN removido).
2. **Treino** — biblioteca por faixa etária com vídeos, treino guiado, registro. ✓
3. **Evolução** — testes a cada 4 semanas, meta semanal, sequência, conquistas, histórico. ✓
4. **Privacidade e loja** — política de privacidade, termos, página de exclusão, revogar e renovar autorização, corrigir e excluir perfil, cópia dos dados ✓; formulários do Google Play pendentes.
5. **Teste e publicação** — conta de organização do Instituto Arvoredo, teste fechado, publicação.

## Pendências antes de publicar

- Revisão jurídica de `src/lib/consent.ts` e `src/content/legal.ts` (encarregado, e-mail de privacidade, CREF do profissional).
- Endereços públicos: https://baseline-six-sigma.vercel.app/#/privacidade e https://baseline-six-sigma.vercel.app/#/excluir-conta.
- Validação dos treinos por profissional de educação física.
- Rodar a migração `0006_conta_16.sql` no SQL Editor do Supabase.
- Aplicar `0007_experiencia_pratica.sql` antes de publicar esta rodada de experiência.
- Número D-U-N-S do Instituto Arvoredo para a conta de organização no Google Play.
