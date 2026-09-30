# Implementação da experiência — 29/09/2026

Pedido: aplicar a análise ampla, **exceto o item 2 da resposta (escolha assistida por tempo, equipamento e companhia)**. Implementação local coordenada pelo maestro, com entregas do OpenCode #2 e #3 revisadas, integradas e verificadas.

**Atualização de 30/09/2026:** o dono pediu para pausar as trilhas por falta de material,
mantendo as sessões maiores, e retirar o modo “Aprender e começar”. A experiência atual
oferece **Blocos · Sessões** e um único **Começar treino**, com preparação de 5 s e
execução automática. A aba Aprender continua como espaço separado para demonstrações.
Rascunhos antigos são retomados sem perder progresso; metadados históricos de trilha e
modo permanecem apenas para compatibilidade. O resumo abaixo documenta a rodada original
e seus testes; esta atualização prevalece sobre as referências às trilhas e ao modo aprender.

Verificação da simplificação: typecheck, **90 testes em 14 arquivos**, builds normal/demo e
**6 percursos de navegador**, sem erros de JavaScript. Foram conferidos a preferência
antiga de Trilhas voltando a Blocos, a sessão maior com um único começo e avanço automático,
o recibo/Evolução sem chamadas de trilha, as demonstrações da aba Aprender, a retomada
de rascunho antigo no mesmo exercício e o layout compacto de 320 px.

## Testar agora

- Prévia desta sessão: `http://localhost:4173/`.
- Celular na mesma rede: `http://192.168.1.12:4173/` (endereço da máquina nesta sessão).
- **Explorar** abre Rafa e Léo com dados de exemplo.
- **Conhecer os treinos** mostra a entrada pública, sem conta e sem registrar dados.
- **Criar conta vazia** demonstra o cadastro e criação de perfis, com dados somente no navegador.

Para rodar de novo:

```sh
npm run dev:demo
```

Para testar o cache de abertura offline da web:

```sh
npm run build:demo
npx vite preview --outDir dist-demo --host 0.0.0.0 --port 4173
```

O service worker exige localhost ou HTTPS. No endereço HTTP da rede local, os fluxos e dados da demo funcionam, mas o navegador pode não permitir instalar o cache dos arquivos. Reinicie o processo de preview quando gerar outro build.

## O que foi implementado

### Entrada, navegação e Conta

- Exploração pública por faixa e fundamento, com demonstração temporária de um exercício. Nenhum perfil, idade persistida, histórico ou dado de saúde nesse percurso.
- Cadastro da conta mantém e-mail, senha, declaração de 16+ e aceites. Perfil mantém apelido/ano/nível/aceite específico; posição passa para edição posterior.
- Exemplos de nível adequados também a adultos.
- Confirmação de e-mail com reenvio, cooldown e correção do endereço.
- Recuperação conserva o estado entre código válido e gravação da senha nova, inclusive após refresh; erros mantêm a etapa e cancelamento sai da conta.
- Abas Treinar, Evolução, Aprender, Conta; troca de perfil no cabeçalho.
- Conta e saída disponíveis mesmo sem perfis. Som/voz antes do apoio, que fica recolhido e opcional na Conta.
- Voltar usa uma pilha de telas: diálogo > tela interna > navegação geral. Respeita subtelas, confirmações e salvamento em andamento.
- Contraste do botão primário e ações de cópia melhorado; controles com alvo confortável e layout verificado em 320 px.

### Prática e conteúdo

- **20 blocos, 87 exercícios, 56 referências de vídeo**; 7 dessas referências são de prévia, 49 para execução.
- Os cinco fundamentos estão disponíveis em todas as faixas. Foram adicionados três blocos lúdicos de 6–8 e Passe em movimento para 15–17/Adulto.
- **4 sessões compostas** com preparação, blocos identificados e fechamento; a faixa Adulto reutiliza a de 15–17.
- **Trilha piloto de 4 etapas por faixa de conteúdo**, escolhida pela pessoa, sem prazo imposto. Etapa completa exige todos os exercícios e salvamento.
- Modos Aprender (demonstração sem gastar a duração do exercício) e Direto. A preparação dura 5 s; modo aprender aguarda “Estou pronto” também nos movimentos seguintes.
- Player preservado na passagem de descanso para execução, com instrução alternativa, indicação de indisponibilidade e retry.
- Concluir, pular, pausar, ampliar descanso e encerrar são ações distintas. Pular não vira exercício concluído.
- Tempo efetivo mede trabalho e descanso; preparação, aprendizado e pausa ficam fora. Segundos precisos vão na composição; minutos são arredondados, sem mínimo artificial de 1.
- Conclusão e respostas ficam em rascunho por conta/perfil até salvar ou descartar. Trocar de perfil não sobrescreve o andamento de outro.
- Resposta de dor obrigatoriamente explícita; satisfação opcional com âncoras de sentimento, sem confundir dificuldade e satisfação.
- Recibo indica servidor ou aparelho, mostra a semana e permite continuar/abrir evolução.

