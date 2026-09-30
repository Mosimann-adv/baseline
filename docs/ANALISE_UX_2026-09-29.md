# Baseline — análise ampla da experiência do usuário

Data: 29/09/2026. Base: código local e decisões registradas até esta análise.

## 1. Conclusão e recomendação

**O maior potencial de melhoria é transformar o Baseline em um guia de prática, capaz de ajudar a pessoa a escolher, aprender, executar e continuar.** Hoje o app oferece uma biblioteca organizada e um bom conjunto de ferramentas de execução, mas ainda deixa muitas decisões importantes com quem usa.

As perguntas centrais de uma experiência melhor seriam:

1. O que consigo treinar com o tempo e os recursos que tenho agora?
2. Como faço este movimento, especialmente se ainda não o conheço?
3. Como acompanho o treino sem precisar ficar mexendo no celular?
4. O que pratiquei e o que realmente mudou nas minhas marcas?
5. Qual é o próximo passo?

Recomendo uma evolução em três movimentos:

- **Confiabilidade:** corrigir perdas de registro, mistura de históricos e fluxos de acesso interrompidos.
- **Orientação:** oferecer escolha assistida, melhorar a passagem da demonstração para a execução e tornar a conclusão do treino mais útil.
- **Estrutura pedagógica:** desenvolver sessões e trilhas curtas com progressão validada, ajustadas ao contexto e à faixa etária.

O visual já tem identidade própria. As maiores oportunidades estão na orientação, no conteúdo e na coerência da jornada.

## 2. Como a análise foi feita

### Fontes e verificações

- Leitura de `AGENTS.md`, `docs/CONTINUIDADE.md`, `README.md` e `docs/VIDEOS.md`.
- Inspeção da navegação, autenticação, perfis, catálogo, treino guiado, conclusão, evolução, testes, Conta e fila offline.
- Navegação na versão atual em modo demonstração, inclusive pelo portal do Maestri.
- Verificações com Playwright em Chromium, com contextos de celular e toque, em **390 × 844** e **360 × 640**.
- Percursos com adulto, criança de 10 anos, criança de 6 anos e criação de perfil próprio de 16 anos.
- Reprodução de escolha e retorno ao catálogo, treino interrompido, salvamento sem respostas, troca de perfil, teste parcial e retomada após descanso ampliado.
- Verificação do fluxo de recuperação de senha com respostas de autenticação **simuladas e interceptadas**, sem usar uma conta real.
- Contagem dos programas e da cobertura de vídeo a partir do módulo atual de conteúdo.
- Cálculo de contraste das cores do botão primário.

Para medir a disposição das telas com Playwright, a faixa extra de demonstração foi ocultada apenas no navegador de auditoria. Ela não existe em produção e adicionaria rolagem artificial às capturas.

### Alcance das conclusões

Os defeitos descritos como reproduzidos foram observados nos percursos acima. As propostas de produto são **hipóteses fundamentadas**, ainda sem pesquisa com usuários ou medidas de abandono e retenção.

Esta análise não confirma o estado atual do SMTP, das migrações no Supabase ou do deploy público. As pendências desses serviços vêm da documentação. Reprodução de vídeo, áudio, legibilidade ao sol e comportamento do botão físico precisam de avaliação em aparelho real; a navegação local não substitui essa avaliação.

## 3. O que já funciona bem

- Identidade visual reconhecível e consistente com o Instituto Arvoredo.
- Catálogo mais limpo, com prateleiras por fundamento e filtro de cesta facilmente compreensível.
- Tempo e número de exercícios visíveis antes de abrir um treino.
- Prévia dos exercícios com instruções e vídeos disponíveis.
- Cronômetro grande, pausa, descanso adicional, sinais sonoros e retomada.
- Comparação de marcas da própria pessoa, com separação explícita entre frequência e habilidade no mapa.
- Perfis de adultos e menores na mesma conta, sem exigir login da criança.
- Controle de dados e aceites na Conta, com confirmação de ações irreversíveis.
- Fonte embutida, carregamento de telas sob demanda, estados de erro e tratamento de redução de movimento.

Esses recursos dão uma boa base para uma experiência mais orientada.

## 4. Diagnóstico por etapa da jornada

