# Formulários do Google Play — Baseline by Arvoredo

Rascunho para copiar no Play Console. Confira com a revisão jurídica antes de publicar.
Conta da loja: **organização do Instituto Arvoredo** (pede D-U-N-S). `appId` permanente: `br.org.arvoredo.baseline`.

Endereços públicos:

- Política de privacidade: https://baseline-six-sigma.vercel.app/#/privacidade
- Termos de uso: https://baseline-six-sigma.vercel.app/#/termos
- Excluir conta: https://baseline-six-sigma.vercel.app/#/excluir-conta

O app é **gratuito**. Sem compra, sem anúncio, sem assinatura. Doação Pix só na tela Conta, fora da loja.

---

## 1. Público-alvo e Famílias

| Campo | Resposta |
|---|---|
| O app é dirigido a crianças? | **Sim**, também. Público **misto**: adultos, adolescentes e crianças a partir de 6 anos. |
| Programa Famílias | **Sim.** Crianças treinam pelo perfil criado pelo responsável. Conta própria só a partir de 16. |
| Idade-alvo | 6 anos ou mais (faixas 6–8, 9–11, 12–14, 15–17 e Adulto). |
| Anúncios | **Não.** |
| Identificador de publicidade | **Não.** O manifesto Android remove `AD_ID`. |
| Chat, conteúdo gerado por usuário, localização | **Não.** |
| Compras no app | **Não.** |

---

## 2. Classificação de conteúdo (IARC)

App de treino esportivo, sem violência, sem linguagem, sem conteúdo sexual, sem compras.

Responda **Não** a violência, drogas, sexo, linguagem, compras, localização, conteúdo gerado por usuário e compartilhamento de dados para anúncios.

Expectativa: classificação livre / PEGI 3 / Everyone.

---

## 3. Segurança dos dados (Data safety)

Cifra em trânsito: **sim** (HTTPS). Os dados podem ser apagados na tela Conta e em `#/excluir-conta`.

| Dado | Coletado | Finalidade | Opcional | Compartilhado |
|---|---|---|---|---|
| E-mail da conta | Sim | Funcionalidade do app (login) | Não | Não (só o processador Supabase) |
| Senha | Sim (hash no login) | Funcionalidade | Não | Não |
| Apelido, ano de nascimento, nível, posição, meta | Sim | Funcionalidade (treino por faixa) | Posição é opcional | Não |
| Atividade no app (treinos e testes) | Sim | Funcionalidade | Não | Não |
| Saúde: “algo doeu?” sim/não | Sim | Funcionalidade (orientação para parar) | Não | Não |
| E-mail do responsável (conta 16–17) | Sim | Funcionalidade (confirmação) | Não, se a conta for 16–17 | Não |

Não coletamos: nome completo, data de nascimento completa, foto, voz, escola, endereço, localização, contatos, ID de publicidade, diagnóstico médico.

Não vendemos dados. Não usamos dados para publicidade. Não há SDK de análise de terceiros.

Processadores: Supabase (banco e login), Vercel (site), YouTube no modo sem cookies (só se a pessoa tocar o vídeo).

---

## 4. Ficha da loja (texto curto)

**Título (máx. 30):** `Baseline`

**Descrição curta (máx. 80):** `Treinos de basquete guiados para você e para quem você acompanha.`

**Descrição longa:**

```
Baseline é o app de treinos de basquete do Instituto Arvoredo.

Treinos guiados com vídeo na tela, registro de como foi o treino, testes a cada 4 semanas e evolução só com você mesmo — sem ranking e sem comparar pessoas.

A conta é a partir de 16 anos. De 16 a 17, um responsável confirma. Crianças a partir de 6 anos treinam pelo perfil criado pelo responsável. Adultos também treinam.

O app é gratuito. Sem anúncios. Na tela Conta há um Apoie o Arvoredo (Pix), opcional, para o Instituto.

Conteúdo em validação por profissional de educação física antes do lançamento.
```

**Categoria:** Saúde e fitness (ou Esportes).

---

## 5. Depois do envio

1. Conta de organização + D-U-N-S.
2. JDK 21 / Android Studio na máquina do dono: `npm run android:sync` e gerar o AAB assinado.
3. Rodar a migração 0006 no Supabase **antes** de adolescentes 16–17 criarem conta no site real.
4. Confirmar Site URL e Redirect URL no Auth do Supabase.
5. SMTP próprio antes de abrir para outras famílias (o e-mail padrão do Supabase só chega na equipe).
