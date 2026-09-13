# Baseline by Arvoredo

App de treinos de basquete para adultos e para crianças e adolescentes. A conta é de um adulto, que pode treinar pelo próprio perfil e criar perfis para os menores que acompanha. Cada perfil treina, registra e acompanha a própria evolução.

Stack: Vite + TypeScript + React, empacotado para Android com Capacitor. Dados no Supabase.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher com o projeto Supabase do Baseline
npm run dev
```

## Banco (Supabase)

1. Criar um projeto novo, região São Paulo (não usar o projeto do app pessoal).
2. Em **Authentication**, deixar ativo o login por e-mail e senha, com confirmação de e-mail.
3. Rodar no SQL Editor, em ordem, os arquivos de `supabase/migrations/` (`0001_fundacao.sql`, `0002_treinos.sql`, `0003_evolucao.sql`, `0004_privacidade.sql`, `0005_adultos.sql`).
4. Copiar a Project URL e a chave pública para `.env.local`.

## Android

```bash
npm run android:sync   # build + copia para o projeto Android
npm run android:open   # abre no Android Studio
```

Requer JDK 21 (o Android Studio já traz um em `jbr`).

## Etapas

1. **Fundação** — cadastro do responsável, perfis com autorização, PIN, exclusão de conta. ✓
2. **Treino** — biblioteca por faixa etária com vídeos, treino guiado, registro. ✓
3. **Evolução** — testes a cada 4 semanas, meta semanal, sequência, conquistas, histórico. ✓
4. **Privacidade e loja** — política de privacidade, termos, página de exclusão, revogar e renovar autorização, corrigir e excluir perfil, cópia dos dados ✓; formulários do Google Play pendentes.
5. **Teste e publicação** — conta de organização do Instituto Arvoredo, teste fechado, publicação.

## Pendências antes de publicar

- Confirmar o `appId` em `capacitor.config.ts` (permanente depois da primeira publicação).
- Revisão jurídica do termo em `src/lib/consent.ts` e dos textos em `src/content/legal.ts`; preencher os trechos entre colchetes (CNPJ, e-mail de privacidade, encarregado, prazos, região do Supabase, profissional de educação física).
- Endereços públicos para o Google Play: https://baseline-six-sigma.vercel.app/#/privacidade (política) e https://baseline-six-sigma.vercel.app/#/excluir-conta (exclusão de conta).
- Validação dos treinos por profissional de educação física.
- Número D-U-N-S do Instituto Arvoredo para a conta de organização no Google Play.