### 4.1 Entrada: a pessoa precisa se comprometer antes de conhecer o benefício

Em produção, as boas-vindas oferecem criar conta ou entrar. A opção de explorar existe somente na demonstração.

A primeira jornada passa por cadastro, aceite dos termos, confirmação de e-mail, acesso à conta, escolha de quem treina, criação do perfil e consentimento específico, antes da escolha do treino. O cadastro da conta é relativamente curto; o formulário seguinte é bem mais longo.

No formulário de perfil:

- Há apelido, ano, nível, posição e aceite na mesma tela.
- O seletor de ano do perfil próprio tem **75 opções**, de 16 a 90 anos na data da análise.
- A posição é opcional, mas recebe um bloco visual antes do aceite e não é usada para selecionar treinos no código atual.
- O nível altera pouco a oferta: a maioria dos programas aceita todos os níveis; na faixa 15–17/Adulto, intermediário e avançado recebem um programa adicional de arremesso.
- A pessoa precisa entender a diferença entre conta e perfil antes de perceber o valor do treino.

**Proposta:** permitir conhecer a biblioteca e uma demonstração antes do cadastro. Ao querer registrar a prática, explicar o benefício da conta e conduzir ao perfil com aceite. A exploração pública pode usar uma faixa escolhida temporariamente, sem criar perfil, histórico ou registro de saúde.

Na criação do perfil, priorizar os campos que de fato definem o primeiro treino. Posição pode ficar para edição posterior. O nível precisa de exemplos concretos ou pode começar como iniciante, com ajuste posterior. O ano continua no perfil; não há motivo de experiência para pedir data completa.

Dividir um formulário em etapas só ajuda se a leitura e a decisão ficarem mais simples. Acrescentar páginas sem retirar decisões seria apenas aumentar os toques. O aceite específico deve continuar claro e registrado junto com a criação do perfil.

### 4.2 Escolha: a organização por fundamento ajuda quem já sabe o que procura

As prateleiras respondem bem a “quero treinar drible”. Respondem menos bem a “estou começando; o que faço agora?”.

O filtro atual distingue cesta, mas não resolve outras condições importantes:

- Uma ou duas bolas.
- Espaço compacto, 5 metros ou 10 metros livres.
- Parede disponível.
- Exercício individual ou com parceiro.
- Participação de um adulto em uma brincadeira ou medição.

Por exemplo, “Sem cesta” pode levar tanto a um treino compacto quanto a um que exige 10 metros e parceiro. Isso é compatível com o nome do filtro, mas insuficiente para concluir que o treino cabe no contexto da pessoa.

**Proposta imediata:** um acesso discreto **“Me ajude a escolher”**, que abre uma escolha assistida curta. Isso respeita a decisão recente de simplificar a tela inicial e evita recolocar ali vários cartões de meta, histórico e recomendações.

Exemplo de fluxo proposto:

> Quanto tempo você tem? → Quais recursos estão disponíveis? → Está treinando sozinho ou acompanhado? → Uma sugestão principal, com a razão da escolha e acesso às demais opções.

As perguntas podem aparecer progressivamente, apenas quando mudarem o resultado. Não precisam virar mais campos permanentes do perfil.

A primeira versão pode sugerir programas existentes compatíveis com o tempo informado. Uma sessão de 10 ou 15 minutos, formada por vários blocos, exige composição pedagógica validada; não deve aparecer como se já existisse no catálogo atual.

**Proposta estrutural:** representar requisitos do treino em dados próprios, em vez de depender do texto de `equipment` e de procurar a palavra “cesta”. Uma recomendação deve primeiro verificar compatibilidade e depois considerar objetivo e prática recente. Mostrar “você praticou pouco este fundamento” é diferente de afirmar que ele é um ponto fraco.

### 4.3 Conteúdo: a cobertura limita a experiência mais do que a interface

Oferta real por faixa e nível:

| Faixa | Programas para iniciante | Para intermediário/avançado | Fundamentos disponíveis |
|---|---:|---:|---|
| 6–8 | 3 | 3 | Drible e preparo físico |
| 9–11 | 7 | 7 | Os cinco fundamentos |
| 12–14 | 9 | 9 | Os cinco fundamentos |
| 15–17 | 7 | 8 | Drible, arremesso, defesa e preparo físico |
| Adulto | 7 | 8 | Os mesmos de 15–17 |

