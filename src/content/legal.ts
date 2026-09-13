import { INSTITUTE_CNPJ, INSTITUTE_NAME } from "./support";

// RASCUNHO — pendente de revisão jurídica. Trechos entre colchetes precisam ser preenchidos antes de publicar.
// Mudou o texto de forma relevante? Troque LEGAL_VERSION.
export const LEGAL_VERSION = "2026-09-rascunho-5";

const ORG = INSTITUTE_NAME;
const CNPJ = INSTITUTE_CNPJ;
const CONTACT = "[e-mail de privacidade a preencher]";
const BACKUP_WINDOW = "[prazo a confirmar com o provedor]";

export type LegalId = "privacidade" | "termos" | "excluir-conta";

/** Texto vira parágrafo; `list` vira lista (numerada quando a ordem importa). */
export type LegalBlock = string | { list: string[]; ordered?: boolean };

export interface LegalDoc {
  id: LegalId;
  title: string;
  intro: string;
  sections: { title: string; blocks: LegalBlock[] }[];
}

export const LEGAL_DOCS: Record<LegalId, LegalDoc> = {
  privacidade: {
    id: "privacidade",
    title: "Política de privacidade",
    intro:
      "Esta política explica, em linguagem simples, quais dados o Baseline guarda, por que guarda e como você controla tudo. O app é usado por adultos, por adolescentes a partir de 16 anos com conta própria e por crianças e adolescentes acompanhados por um responsável: coletamos o mínimo e nunca usamos dados para publicidade.",
    sections: [
      {
        title: "Quem cuida dos dados",
        blocks: [
          `O Baseline é mantido pelo ${ORG} (CNPJ ${CNPJ}), controlador dos dados nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).`,
          `Encarregado pelo tratamento de dados: [nome a preencher], pelo e-mail ${CONTACT}.`,
        ],
      },
      {
        title: "Quem usa o app",
        blocks: [
          "A conta é a partir de 16 anos. De 16 a 17 anos, o adolescente cria o próprio login e um responsável legal confirma pelo e-mail. A partir de 18 anos, a conta é de um adulto, que também pode criar perfis para crianças e adolescentes de 6 a 17 anos pelos quais é responsável legal.",
          "Quem tem menos de 16 anos não cria login: treina só pelo perfil criado pelo responsável. Crianças e adolescentes nesse caso não têm e-mail, perfil público nem conversa com outras pessoas.",
        ],
      },
      {
        title: "Dados que guardamos",
        blocks: [
          {
            list: [
              "Da conta: e-mail e senha. A senha fica protegida pelo serviço de login e ninguém da equipe consegue lê-la.",
              "De cada perfil de treino: apelido, ano de nascimento, nível, posição (opcional), meta de treinos por semana e se é o perfil do próprio dono da conta.",
              "Da conta de adolescente (16–17): e-mail do responsável e a confirmação dele.",
              "Treinos: data, duração, quantos exercícios foram feitos, como foi (de 1 a 5) e se algo doeu, só como sim ou não, sem detalhes de saúde.",
              "Testes de habilidade: data e resultados.",
              "Consentimentos e autorizações: versão do termo aceito e datas de aceite e de revogação.",
            ],
          },
        ],
      },
      {
        title: "O que não coletamos",
        blocks: [
          "Nome completo, data de nascimento completa, foto, voz, escola, endereço, localização, contatos e identificador de publicidade.",
          "No aparelho fica só a indicação de qual foi o último perfil aberto.",
        ],
      },
      {
        title: "Para que usamos",
        blocks: [
          {
            list: [
              "Mostrar treinos e testes adequados à idade e ao nível de cada perfil.",
              "Registrar a evolução, para quem treina e para o adulto responsável acompanharem.",
              "Manter a conta funcionando e segura.",
              "Cumprir obrigações legais.",
            ],
          },
          "Não usamos os dados para publicidade, não traçamos perfil de consumo, não vendemos dados e não usamos ferramentas de análise de terceiros.",
        ],
      },
      {
        title: "Base legal",
        blocks: [
          {
            list: [
              "Perfis de crianças e adolescentes: consentimento específico e em destaque de um dos pais ou do responsável legal, dado para cada perfil (art. 14, § 1º, da LGPD), sempre no melhor interesse da criança e do adolescente.",
              "Perfil próprio de adulto: consentimento do titular, inclusive para a resposta sobre dor, que é dado de saúde (art. 7º, I, e art. 11, I, da LGPD).",
              "Conta de adolescente 16–17: consentimento do titular e confirmação do responsável legal pelo e-mail, também para a resposta sobre dor.",
              "Dados da conta: cumprimento dos termos de uso e de obrigações legais (art. 7º, incisos II e V, da LGPD).",
            ],
          },
        ],
      },
      {
        title: "Com quem os dados são compartilhados",
        blocks: [
          "Não vendemos nem cedemos dados. Alguns serviços são necessários para o app funcionar:",
          {
            list: [
              "Supabase: guarda o banco de dados e faz o login, seguindo nossas instruções. [Confirmar a região dos servidores do projeto.]",
              "YouTube (Google): os vídeos dos exercícios abrem no modo sem cookies. Ao tocar um vídeo, o YouTube recebe dados técnicos da conexão, como o endereço IP, conforme a política de privacidade do Google.",
              "Vercel: hospeda a versão web do app.",
              "Google Play: distribui o app no Android.",
            ],
          },
          "Também podemos entregar dados a autoridades quando a lei ou uma ordem judicial exigir.",
        ],
      },
      {
        title: "Transferência para outros países",
        blocks: ["Alguns desses serviços podem tratar dados fora do Brasil. Nesses casos, seguimos as regras de transferência internacional da LGPD (art. 33)."],
      },
      {
        title: "Por quanto tempo guardamos",
        blocks: [
          "Guardamos os dados enquanto a conta existir.",
          {
            list: [
              "Revogar o consentimento ou a autorização de um perfil bloqueia esse perfil: ele não treina nem registra nada até um novo aceite. Os registros anteriores ficam guardados, sem uso, até um novo aceite ou a exclusão do perfil.",
              "Excluir um perfil apaga na hora o perfil, os aceites, os treinos e os testes dele.",
              "Excluir a conta apaga na hora todos os dados da conta.",
            ],
          },
          `Cópias de segurança do provedor são substituídas automaticamente em até ${BACKUP_WINDOW}. Depois da exclusão, só mantemos algum dado se uma lei exigir, e apenas pelo prazo exigido.`,
        ],
      },
      {
        title: "Seus direitos",
        blocks: [
          "Pela LGPD (art. 18), você pode confirmar se tratamos dados, acessar, corrigir, pedir anonimização, bloqueio ou eliminação, levar os dados para outro serviço, saber com quem compartilhamos e revogar o consentimento.",
          `Na tela Conta você faz quase tudo sozinho: corrigir perfis, baixar uma cópia dos dados, revogar consentimentos e autorizações, excluir perfis e excluir a conta. Para outros pedidos, escreva para ${CONTACT}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
        ],
      },
      {
        title: "Segurança",
        blocks: [
          "As conexões são cifradas, e regras no banco de dados garantem que cada conta acesse só os próprios dados. Guarde bem a senha e, se crianças usam o seu aparelho, acompanhe o uso da tela Conta, onde ficam autorizações e exclusões.",
        ],
      },
      {
        title: "Mudanças nesta política",
        blocks: ["Quando esta política mudar, a versão será atualizada. Se a mudança afetar os dados dos perfis, pediremos um novo aceite antes de continuar."],
      },
    ],
  },

  termos: {
    id: "termos",
    title: "Termos de uso",
    intro:
      "Estes termos explicam as regras de uso do Baseline. Ao criar a conta, você declara ter 16 anos ou mais. De 16 a 17 anos, um responsável legal confirma a conta. Ao cadastrar uma criança ou adolescente, o titular da conta declara ser mãe, pai ou responsável legal por ele.",
    sections: [
      {
        title: "O que é o Baseline",
        blocks: [
          `O Baseline é um app de treinos de basquete para adultos, para adolescentes a partir de 16 anos com conta própria e para crianças e adolescentes de 6 a 17 anos acompanhados por um responsável, mantido pelo ${ORG} (CNPJ ${CNPJ}). O uso do app é gratuito.`,
          "Quem quiser pode fazer uma doação opcional ao Instituto pela tela Conta (Pix) ou pelo site do Arvoredo. A doação não é cobrança pelo app, não desbloqueia treino e nunca aparece na tela em que a criança treina. Empresas que quiserem patrocinar falam com a coordenação pelo site.",
        ],
      },
      {
        title: "Sua conta",
        blocks: [
          {
            list: [
              "Use um e-mail que só você acessa e guarde bem a senha.",
              "Cadastre perfis de crianças e adolescentes apenas se você for responsável legal por eles, com dados corretos.",
              "Você responde pelo uso da conta e dos perfis que criar.",
            ],
          },
        ],
      },
      {
        title: "Segurança nos treinos",
        blocks: [
          {
            list: [
              "Crianças e adolescentes devem treinar com um adulto por perto, em local seguro, com piso firme e espaço livre.",
              "Adultos devem treinar dentro dos próprios limites, com aquecimento e em local seguro.",
              "Os treinos não substituem avaliação médica nem acompanhamento de profissional de educação física. Em caso de doença, lesão ou dúvida, procure orientação antes de começar.",
              "Se algo doer, pare na hora. Crianças e adolescentes devem avisar um adulto.",
            ],
          },
          "Os treinos e testes são elaborados e validados por profissional de educação física [nome e registro no CREF a preencher].",
        ],
      },
      {
        title: "Vídeos de terceiros",
        blocks: ["Alguns exercícios mostram vídeos públicos do YouTube. Eles pertencem aos seus autores, seguem as regras do YouTube e podem sair do ar sem aviso."],
      },
      {
        title: "Uso permitido",
        blocks: ["O app é para uso pessoal e familiar. Não é permitido copiar, vender ou redistribuir os treinos e o conteúdo do Baseline, nem tentar acessar dados de outras contas."],
      },
      {
        title: "Responsabilidades",
        blocks: ["Trabalhamos para manter o app disponível e correto, mas ele pode ter falhas ou ficar fora do ar. Nada nestes termos limita os direitos garantidos pelo Código de Defesa do Consumidor."],
      },
      {
        title: "Encerramento",
        blocks: ["Você pode excluir a conta a qualquer momento na tela Conta. Podemos suspender contas usadas contra estes termos ou contra a lei, com aviso sempre que possível."],
      },
      {
        title: "Mudanças e contato",
        blocks: [`Se estes termos mudarem, avisaremos no app. Dúvidas: ${CONTACT}.`, "Vale a lei brasileira. Questões podem ser levadas ao foro do domicílio do usuário."],
      },
    ],
  },

  "excluir-conta": {
    id: "excluir-conta",
    title: "Excluir conta e dados",
    intro: "Você pode excluir a conta do Baseline e todos os dados dela quando quiser. A exclusão é imediata e não dá para desfazer.",
    sections: [
      {
        title: "Pelo app",
        blocks: [
          {
            ordered: true,
            list: ["Abra o Baseline e toque em Conta.", "Toque em Excluir conta e dados e confirme."],
          },
        ],
      },
      {
        title: "Sem o app instalado",
        blocks: ["Entre com seu e-mail e senha na versão web do Baseline, pelo botão no fim desta página, e siga os mesmos passos."],
      },
      {
        title: "Sem acesso à conta",
        blocks: [`Escreva para ${CONTACT} a partir do e-mail cadastrado pedindo a exclusão. Confirmamos o pedido e excluímos em até [prazo a definir] dias.`],
      },
      {
        title: "O que é apagado",
        blocks: [
          { list: ["A conta (e-mail e senha).", "Todos os perfis de treino, os consentimentos e as autorizações.", "Todos os treinos e testes registrados."] },
          `A indicação do último perfil aberto fica só no aparelho e some ao desinstalar o app ou limpar os dados do navegador. Cópias de segurança do provedor são substituídas em até ${BACKUP_WINDOW}.`,
        ],
      },
      {
        title: "Excluir só um perfil",
        blocks: ["Na tela Conta, toque no perfil e depois em Excluir perfil. A conta e os outros perfis continuam."],
      },
    ],
  },
};

const LEGAL_IDS: readonly LegalId[] = ["privacidade", "termos", "excluir-conta"];

/** "#/privacidade" → "privacidade". Endereços públicos exigidos pelo Google Play. */
export function legalIdFromHash(hash: string): LegalId | null {
  const id = hash.replace(/^#\/?/, "");
  return LEGAL_IDS.find((legalId) => legalId === id) ?? null;
}