### Evolução e medições

- Resumo com próxima ação, mapa e alternativa em lista, testes e conquistas em painéis distintos.
- Frequência não é nota de habilidade. Sessões compostas distribuem os fundamentos segundo os exercícios efetivamente concluídos.
- Histórico integral com paginação da API em lotes de 1000; apresentação em porções menores, com calendário e gráfico sob demanda.
- Meta em vigor por semana, sem reinterpretar semanas antigas ao ajustar a atual. Para datas anteriores à migração, usa-se a meta disponível, sem inventar valores anteriores.
- Conquistas registradas de forma permanente, incluindo meses anteriores e marcas já melhoradas.
- Testes individuais com guia, entrada rápida, cronômetro opcional, unidade/faixa clara, rascunho e recibo. Cada teste tem sua recência de 28 dias.

### Confiabilidade, dados e offline

- UUID do rascunho mantido até o envio; mesma identificação em fila e servidor.
- Fila single-flight por conta, retry coalescido, limpeza em lote dos IDs já recebidos e recusa de escrita quando o aparelho não consegue guardar o registro.
- Offline conhecido guarda imediatamente e dá recibo, sem aguardar timeout de rede.
- Cache de perfis, aceites e histórico por conta. Apagar perfil limpa os dados locais correspondentes; sair/excluir conta remove cópias e rascunhos.
- Leituras iniciadas antes de revogação, exclusão ou saída não reconstituem o cache antigo. Cargas de perfis fora de ordem não desfazem a mais recente.
- Service worker pré-carrega só arquivos públicos da interface/fontes/imagens. Não intercepta Supabase, YouTube ou POSTs. Corrigida a diferença de header CORS/Origin que impedia ler alguns assets offline.
- Política informativa atualizada para `LEGAL_VERSION 2026-09-rascunho-9`, descrevendo o cache, composição e conquistas. Finalidade continua evolução individual/familiar; sem métricas de impacto ou análise de terceiros.

## Correções da análise original

| Item | Resultado |
|---|---|
| UX-01 | Código validado não abre a área autenticada antes da senha nova |
| UX-02 | Conclusão ainda não salva é restaurável |
| UX-03 | Ausência de resposta não vira “Não” |
| UX-04 | Histórico do programa filtrado também pelo atleta |
| UX-05 | Sem exercício concluído não há prática registrada/meta |
| UX-06 | Descanso ampliado é restaurado sem reiniciar |
| UX-07 | Conta/saída disponíveis sem perfis |
| UX-08 | Filtro, tipo de biblioteca e posição de prateleiras guardados |
| UX-09 | Janela de medição independente por teste |
| UX-10 | Rascunhos por conta/perfil |
| UX-11 | Tempo efetivo exclui pausas |
| UX-12 | Histórico completo paginado, sem teto de 300 |
| UX-13 | Voltar tratado pela tela ativa e pelo estado de salvamento |
| UX-14 | Texto escuro sobre coral suave nos controles principais |

## Banco real

Arquivo: `supabase/migrations/0007_experiencia_pratica.sql`.

- `training_sessions.execution`: composição, duração efetiva, modo e etapa da trilha.
- `athletes.goal_history`: metas por semana.
- `athletes.earned_badges`: conquistas, com união permanente no update.
- Validador de composição e invariante de exercícios concluídos.
- Retirada do default de `discomfort`: omitir a resposta não gera “Não”.

Não cria tabela nova nem enfraquece RLS ou verificação de aceite. Idempotente. Aplicar na ordem das migrações existentes; a 0006 continua necessária para perfil próprio de 16–17 no banco real. A prévia em modo demo funciona integralmente sem essas operações.

## Verificações concluídas

- `npm run typecheck`.
- `npm test`: **90 testes em 14 arquivos**.
- `npm run build` e `npm run build:demo`.
- **12 percursos de UI em Chromium**: exploração sem dados, filtros, aprender/descanso/retomada, conclusão/respostas/UUID, pular tudo, dois perfis, Conta/cadastro/6 anos, trilha/sessão, Aprender, teste individual, 320 px e conta vazia.
- **5 percursos com backend interceptado e sintético**: recuperação válida/inválida com refresh/erro; 1001 registros paginados; pré-cache; abertura fria offline; salvar offline e reenviar sem duplicação.
- **PostgreSQL local em memória (PGlite)**: migração reaplicada 3x; metas preservadas; conquistas não removidas; composição válida/inválida; falta de resposta de dor recusada.
- Sem erros de JavaScript nos percursos de navegador.

Não foram usadas credenciais reais nem aplicada a migração no Supabase. Conteúdo pedagógico novo e composição das sessões/trilhas continuam em rascunho até validação do profissional. Áudio, reprodução do vídeo externo e interação física no Android precisam da avaliação em aparelho, além dos fluxos de navegador já verificados.