**Há duas lacunas relevantes:**

1. A faixa 6–8 não tem treino de arremesso, passe ou defesa.
2. A faixa 15–17 e a faixa Adulto não têm treino de passe.

A segunda lacuna diverge da descrição “todas as categorias” em `docs/VIDEOS.md`. A tabela acima foi obtida do conteúdo que o app realmente disponibiliza.

Existem **16 programas e 69 exercícios**. Dos 69, **46 têm referência de vídeo**, mas **7 dessas referências são somente para prévia**. Portanto, 39 exercícios têm vídeo configurado para acompanhar a execução. “Duas bolas” tem cinco exercícios e nenhum vídeo.

Os programas duram aproximadamente **3 a 7 minutos**, conforme o cálculo mostrado no app. Isso abre uma questão fundamental: o que o Baseline chama de “treino” é uma sessão completa ou um bloco de prática? A resposta muda a meta semanal, a expectativa de quem usa e a interpretação da evolução.

**Recomendação:** definir claramente três unidades:

- **Exercício:** um movimento ou tarefa.
- **Bloco:** um conjunto curto de exercícios de um fundamento.
- **Sessão:** uma prática organizada, com preparação, parte principal e fechamento, quando isso for apropriado ao conteúdo validado.

Essa distinção permite orientar melhor a rotina e evita que “três treinos na semana” represente práticas muito diferentes sem explicação. A duração e a composição devem ser decididas com o profissional de educação física.

Adultos podem compartilhar exercícios com adolescentes, como já foi decidido, mas textos e protocolos precisam soar adequados ao adulto. Alguns testes atuais dizem “um adulto cronometra”, mesmo quando a pessoa usando o app já é adulta.

### 4.4 Aprender e executar: assistir não é a mesma tarefa que treinar

A jornada atual contém o detalhe do programa, depois outra tela com lista de exercícios e um segundo botão de começar. Na execução, as etapas avançam pelo tempo, sem esperar que a pessoa tenha compreendido o próximo movimento.

Isso funciona melhor para quem conhece os exercícios. Para um iniciante, assistir à demonstração, ler a dica e já executar pode competir pelo mesmo intervalo. O descanso também pode acabar antes de a pessoa estar pronta.

**Proposta:** dois comportamentos de execução, com os mesmos exercícios:

- **Aprender:** demonstração, uma instrução principal e “Estou pronto” antes de iniciar um movimento novo. A demonstração pode ser revista sem gastar o tempo de execução.
- **Treinar:** avanço automático, instruções compactas, timer e sinais sonoros, para quem já conhece a sequência.

O modo aprender pode ser oferecido no primeiro uso de um programa, com escolha explícita. Não precisa criar uma configuração permanente complexa.

Melhorias complementares:

- Reduzir a repetição entre detalhe e preparação.
- Manter pausa e encerramento facilmente acessíveis em telas compactas.
- Considerar tempo suficiente para largar o celular e pegar a bola; hoje a preparação inicial é de três segundos.
- Usar a voz também para uma dica curta, se a pessoa escolher, além de anunciar o nome do próximo exercício.
- Tratar indisponibilidade do vídeo como estado visível, mantendo uma instrução utilizável.
- Evitar recarregar desnecessariamente a mesma demonstração na passagem entre descanso e execução.

Em 360 × 640, a preparação do programa verificado exigiu rolagem para chegar a “Começar”, mesmo sem a faixa da demo. A tela ativa verificada coube nessa altura. Portanto, o problema observado é localizado; não justifica afirmar que todos os controles do treino ficam fora da tela.

As preferências gerais de som e voz continuam fazendo sentido na Conta, conforme a decisão do dono. Uma explicação contextual no primeiro treino é suficiente para a pessoa descobrir que esses recursos existem.

### 4.5 Conclusão: o valor do treino precisa aparecer antes do retorno ao catálogo

A tela final celebra, mostra exercícios e minutos, pergunta como foi e se algo doeu. Depois de salvar, retorna ao catálogo em cerca de 1,8 segundo.

