# Baseline by Arvoredo

App de treinos de basquete para crianças e adolescentes. O responsável cria a conta e o perfil de cada atleta; o atleta treina, registra e acompanha a própria evolução.

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
3. Rodar `supabase/migrations/0001_fundacao.sql` no SQL Editor.
4. Copiar a Project URL e a chave pública para `.env.local`.

## Android

```bash
npm run android:sync   # build + copia para o projeto Android
npm run android:open   # abre no Android Studio
```

Requer JDK 21 (o Android Studio já traz um em `jbr`).

## Etapas

1. **Fundação** — cadastro do responsável, perfis com autorização, PIN, exclusão de conta. ← atual
2. **Treino** — biblioteca por faixa etária com vídeos, treino guiado, registro.
3. **Evolução** — testes a cada 4 semanas, metas, conquistas, histórico.
4. **Privacidade e loja** — política de privacidade, termos, formulários do Google Play.
5. **Teste e publicação** — conta de organização do Instituto Arvoredo, teste fechado, publicação.

## Pendências antes de publicar

- Confirmar o `appId` em `capacitor.config.ts` (permanente depois da primeira publicação).
- Revisão jurídica do termo em `src/lib/consent.ts`, da política de privacidade e dos termos de uso.
- Validação dos treinos por profissional de educação física.
- Número D-U-N-S do Instituto Arvoredo para a conta de organização no Google Play.