Faltam conexões claras entre esse esforço e a continuidade: o que entrou no histórico, como ficou a meta e o que fazer depois. O salvamento também precisa ser mais confiável, conforme os defeitos reproduzidos na seção 5.

**Proposta:** preservar localmente o resultado ao encerrar e apresentar um fechamento curto:

> Prática registrada → exercícios realizados → progresso da semana → acesso à evolução ou próxima prática.

O resultado da execução pode virar um rascunho antes das respostas finais. O registro definitivo deve respeitar respostas explícitas: ausência de resposta sobre dor não significa “Não”.

“Como foi?” mistura dificuldade e satisfação nas âncoras atuais: “1 = foi bem difícil” e “5 = foi ótimo”. Um treino difícil pode ter sido ótimo. Recomendo escolher uma intenção para essa pergunta e usar palavras ou símbolos acompanhados de texto. A avaliação subjetiva pode continuar opcional.

A celebração também deve corresponder ao realizado. Um encerramento com nenhum exercício concluído não deveria receber o mesmo reconhecimento de uma prática completa.

### 4.6 Evolução: há informação, mas a próxima ação fica distante

O mapa de fundamentos dá personalidade ao app e faz uma distinção importante: número de treinos não é nota de habilidade. Porém, junto com meta, estatísticas, gráfico de oito semanas e histórico, o painel inicial da Evolução volta a ficar extenso.

Na primeira tela de celular, grande parte do espaço é ocupada pelo mapa. A explicação do fundamento selecionado e seu botão de treino aparecem mais abaixo. Para um perfil novo, há vários zeros e um gráfico sem registros.

Além disso, o título do mapa fala nos últimos 28 dias, enquanto o detalhe mostra contagem e minutos de todo o histórico carregado. Essa diferença precisa de rótulos claros.

**Proposta:** abrir a Evolução com uma síntese pequena e uma ação:

- **Constância:** o que a pessoa praticou nesta semana.
- **Marcas:** o que mudou em testes comparáveis.
- **Próximo passo:** repetir uma medição, iniciar uma prática ou continuar a trilha.

O mapa pode permanecer como uma forma de explorar os fundamentos, com detalhes acessíveis e uma alternativa simples em lista. A proposta é tornar a informação mais acionável, preservando a comparação somente consigo mesmo.

O estado inicial deve convidar a uma primeira prática, em vez de dar destaque a um conjunto de resultados vazios. Um fundamento sem conteúdo para a faixa deve ser identificado como indisponível antes de a pessoa esperar uma sugestão.

Há também questões de interpretação:

- “Treinos no total” usa o recorte carregado de até 300 registros da **conta inteira**, não um total exato por perfil.
- Sequências e conquistas de meta são recalculadas com a meta atual; mudar a meta reinterpreta semanas passadas.
- A conquista “60 minutos no mês” depende do mês corrente e pode deixar de aparecer como conquistada no mês seguinte.

Para uma rotina estruturada, faz sentido guardar a meta válida em cada semana e distinguir conquistas permanentes de desafios do mês.

### 4.7 Testes: medir uma habilidade ainda se parece mais com preencher um formulário

Os testes têm protocolos e resultados, mas não oferecem a condução que os treinos oferecem. A pessoa lê, organiza o ambiente, cronometra, conta e digita. Entrar pelo detalhe de um teste leva ao formulário da bateria inteira.

**Proposta:** medir um teste por vez, com preparação, demonstração quando disponível, contagem quando apropriada e confirmação do resultado. Manter uma entrada rápida para quem já sabe realizar a medição.

Um teste parcial hoje também adia a chamada da bateria inteira por 28 dias. Na reprodução, registrar apenas drible deixou os demais testes sem marca, mas mudou a próxima bateria para 27/10.

O acompanhamento deve considerar a recência **por teste**, distinguindo “primeira medição”, “medição recente” e “pode medir novamente”. Isso mantém a flexibilidade de preencher só o que foi feito e explica melhor o que falta.

A comparação exige contexto consistente de execução; números crescentes sozinhos não demonstram causalmente melhora causada pelo app. A comunicação pode celebrar uma marca melhor sem atribuir uma precisão que a medição não tem.

### 4.8 Família e Conta: o modelo de dados é bom, mas o acesso pode ser mais direto

A aba “Perfil” abre “Quem vai treinar?”, e só dali se chega à Conta. Para um adulto com um único perfil, essa etapa é pouco útil. Para uma família, a troca de perfil é importante.

**Proposta:** deixar o perfil ativo visível e trocável no cabeçalho e dar acesso direto à Conta. A Conta pode ter entradas curtas para perfis, preferências, privacidade/dados e apoio ao Instituto.

Hoje, o bloco de apoio aparece antes de som e voz. A reorganização pode colocar as configurações operacionais antes da doação e resumir o apoio em uma entrada que abre seus detalhes, sempre na área do dono da conta.

Para 6–8 anos, a experiência de execução pode usar uma instrução por vez, linguagem de brincadeira e orientação ao adulto que acompanha. Para adultos, texto direto e menor ênfase em celebrações infantis. São variações da mesma base, a validar com esses públicos.

“Perfil próprio” não é sinônimo de “adulto”: também há perfis próprios de 16–17. A orientação de dor usa hoje somente `is_self` e, nesse caso, deixa de incluir a orientação de avisar um adulto para esses adolescentes. Os textos devem considerar também a idade.

### 4.9 Vídeos e conectividade: relacionar o conteúdo à prática

A aba Vídeos mostra três destaques institucionais, iguais para todos os perfis. Ela é uma boa porta para o Arvoredo, mas sua relação com o próximo treino é pequena.

Uma evolução possível é uma área **“Aprender”**, organizada por fundamento, que ligue uma demonstração a uma prática correspondente. O vídeo continua direto, respeitando a escolha anterior do dono de não usar pôster intermediário.

Quanto à conectividade, existe fila offline para envio de registros, mas isso não equivale a abertura completa sem internet. Perfis e históricos ficam em estado React e precisam de carga do servidor ao reabrir o app; não há cache persistente desses dados no fluxo real inspecionado. No navegador, também não há service worker para garantir a abertura offline do app.

Recomendo distinguir na interface:

- Registro enviado.
- Registro guardado neste aparelho e aguardando envio.
- Registro que precisa de uma ação para ser enviado.
- Vídeo indisponível, com instrução alternativa.

O futuro cache local deve respeitar o estado de autorização dos perfis, os limites do conteúdo disponível e a invalidação de dados. No Android, o empacotamento do app resolve a disponibilidade dos arquivos da interface, mas não resolve por si só a carga dos perfis ou dos vídeos.

## 5. Problemas concretos encontrados

**P0:** perda de registro, resposta incorreta ou impedimento de concluir uma tarefa essencial. **P1:** fricção importante ou interpretação enganosa. **P2:** refinamento e evolução estrutural. São prioridades propostas, não uma classificação de incidentes em produção.

| ID | Prioridade | Evidência | Problema | Encaminhamento |
|---|---|---|---|---|
| UX-01 | P0 | Reproduzido com autenticação simulada | Após validar o código de recuperação, a sessão é aberta e o app troca para a área autenticada antes de permitir cadastrar a nova senha. | Manter a etapa de troca de senha ativa após a autenticação e verificar o percurso completo. |
| UX-02 | P0 | Reproduzido + código | Ao chegar à tela de encerramento, a retomada é apagada antes de salvar. Recarregar nessa etapa perde o resultado pendente. | Preservar um rascunho da conclusão até salvar ou descartar explicitamente. |
| UX-03 | P0 | Reproduzido + código | Salvar sem responder “Algo doeu?” grava `false`, como se a pessoa tivesse respondido “Não”. | Exigir uma escolha explícita com indicação do que falta, ou representar ausência de resposta de forma distinta. |
| UX-04 | P1 | Reproduzido + código | O detalhe do programa mostra histórico de outros perfis da mesma conta. Um treino de defesa salvo por Léo apareceu como feito por Rafa. | Filtrar simultaneamente por perfil e programa. |
| UX-05 | P1 | Reproduzido + código | Pular todos os exercícios permite salvar 0/4 e adicionar um treino à meta semanal. | Diferenciar prática parcial e nenhuma execução; definir o critério de contagem e ajustar a celebração. |
| UX-06 | P1 | Reproduzido + código | Ampliar o descanso e retomar após recarregar pode reiniciar o treino. O estado salvo ficou com 31 s; a restauração aceita só descanso original + 5 s. | Persistir/restaurar corretamente o tempo ampliado e conservar o andamento. |
| UX-07 | P1 | Reproduzido + código | Conta sem perfis mostra apenas as escolhas de criação; não oferece acesso à Conta nem saída. | Acrescentar acesso à Conta e saída na primeira escolha, inclusive após apagar o último perfil. |
| UX-08 | P1 | Reproduzido + código | Voltar do detalhe para o catálogo troca “Sem cesta” por “Tudo”. | Preservar filtro, posição da prateleira e contexto de navegação. |
| UX-09 | P1 | Reproduzido + código | Registrar um teste adia por 28 dias a chamada global, embora outros testes ainda não tenham marca. | Acompanhar recência e ausência de marca por teste. |
| UX-10 | P1 | Inspeção do código | Existe uma única chave de retomada por aparelho; iniciar prática de outro perfil sobrescreve a anterior. | Guardar andamento por conta e perfil ou tratar a substituição explicitamente. |
| UX-11 | P1 | Inspeção do código | Minutos na conclusão são calculados por diferença de relógio desde o início, sem descontar pausas na mesma execução. | Medir tempo efetivo de execução/descanso e excluir pausas, com conceito explícito. |
| UX-12 | P1 | Inspeção do código | “Treinos no total” e conquistas usam a lista limitada a 300 registros da conta. | Buscar totais corretos por perfil e paginar histórico quando necessário. |
| UX-13 | P1 | Inspeção do código | O botão físico do Android usa a navegação global; não segue as confirmações e subtelas internas de treino, conclusão, edição e teste. | Unificar o tratamento de voltar com a tela ativa; reproduzir em Android real. |
| UX-14 | P1 | Cálculo + CSS | Texto creme sobre coral do botão primário tem contraste aproximado de **3,06:1**, abaixo de 4,5:1 para o texto normal de 17 px usado nele. | Ajustar a combinação de cores do controle e conferir estados de toque, foco e desabilitado. |

Além desses defeitos, a confirmação de cadastro não oferece reenviar o link ou corrigir o e-mail na própria etapa. É uma melhoria importante de recuperação do fluxo, junto com a confirmação do funcionamento real de envio e redirecionamento.

### Referências principais no código

- Autenticação: `src/screens/AuthScreens.tsx:59–68,170–203,246–287,321–329`; `src/state/auth.tsx:58,110–118`; `src/App.tsx:109–112`.
- Conclusão e respostas: `src/screens/TrainingSession.tsx:85–106`; `src/screens/TrainingFinish.tsx:38–72,88–129`.
- Históricos por programa: `src/App.tsx:345–363`.
- Pular exercícios: `src/screens/trainingRunner.ts:79–83`; contagem da meta em `src/screens/Progress.tsx:263–267`.
- Retomada e descanso ampliado: `src/screens/trainingRunner.ts:29–47,84–88`; `src/lib/resumeSession.ts:1–4,37–45`.
- Conta vazia: `src/App.tsx:331–338`; `src/screens/ProfileChoice.tsx`.
- Filtro e catálogo: `src/screens/AthleteHome.tsx:47–51,120–159`.
- Testes parciais e prazo: `src/screens/TestSession.tsx:25–41`; `src/lib/progress.ts:70–78`.
- Limite do histórico: `src/state/sessions.ts:7–16`; `src/state/createLog.ts:41–55`.
- Voltar físico: `src/App.tsx:180–197`; `src/lib/native.ts:5–22`.
- Cores e tamanho do botão: `src/styles.css:41–46,197–203`.
- Conteúdo e requisitos: `src/content/programs.ts:61–308,314–341`; `src/lib/types.ts:40–62`.
- Mapas, metas e conquistas: `src/screens/Progress.tsx`; `src/lib/progress.ts:44–67,130–155,166–182`.
- Orientação de dor por tipo de perfil: `src/screens/TrainingFinish.tsx:115–118`.

## 6. Possibilidades de mudança fundamental

### Caminho A — Biblioteca refinada

Manter o catálogo como centro, corrigir os defeitos e melhorar filtros, navegação e feedback.

- **Ganho:** experiência mais previsível e menos frustrante.
- **Esforço relativo:** baixo a médio.
- **Limitação:** a pessoa continua responsável por organizar sua rotina e escolher o próximo treino.
- **Adequação:** quem já conhece os fundamentos e quer uma ferramenta de execução.

### Caminho B — Guia de prática contextual — recomendado

O centro passa a ser “o que consigo fazer agora?”, com escolha assistida e catálogo acessível, execução adaptada à familiaridade e fechamento que conduz à continuidade.

- **Ganho esperado:** menos indecisão e melhor encaixe do treino na vida real.
- **Esforço relativo:** médio; começa com os programas existentes e cresce com requisitos estruturados e sessões.
- **Dependência:** regras pedagógicas e conteúdo suficientes para as sugestões.
- **Adequação:** adultos começando ou retomando e responsáveis que precisam orientar uma criança.

Pode ser implementado na stack atual. Regras transparentes de seleção atendem à necessidade inicial de orientação.

### Caminho C — Trilhas de aprendizagem

Organizar objetivos em sequências curtas, por exemplo domínio da bola ou fundamentos do arremesso, com práticas, repetição e medições apropriadas. A duração de uma trilha é uma decisão pedagógica, não precisa ser sempre quatro semanas.

- **Ganho esperado:** sentido de continuidade e de aprendizagem ao longo do tempo.
- **Esforço relativo:** alto, especialmente em conteúdo e validação, mais do que em componentes visuais.
- **Dependência:** etapas de dificuldade, critérios de avanço e cobertura de conteúdo para cada público.
- **Adequação:** quem procura uma rotina, não só uma sessão avulsa.

**Recomendação de produto:** começar pelo caminho B e experimentar uma trilha do caminho C. Reorganizar todo o catálogo em trilhas antes de preencher as lacunas de conteúdo criaria uma promessa maior do que a experiência consegue entregar.

## 7. Uma arquitetura de experiência possível

Fluxo principal proposto:

```text
Conhecer o Baseline
  → Explorar uma prática
  → Criar conta e perfil com aceite para registrar
  → Escolher conforme tempo e recursos
  → Aprender o que for novo
  → Executar com pouca interação
  → Confirmar respostas e registrar
  → Entender a prática realizada
  → Continuar uma rotina ou escolher outra prática
```

Uma hipótese de navegação para prototipar:

- **Treinar:** escolha assistida e biblioteca.
- **Evolução:** síntese de prática, marcas e detalhes.
- **Aprender:** demonstrações ligadas a fundamentos e práticas, incluindo conteúdo do Arvoredo.
- **Conta:** acesso direto a perfis, configurações e dados.

O seletor do perfil ativo fica no cabeçalho, com troca rápida. Essa hipótese altera as abas atuais e deve ser comparada em uma demonstração navegável antes de virar implementação definitiva. O primeiro experimento de escolha assistida pode ocorrer dentro da estrutura atual, sem depender dessa reorganização.

### Modelo de conteúdo e registros

Para sustentar sessões e trilhas, convém evoluir o domínio além de `Program.category + equipment + drills`:

- Requisitos explícitos de equipamento, espaço e participação.
- Distinção entre exercício, bloco, sessão e trilha.
- Progressão e variações de execução aprovadas pelo profissional.
- Etapa de aprendizado separada do tempo de prática.
- Rascunho de sessão com identificação estável, estado de execução e tempo efetivo.
- Registro de conclusão/execução parcial que faça sentido para metas e histórico.
- Versão ou composição do conteúdo executado, para interpretar históricos quando um programa mudar.

Uma sessão com vários fundamentos também precisa distribuir seus registros adequadamente; atribuí-la inteira a uma única categoria distorceria o mapa.

As migrações devem preservar os registros existentes e o vínculo com o perfil. Totais, rascunhos e composição podem evoluir sem trocar a stack de React, Capacitor e Supabase.

## 8. Ordem recomendada de trabalho

Os esforços abaixo são relativos, não estimativas de prazo.

| Etapa | Entrega | Impacto esperado | Esforço | Dependência principal |
|---|---|---|---|---|
| 1 | Recuperação de senha completa, conclusão persistente e resposta explícita de dor | Alto em acesso e confiança | Baixo a médio | Verificação dos estados e do envio de e-mail |
| 1 | Histórico isolado por perfil, retomada de descanso e regras para prática sem execução | Alto em coerência | Baixo a médio | Definição da contagem de prática |
| 1 | Conta acessível sem perfis, preservação do filtro e correção de contraste | Médio/alto em usabilidade | Baixo | Ajustes de navegação e componentes |
| 2 | Protótipo de escolha assistida com programas existentes | Alto potencial em orientação | Médio | Requisitos e critérios de sugestão |
| 2 | Fluxo aprender/treinar e fechamento com próximo passo | Alto potencial na execução | Médio | Testes com iniciantes e em aparelho |
| 2 | Entrada mais clara, posição posterior e Conta mais direta | Médio em ativação e gestão | Baixo a médio | Revisão de texto e navegação |
| 2 | Testes individuais e síntese da Evolução | Médio/alto em compreensão | Médio | Protocolos e modelo de recência |
| 3 | Preencher lacunas de fundamentos e demonstrações prioritárias | Alto na entrega do produto | Variável | Produção/curadoria e validação profissional |
| 3 | Uma trilha piloto com sessões bem definidas | Alto potencial na continuidade | Alto | Conteúdo e progressão pedagógica |
| 3 | Cache persistente, totais corretos e metas históricas | Alto em confiabilidade a longo prazo | Médio a alto | Modelo de dados e sincronização |

Conteúdo deve caminhar em paralelo às melhorias de experiência. Prioridades editoriais: completar as oportunidades da faixa 6–8, oferecer passe em 15–17/Adulto e decidir quais demonstrações ausentes realmente são essenciais para aprender os movimentos.

As pendências de SMTP, configuração de redirecionamento e migração 0006, registradas em `docs/CONTINUIDADE.md`, precisam de confirmação para que a jornada de entrada funcione no ambiente real.

## 9. Como validar as mudanças

Um piloto qualitativo com aproximadamente 8–12 participantes, distribuídos entre adultos iniciantes/retornando, responsáveis com crianças de diferentes faixas e adolescentes com perfil próprio, ajudaria a comparar a experiência atual com o protótipo. Esse número é uma proposta de descoberta, não amostra para estimar percentuais da população.

Tarefas úteis:

1. Encontrar uma prática que caiba no tempo, espaço e equipamentos apresentados.
2. Entender um exercício desconhecido e começar sem ajuda do avaliador.
3. Pausar, sair e retomar; encerrar e reabrir antes de salvar.
4. Registrar e explicar o que mudou na meta e no histórico.
5. Trocar de perfil e ajustar uma preferência de treino.
6. Fazer somente um teste e identificar o que ainda falta medir.

Observar tempo até a primeira execução, pedidos de ajuda, escolhas incompatíveis, toques e rolagens evitáveis, compreensão do resultado e preservação do andamento. A conclusão da sessão precisa ser verificada também com internet instável e retorno ao app.

Os principais critérios de sucesso são: conseguir escolher uma prática compatível, compreender o próximo movimento, confiar no salvamento e saber como continuar. Uma tela mais bonita, isoladamente, não comprova esses ganhos.

As primeiras medições podem ser feitas por observação em demonstração e relato voluntário. Indicadores agregados obtidos das contas reais, com uma finalidade adicional de análise, dependem de definição dessa finalidade e atualização dos textos e aceites, conforme as regras do projeto. Não é necessário introduzir ferramenta de análise de terceiros.

## 10. Decisões que destravam a próxima etapa

1. **Público prioritário para o primeiro experimento:** adulto começando/retomando, responsável com criança ou adolescente já praticante. O app pode atender a todos, mas a primeira jornada precisa de um foco de validação.
2. **Significado de “treino”:** bloco curto ou sessão organizada. Isso deve orientar meta, histórico e recomendação.
3. **Nível de orientação:** sugestão contextual ou trilha estruturada. Recomendo começar pela sugestão e validar uma trilha depois.

**Primeira entrega recomendada:** uma rodada de confiabilidade seguida de uma demonstração navegável do caminho B, usando escolha assistida, aprendizado antes da contagem e conclusão persistente com próximo passo. É um experimento de experiência completo e suficientemente pequeno para comparar com a versão atual.
