// Interfaces for LifeSummary state
export interface Belief {
  id: string;
  text: string;
}

export interface Relation {
  id: string;
  name: string;
  howToNurture: { id: string; label: string; checked: boolean }[];
}

export interface Mentor {
  id: string;
  name: string;
  area: string;
  impact: 'Alto' | 'Médio' | 'Baixo';
}

export interface InfluencerRow {
  id: string;
  category: string;
  usernames: string;
  country?: string;
  topics?: string;
  followers?: string;
}

export interface BudgetGoal {
  id: string;
  category: string;
  amount: number;
}

export interface WishItem {
  id: string;
  description: string;
  cost: number;
  completed: boolean;
}

export interface GridReason {
  id: string;
  label: string;
  checked: boolean;
  text: string;
}

export interface StarConquest {
  id: string;
  text: string;
  checked?: boolean;
}

export interface LifeSummaryState {
  spirituality: {
    beliefs: Belief[];
    goal: string;
    habits: { id: string; label: string; checked: boolean; xpReward: number }[];
    reasonsGrid?: GridReason[];
    conquests?: StarConquest[];
    activities?: string[];
    important?: string;
    whatIWantInFuture?: string;
    whyIWant?: string;
    sonOfGodText?: string;
    objectives?: Belief[];
  };
  body: {
    ratings: {
      arms: number;
      legs: number;
      stamina: number;
      fat: number;
      strength: number;
    };
    perceptions?: {
      arms: string;
      legs: string;
      stamina: string;
      fat: string;
      strength: string;
    };
    currentFeeling: string;
    futureFeeling: string;
    desiredBodyType: string;
    milestones: { id: string; label: string; checked: boolean }[];
    reasons: {
      mind: string;
      spirit: string;
      selfLove: string;
      social: string;
    };
    important?: string;
    whatIWantInFuture?: string;
    whyIWant?: string;
    idealBodyImage?: string;
    reasonsGrid?: GridReason[];
    conquests?: StarConquest[];
    activities?: string[];
  };
  mind: {
    qualities: string;
    improvements: string;
    weaknesses: string;
    intellectualGoals: { 
      id: string; 
      label: string; 
      checked: boolean; 
      actions?: { id: string; label: string; checked: boolean }[] 
    }[];
    positiveEmotion: string;
    negativeEmotion: string;
    important?: string;
    whatIWantInFuture?: string;
    whyIWant?: string;
    meditationThoughts?: string;
    posEmotionName?: string;
    posEmotionMeaning?: string;
    posEmotionHowToCultivate?: string;
    posEmotionTriggers?: string;
    posEmotionStrategies?: string;
    negEmotionName?: string;
    negEmotionEffect?: string;
    negEmotionHowToSuppress?: string;
    negEmotionTriggers?: string;
    negEmotionStrategies?: string;
    reasonsGrid?: GridReason[];
    conquests?: StarConquest[];
    activities?: string[];
  };
  social: {
    importance: number;
    whatIWant: string;
    whyIWant: string;
    relations: Relation[];
    values: { id: string; label: string; checked: boolean }[];
    dedicateTime: string;
    motivators: string;
    mentors: Mentor[];
    reasonsGrid?: GridReason[];
    conquests?: StarConquest[];
    activities?: string[];
    important?: string;
    whatIWantInFuture?: string;
    behaviorsToAvoid?: { id: string; label: string; checked?: boolean }[];
    dedicateTimeList?: string[];
    motivatorsList?: string[];
    influencers?: InfluencerRow[];
  };
  finances: {
    importance?: number;
    whatIWant?: string;
    beliefs: string[];
    gratitude: string;
    budgetGoals: BudgetGoal[];
    careerAnswers: {
      q1: string;
      q2: string;
      q3: string;
      q4: string;
      q5: string;
      q6: string;
    };
    careerIdeal: {
      priceToPay: string;
      willingToPay: boolean;
    };
    reasonsGrid?: GridReason[];
    conquests?: StarConquest[];
    activities?: string[];
  };
  entertainment: {
    stressBusters: { id: string; label: string; checked: boolean }[];
    wishlist: WishItem[];
    balanceRating: number;
    reasonsGrid?: GridReason[];
    conquests?: StarConquest[];
    activities?: string[];
  };
  vertentes?: {
    profissional?: {
      realizacao: number;
      financeiro: number;
      social: number;
    };
    pessoal?: {
      emocional: number;
      intelectual: number;
      saude: number;
    };
    qualidadeVida?: {
      familia: number;
      amoroso: number;
      social: number;
    };
    spirituality?: {
      conexao: number;
      proposito: number;
      paz: number;
    };
    body?: {
      saude: number;
      vitalidade: number;
      estetica: number;
    };
    mind?: {
      emocional: number;
      intelectual: number;
      foco: number;
    };
    social?: {
      familia: number;
      amoroso: number;
      social: number;
    };
    finances?: {
      realizacao: number;
      financeiro: number;
      social: number;
    };
    entertainment?: {
      tempo: number;
      hobbies: number;
      desconexao: number;
    };
  };
  pontosAtencao?: {
    id: string;
    categoria: 'qualidade_vida' | 'profissional' | 'pessoal' | 'spirituality' | 'body' | 'mind' | 'social' | 'finances' | 'entertainment';
    texto: string;
    checked: boolean;
  }[];
}

export const defaultState: LifeSummaryState = {
  spirituality: {
    beliefs: [
      { id: 'sb-1', text: 'Acredito em Deus;' },
      { id: 'sb-2', text: 'Aceitei Jesus como senhor e salvador;' },
      { id: 'sb-3', text: 'Deus e o Paraíso me aguardam após a morte;' },
      { id: 'sb-4', text: 'Bondade e misericórdia me acompanharão todos os dias da minha vida;' },
      { id: 'sb-5', text: 'Nada faltando, nada quebrado, nada fora do lugar;' },
      { id: 'sb-6', text: 'Tenho Mãos abençoadas, família protegida e bênçãos multiplicadas;' },
      { id: 'sb-7', text: 'Deus me livrará do laço do passarinheiro e da peste perniciosa e sobre as suas asas eu estarei seguro;' }
    ],
    goal: 'Aprofundar minha fé e conexão com Deus diariamente.',
    habits: [
      { id: 'sh-1', label: 'Ler 5 e compreender capítulos da Bíblia;', checked: false, xpReward: 15 },
      { id: 'sh-2', label: 'Orar de manhã e à noite;', checked: false, xpReward: 15 },
      { id: 'sh-3', label: 'Praticar os ensinamentos de Cristo;', checked: false, xpReward: 15 },
      { id: 'sh-4', label: 'Ser Proativo;', checked: false, xpReward: 15 },
      { id: 'sh-5', label: 'Orar a Deus;', checked: false, xpReward: 15 }
    ],
    important: '',
    whatIWantInFuture: '',
    whyIWant: '',
    sonOfGodText: 'Sou Filho Deus, sou imagem e semelhança do Senhor;',
    objectives: [
      { id: 'so-1', text: 'Alcançar a salvação;' },
      { id: 'so-2', text: 'Converter mais 20 pessoas;' },
      { id: 'so-3', text: 'Ser um exemplo de Bom Cristão;' },
      { id: 'so-4', text: 'Ter as bênçãos de Deus;' },
      { id: 'so-5', text: 'Ajudar os não salvos;' }
    ]
  },
  body: {
    important: '',
    whatIWantInFuture: '',
    whyIWant: '',
    ratings: {
      arms: 1,
      legs: 1,
      stamina: 1,
      fat: 1,
      strength: 1
    },
    perceptions: {
      arms: 'Ruim',
      legs: 'Ruim',
      stamina: 'Ruim',
      fat: 'Ruim',
      strength: 'Ruim'
    },
    currentFeeling: 'Me sinto mal, mesmo treinando todos os dias continuo fraco, corpo igual a TV 4K fino e alta resolução isso diminui minha confiança pois não é sempre que posso contar com minha força física, tento comer uma quantidade boa mas não encontro um ponto de equilíbrio.',
    futureFeeling: 'Quero ser forte, daqueles que só de ver na rua já se fica intimidado quero ter um "shape" de respeito, algo que seja digno de mim, terei mais força e confiança, meu corpo será um templo; e ter um rosto mais atraente e livre de espinhas e outras imperfeições',
    desiredBodyType: 'Terei um corpo forte, nervos de aço, punho de ferro e montanha de músculos, estilo Fialho ou Jonhatan, pernas médias, braços fortes, peitoral forte e definido e rosto mais harmônico;',
    idealBodyImage: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=600',
    milestones: [
      { id: 'bm-1', label: 'Ganhar 5 quilos de músculos limpos', checked: false },
      { id: 'bm-2', label: 'Correr 10 km sem pausas', checked: false },
      { id: 'bm-3', label: 'Fazer 15 barras consecutivas', checked: false },
      { id: 'bm-4', label: 'Dormir 8 horas em 90% das noites do mês', checked: false }
    ],
    reasons: {
      mind: 'Mente Sã, corpo Sano;',
      spirit: 'Meu corpo é reflexo do meu espírito;',
      selfLove: 'Eu me amo;',
      social: 'Ser mais confiante e ter mais respeito; e ter muita moral;'
    },
    reasonsGrid: [
      { id: 'mente', label: 'Mente', checked: true, text: 'Mente Sã, corpo Sano;' },
      { id: 'espirito', label: 'Espírito', checked: true, text: 'Meu corpo é reflexo do meu espírito;' },
      { id: 'amor', label: 'Amor', checked: true, text: 'Eu me amo;' },
      { id: 'social', label: 'Social', checked: true, text: 'Ser mais confiante e ter mais respeito; e ter muita moral;' },
      { id: 'financeiro', label: 'Financeiro', checked: true, text: 'Ser mais atraente para negócio, passar uma boa imagem;' },
      { id: 'carreira', label: 'Carreira', checked: true, text: 'Me desenvolver nos esportes de luta e poder bater mais forte;' },
      { id: 'qualidade_vida', label: 'Qualidade de vida', checked: true, text: 'Evitar doenças e melhorar minha autoestima;' },
      { id: 'visao_vida', label: 'Visão de vida', checked: true, text: 'Me ver como alguém respeitável;' }
    ],
    conquests: [
      { id: 'bc-1', text: 'Ganhar 5 quilos de músculos;', checked: true },
      { id: 'bc-2', text: 'Levantar com facilidade 20 kg;', checked: true },
      { id: 'bc-3', text: 'Treinar 2 horas todo dia;', checked: true },
      { id: 'bc-4', text: 'Ter resistência a dor;', checked: true },
      { id: 'bc-5', text: '7,5 horas de sono;', checked: true },
      { id: 'bc-6', text: 'Melhorar o fôlego;', checked: true }
    ],
    activities: [
      'Levantamento de peso;',
      'Alongamento;',
      ';'
    ]
  },
  mind: {
    qualities: 'E sei sobre os ensinamentos de Deus; Eu sou frio e calculista; Eu sei muito sobre jogos; Eu sei muito sobre História; Eu sei muito sobre o Meio Digital;',
    improvements: 'Eu não sei me expressar sobre minhas emoções; Eu sei muito pouco sobre Marketing; Não estou lendo muito; Eu me estresso fácil; Tenho dificuldade em me concentrar; Sou quase apático;',
    weaknesses: 'Sou tímido; Não me conecto com as pessoas e tenho dificuldade em ter moral; Não cumpro minhas metas; Não me mantenho produtivo e fico procrastinando ou desviando o foco; Não sou muito confiante; Ligo para a opinião dos outros;',
    intellectualGoals: [
      {
        id: 'mg-1',
        label: 'Quero deixar de ser tímido',
        checked: false,
        actions: [
          { id: 'mga-1-1', label: 'Falar com alguém diferente todo dia;', checked: false },
          { id: 'mga-1-2', label: 'Sair da zona de conforto;', checked: false },
          { id: 'mga-1-3', label: 'Não fugir dos compromissos;', checked: false },
          { id: 'mga-1-4', label: 'Ter uma postura firme;', checked: false },
          { id: 'mga-1-5', label: 'Aprender novas habilidades sociais;', checked: false }
        ]
      },
      {
        id: 'mg-2',
        label: 'Cumprir minhas metas',
        checked: false,
        actions: [
          { id: 'mga-2-1', label: 'Criar um plano de ação;', checked: false },
          { id: 'mga-2-2', label: 'Priorizar metas;', checked: false },
          { id: 'mga-2-3', label: 'Definir prazos para cumprir as metas;', checked: false },
          { id: 'mga-2-4', label: 'Monitorar o progresso;', checked: false },
          { id: 'mga-2-5', label: 'Nunca deixar para a última hora;', checked: false }
        ]
      },
      {
        id: 'mg-3',
        label: 'Ser confiante',
        checked: false,
        actions: [
          { id: 'mga-3-1', label: 'Manter o olhar fixo;', checked: false },
          { id: 'mga-3-2', label: 'Falar de modo lento e claro e sempre menos que o necessário;', checked: false },
          { id: 'mga-3-3', label: 'Não pedir desculpa;', checked: false },
          { id: 'mga-3-4', label: 'Enfrentar os medos;', checked: false },
          { id: 'mga-3-5', label: 'Meditar e respirar todos os dias calmamente;', checked: false }
        ]
      },
      {
        id: 'mg-4',
        label: 'Me manter produtivo',
        checked: false,
        actions: [
          { id: 'mga-4-1', label: 'Não adiar as tarefas;', checked: false },
          { id: 'mga-4-2', label: 'Fazer uma coisa por vez;', checked: false },
          { id: 'mga-4-3', label: 'Priorizar o que fazer;', checked: false },
          { id: 'mga-4-4', label: 'Fazer com excelência;', checked: false },
          { id: 'mga-4-5', label: 'Eliminar distrações;', checked: false }
        ]
      },
      {
        id: 'mg-5',
        label: 'Ler mais',
        checked: false,
        actions: [
          { id: 'mga-5-1', label: 'Eliminar distrações;', checked: false },
          { id: 'mga-5-2', label: 'Não ter pensamentos paralelos;', checked: false },
          { id: 'mga-5-3', label: 'Ter leitura contínua;', checked: false },
          { id: 'mga-5-4', label: 'Mentalizar a leitura;', checked: false },
          { id: 'mga-5-5', label: 'Eliminar vícios de leitura;', checked: false }
        ]
      },
      {
        id: 'mg-6',
        label: 'Não ligar para a opinião dos outros',
        checked: false,
        actions: [
          { id: 'mga-6-1', label: 'Agir diante o medo;', checked: false },
          { id: 'mga-6-2', label: 'Colocar-me em primeiro lugar;', checked: false },
          { id: 'mga-6-3', label: 'Meditar;', checked: false },
          { id: 'mga-6-4', label: 'Estudar comportamentos sociais;', checked: false },
          { id: 'mga-6-5', label: 'Analisar as pessoas e não reagir as emoções;', checked: false }
        ]
      }
    ],
    positiveEmotion: 'Quero cultivar a serenidade mental e o foco no momento presente.',
    negativeEmotion: 'Quero eliminar a autocrítica destrutiva e a comparação com os outros.',
    important: '',
    whatIWantInFuture: '',
    whyIWant: '',
    meditationThoughts: '',
    posEmotionName: 'Gratidão',
    posEmotionMeaning: 'É um mandamento de Deus, mesmo assim raramente me sinto grato pelo que tenho pois sempre quero algo melhor, mas vou mudar isso pois me permitirá ser mais eficiente e emocionalmente controlado;',
    posEmotionHowToCultivate: 'Escrever num diário, todo dia, motivos para gratidão',
    posEmotionTriggers: 'Ver como uma situação poderia ter sido pior;\nRaros momentos de empatia;\nLista',
    posEmotionStrategies: 'Agradecer;\nMeditar;\nAnotar em um diário;',
    negEmotionName: 'Vergonha',
    negEmotionEffect: 'Sinto culpa e vergonha por coisas que faço e vejo a reprovação das pessoas pois ter moral é algo fundamental;',
    negEmotionHowToSuppress: 'Evitar situações e ações que levem a este estado e diminuir a importância dos outros na minha vida;',
    negEmotionTriggers: 'Ouvir o julgamento das outras pessoas;\nO desprezo dos outros;\nSer mal falado;',
    negEmotionStrategies: 'Ter mais moral;\nNão ser permissivo com essas situações;\nFazer mais ações positivas;'
  },
  social: {
    importance: 4,
    whatIWant: 'Cultivar relacionamentos leais, profundos e de apoio mútuo.',
    whyIWant: 'Ninguém vence sozinho. O calor humano e a partilha dão significado à jornada da vida.',
    important: '',
    whatIWantInFuture: '',
    relations: [
      { 
        id: 'sr-1', 
        name: 'Kelvyn', 
        howToNurture: [
          { id: 'srn-1-1', label: 'Conversar;', checked: false },
          { id: 'srn-1-2', label: 'Ajudar;', checked: false },
          { id: 'srn-1-3', label: 'Dar conselhos;', checked: false },
          { id: 'srn-1-4', label: 'Compreender;', checked: false }
        ] 
      },
      { 
        id: 'sr-2', 
        name: 'Davi', 
        howToNurture: [
          { id: 'srn-2-1', label: 'Mandar mensagem;', checked: true },
          { id: 'srn-2-2', label: 'Aconselhar;', checked: false },
          { id: 'srn-2-3', label: 'Ajudar;', checked: false },
          { id: 'srn-2-4', label: 'Compreender;', checked: false }
        ] 
      },
      { 
        id: 'sr-3', 
        name: 'João Vítor', 
        howToNurture: [
          { id: 'srn-3-1', label: 'Mandar mensagem;', checked: false },
          { id: 'srn-3-2', label: 'Aconselhar;', checked: false },
          { id: 'srn-3-3', label: 'Ajudar;', checked: false },
          { id: 'srn-3-4', label: 'Compreender;', checked: false }
        ] 
      }
    ],
    values: [
      { id: 'sv-1', label: 'Disciplina;', checked: true },
      { id: 'sv-2', label: 'Honestidade;', checked: true },
      { id: 'sv-3', label: 'Lealdade;', checked: true },
      { id: 'sv-4', label: 'Buscar o sucesso;', checked: true },
      { id: 'sv-5', label: 'Irmandade;', checked: true }
    ],
    behaviorsToAvoid: [
      { id: 'ba-1', label: 'Traição;', checked: true },
      { id: 'ba-2', label: 'Falsidade;', checked: true },
      { id: 'ba-3', label: 'Injustiça;', checked: true }
    ],
    dedicateTimeList: [
      '',
      'Kelvín;',
      'João Vítor;'
    ],
    motivatorsList: [
      '',
      '',
      ''
    ],
    dedicateTime: 'Minha família principal, meu círculo mais próximo de amigos e meus mentores.',
    motivators: 'Pessoas focadas em crescimento pessoal, produtores de tecnologia e empreendedores.',
    mentors: [
      { id: 'smn-1', name: 'Marcus Aurelius', area: 'Filosofia e Estoicismo', impact: 'Alto' },
      { id: 'smn-2', name: 'Naval Ravikant', area: 'Finanças e Sabedoria', impact: 'Alto' },
      { id: 'smn-3', name: 'James Clear', area: 'Hábitos e Foco', impact: 'Médio' }
    ],
    influencers: [
      { id: 'inf-1', category: 'MARKETING', usernames: 'Ana Jords||Hora de Negócios||Raim Santos||Luiz Guilherme Pro', country: 'Brasil', topics: 'Marketing', followers: '1M+' },
      { id: 'inf-2', category: 'DESENVOLVIMENTO', usernames: 'Zona de Progresso||Nathan MBC||Raim Santos||', country: 'Brasil', topics: 'Mentalidade', followers: '500k+' },
      { id: 'inf-3', category: 'RELIGIÃO', usernames: 'Bispo Bruno Leonardo||Esteja com Deus||Pastor Antônio Júnior||Pastor Claudinei Oliveira||Rafael Bitencourt||Gabriel Sales||', country: 'Brasil', topics: 'Espiritualidade', followers: '5M+' },
      { id: 'inf-4', category: 'JOGOS', usernames: 'Aliados Gamers||Prata Games||Velberan||Combo Infinito||Rodrigo Baltar||Crozão||Loufalo||', country: 'Brasil', topics: 'Games', followers: '2M+' },
      { id: 'inf-5', category: 'FILOSOFIA', usernames: 'Guilherme Freire||Thiago Olaszkewski||Danilo Lopez||', country: 'Brasil', topics: 'Estudos', followers: '300k+' },
      { id: 'inf-6', category: 'Conspiração', usernames: 'Danilo Lopez||Pastor Claudinei Oliveira||Banna Brighetti||', country: 'Brasil', topics: 'Verdades', followers: '100k+' },
      { id: 'inf-7', category: 'Finanças', usernames: 'Investidor Sardinha||Fernando Ulrich||Economista Sincero||Nanda Guardian||', country: 'Brasil', topics: 'Finanças', followers: '3M+' }
    ]
  },
  finances: {
    importance: 5,
    whatIWant: 'Focar em ativos geradores de renda e liberdade de tempo.',
    beliefs: [
      'O dinheiro é uma ferramenta neutra que potencializa quem eu já sou.',
      'Criar riqueza honesta me dá liberdade para ajudar mais pessoas.',
      'Controlar os gastos é mais importante para a liberdade do que apenas ganhar mais.'
    ],
    gratitude: 'Agradeço imensamente pelas minhas fontes atuais de renda e por poder pagar minhas contas com tranquilidade.',
    budgetGoals: [
      { id: 'fb-1', category: 'Aprender & Estudar', amount: 300 },
      { id: 'fb-2', category: 'Lazer e Diversão', amount: 200 },
      { id: 'fb-3', category: 'Alimentação de alta qualidade', amount: 500 }
    ],
    careerAnswers: {
      q1: 'Escolhi focado na minha paixão por criar sistemas funcionais e na alta demanda de mercado.',
      q2: 'Sim, mas desejo transitar de operador técnico direto para arquiteto de soluções e gestor de produtos.',
      q3: 'A liberdade de criação, solucionar problemas complexos e a independência financeira que a tecnologia proporciona.',
      q4: 'Sim, meu objetivo é alcançar cargos executivos e criar meu próprio ecossistema de software.',
      q5: 'Projetar arquiteturas de bancos de dados eficientes e criar interfaces de alta fidelidade e usabilidade.',
      q6: 'Automatizando processos lentos e criando ferramentas digitais acessíveis que economizam tempo das pessoas.'
    },
    careerIdeal: {
      priceToPay: 'Estudo incansável nos finais de semana, abdicar de lazeres superficiais na juventude e focar 100% em entrega extrema.',
      willingToPay: true
    }
  },
  entertainment: {
    stressBusters: [
      { id: 'eb-1', label: 'Jogar videogame retrô ou RPG de estratégia', checked: true },
      { id: 'eb-2', label: 'Cozinhar uma receita nova ouvindo jazz lento', checked: false },
      { id: 'eb-3', label: 'Caminhada silenciosa na natureza sem celular', checked: false },
      { id: 'eb-4', label: 'Assistir a um documentário histórico de alto nível', checked: false }
    ],
    wishlist: [
      { id: 'ew-1', description: 'Viagem de imersão de 3 dias no interior de SP', cost: 1200, completed: false },
      { id: 'ew-2', description: 'Comprar console de jogos retrô de alta performance', cost: 650, completed: true },
      { id: 'ew-3', description: 'Jantar em restaurante de culinária internacional de prestígio', cost: 350, completed: false }
    ],
    balanceRating: 4
  },
  vertentes: {
    spirituality: {
      conexao: 5,
      proposito: 5,
      paz: 5
    },
    body: {
      saude: 9,
      vitalidade: 7,
      estetica: 5
    },
    mind: {
      emocional: 7,
      intelectual: 8,
      foco: 6
    },
    social: {
      familia: 3,
      amoroso: 8,
      social: 1
    },
    finances: {
      realizacao: 5,
      financeiro: 3,
      social: 6
    },
    entertainment: {
      tempo: 6,
      hobbies: 7,
      desconexao: 5
    }
  },
  pontosAtencao: [
    { id: 'pa-1', categoria: 'social', texto: 'Ver mais minha família', checked: false },
    { id: 'pa-2', categoria: 'social', texto: 'Criar novas amizades', checked: false },
    { id: 'pa-3', categoria: 'finances', texto: 'Continuar até o fim qualquer projeto', checked: false },
    { id: 'pa-4', categoria: 'finances', texto: 'Guardar mais dinheiro', checked: false },
    { id: 'pa-5', categoria: 'finances', texto: 'Doar 5% todo mês', checked: false },
    { id: 'pa-6', categoria: 'mind', texto: 'Continuar com o hábito da meditação', checked: false },
    { id: 'pa-7', categoria: 'entertainment', texto: 'Criar novo hobbie', checked: false }
  ]
};

export const createInitialReasonsGrid = (areaKey: string) => [
  { id: 'mente', label: 'Mente', checked: false, text: '' },
  { id: 'espirito', label: 'Espírito', checked: false, text: '' },
  { id: 'amor', label: 'Amor', checked: false, text: '' },
  { id: 'social', label: 'Social', checked: false, text: '' },
  { id: 'financeiro', label: 'Financeiro', checked: false, text: '' },
  { id: 'carreira', label: 'Carreira', checked: false, text: '' },
  { id: 'qualidade_vida', label: 'Qualidade de vida', checked: false, text: '' },
  { id: 'visao_vida', label: 'Visão de vida', checked: false, text: '' }
];

export const createInitialConquests = () => [
  { id: 'c1', text: '' },
  { id: 'c2', text: '' },
  { id: 'c3', text: '' },
  { id: 'c4', text: '' },
  { id: 'c5', text: '' },
  { id: 'c6', text: '' }
];

export const createInitialActivities = () => ['', '', ''];

export const ensureAreaFields = (areaData: any, areaKey: string) => {
  const defaultGrid = createInitialReasonsGrid(areaKey);

  if (areaKey === 'body') {
    const defaultPerceptions = {
      arms: 'Ruim',
      legs: 'Ruim',
      stamina: 'Ruim',
      fat: 'Ruim',
      strength: 'Ruim'
    };
    
    const defaultGridForBody = [
      { id: 'mente', label: 'Mente', checked: true, text: 'Mente Sã, corpo Sano;' },
      { id: 'espirito', label: 'Espírito', checked: true, text: 'Meu corpo é reflexo do meu espírito;' },
      { id: 'amor', label: 'Amor', checked: true, text: 'Eu me amo;' },
      { id: 'social', label: 'Social', checked: true, text: 'Ser mais confiante e ter mais respeito; e ter muita moral;' },
      { id: 'financeiro', label: 'Financeiro', checked: true, text: 'Ser mais atraente para negócio, passar uma boa imagem;' },
      { id: 'carreira', label: 'Carreira', checked: true, text: 'Me desenvolver nos esportes de luta e poder bater mais forte;' },
      { id: 'qualidade_vida', label: 'Qualidade de vida', checked: true, text: 'Evitar doenças e melhorar minha autoestima;' },
      { id: 'visao_vida', label: 'Visão de vida', checked: true, text: 'Me ver como alguém respeitável;' }
    ];

    const defaultConquestsForBody = [
      { id: 'bc-1', text: 'Ganhar 5 quilos de músculos;', checked: true },
      { id: 'bc-2', text: 'Levantar com facilidade 20 kg;', checked: true },
      { id: 'bc-3', text: 'Treinar 2 horas todo dia;', checked: true },
      { id: 'bc-4', text: 'Ter resistência a dor;', checked: true },
      { id: 'bc-5', text: '7,5 horas de sono;', checked: true },
      { id: 'bc-6', text: 'Melhorar o fôlego;', checked: true }
    ];

    const defaultActivitiesForBody = [
      'Levantamento de peso;',
      'Alongamento;',
      ';'
    ];

    return {
      ...areaData,
      important: areaData?.important ?? '',
      whatIWantInFuture: areaData?.whatIWantInFuture ?? '',
      whyIWant: areaData?.whyIWant ?? '',
      idealBodyImage: areaData?.idealBodyImage ?? 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=600',
      ratings: areaData?.ratings || { arms: 1, legs: 1, stamina: 1, fat: 1, strength: 1 },
      perceptions: areaData?.perceptions || defaultPerceptions,
      reasonsGrid: areaData?.reasonsGrid && areaData.reasonsGrid.length > 0 ? areaData.reasonsGrid : defaultGridForBody,
      conquests: areaData?.conquests && areaData.conquests.length > 0 ? areaData.conquests : defaultConquestsForBody,
      activities: areaData?.activities && areaData.activities.length > 0 ? areaData.activities : defaultActivitiesForBody
    };
  }

  if (areaKey === 'spirituality') {
    const defaultBeliefs = [
      { id: 'sb-1', text: 'Acredito em Deus;' },
      { id: 'sb-2', text: 'Aceitei Jesus como senhor e salvador;' },
      { id: 'sb-3', text: 'Deus e o Paraíso me aguardam após a morte;' },
      { id: 'sb-4', text: 'Bondade e misericórdia me acompanharão todos os dias da minha vida;' },
      { id: 'sb-5', text: 'Nada faltando, nada quebrado, nada fora do lugar;' },
      { id: 'sb-6', text: 'Tenho Mãos abençoadas, família protegida e bênçãos multiplicadas;' },
      { id: 'sb-7', text: 'Deus me livrará do laço do passarinheiro e da peste perniciosa e sobre as suas asas eu estarei seguro;' }
    ];

    const defaultObjectives = [
      { id: 'so-1', text: 'Alcançar a salvação;' },
      { id: 'so-2', text: 'Converter mais 20 pessoas;' },
      { id: 'so-3', text: 'Ser um exemplo de Bom Cristão;' },
      { id: 'so-4', text: 'Ter as bênçãos de Deus;' },
      { id: 'so-5', text: 'Ajudar os não salvos;' }
    ];

    const defaultHabits = [
      { id: 'sh-1', label: 'Ler 5 e compreender capítulos da Bíblia;', checked: false, xpReward: 15 },
      { id: 'sh-2', label: 'Orar de manhã e à noite;', checked: false, xpReward: 15 },
      { id: 'sh-3', label: 'Praticar os ensinamentos de Cristo;', checked: false, xpReward: 15 },
      { id: 'sh-4', label: 'Ser Proativo;', checked: false, xpReward: 15 },
      { id: 'sh-5', label: 'Orar a Deus;', checked: false, xpReward: 15 }
    ];

    return {
      ...areaData,
      important: areaData?.important ?? '',
      whatIWantInFuture: areaData?.whatIWantInFuture ?? '',
      whyIWant: areaData?.whyIWant ?? '',
      sonOfGodText: areaData?.sonOfGodText ?? 'Sou Filho Deus, sou imagem e semelhança do Senhor;',
      beliefs: areaData?.beliefs && areaData.beliefs.length > 3 ? areaData.beliefs : defaultBeliefs,
      objectives: areaData?.objectives && areaData.objectives.length > 0 ? areaData.objectives : defaultObjectives,
      habits: areaData?.habits && areaData.habits.length > 3 ? areaData.habits : defaultHabits,
      reasonsGrid: areaData?.reasonsGrid || defaultGrid,
      conquests: areaData?.conquests || createInitialConquests(),
      activities: areaData?.activities || createInitialActivities()
    };
  }

  if (areaKey === 'social') {
    return {
      ...areaData,
      important: areaData?.important ?? '',
      whatIWantInFuture: areaData?.whatIWantInFuture ?? '',
      whyIWant: areaData?.whyIWant ?? 'Ninguém vence sozinho. O calor humano e a partilha dão significado à jornada da vida.',
      relations: areaData?.relations && areaData.relations.length > 0 ? areaData.relations : defaultState.social.relations,
      values: areaData?.values && areaData.values.length > 0 ? areaData.values : defaultState.social.values,
      behaviorsToAvoid: areaData?.behaviorsToAvoid && areaData.behaviorsToAvoid.length > 0 ? areaData.behaviorsToAvoid : defaultState.social.behaviorsToAvoid,
      dedicateTimeList: areaData?.dedicateTimeList && areaData.dedicateTimeList.length > 0 ? areaData.dedicateTimeList : defaultState.social.dedicateTimeList,
      motivatorsList: areaData?.motivatorsList && areaData.motivatorsList.length > 0 ? areaData.motivatorsList : defaultState.social.motivatorsList,
      mentors: areaData?.mentors && areaData.mentors.length > 0 ? areaData.mentors : defaultState.social.mentors,
      influencers: areaData?.influencers && areaData.influencers.length > 0 ? areaData.influencers : defaultState.social.influencers,
      reasonsGrid: areaData?.reasonsGrid || defaultGrid,
      conquests: areaData?.conquests || createInitialConquests(),
      activities: areaData?.activities || createInitialActivities()
    };
  }

  if (areaKey === 'body' && areaData?.reasons && !areaData?.reasonsGrid) {
    defaultGrid[0].text = areaData.reasons.mind || '';
    defaultGrid[0].checked = !!areaData.reasons.mind;
    
    defaultGrid[1].text = areaData.reasons.spirit || '';
    defaultGrid[1].checked = !!areaData.reasons.spirit;
    
    defaultGrid[2].text = areaData.reasons.selfLove || '';
    defaultGrid[2].checked = !!areaData.reasons.selfLove;
    
    defaultGrid[3].text = areaData.reasons.social || '';
    defaultGrid[3].checked = !!areaData.reasons.social;
  }

  if (areaKey === 'mind') {
    return {
      ...areaData,
      important: areaData?.important ?? '',
      whatIWantInFuture: areaData?.whatIWantInFuture ?? '',
      whyIWant: areaData?.whyIWant ?? '',
      qualities: areaData?.qualities ?? defaultState.mind.qualities,
      improvements: areaData?.improvements ?? defaultState.mind.improvements,
      weaknesses: areaData?.weaknesses ?? defaultState.mind.weaknesses,
      intellectualGoals: areaData?.intellectualGoals ?? defaultState.mind.intellectualGoals,
      positiveEmotion: areaData?.positiveEmotion ?? defaultState.mind.positiveEmotion,
      negativeEmotion: areaData?.negativeEmotion ?? defaultState.mind.negativeEmotion,
      meditationThoughts: areaData?.meditationThoughts ?? '',
      posEmotionName: areaData?.posEmotionName ?? 'Gratidão',
      posEmotionMeaning: areaData?.posEmotionMeaning ?? 'É um mandamento de Deus, mesmo assim raramente me sinto grato pelo que tenho pois sempre quero algo melhor, mas vou mudar isso pois me permitirá ser mais eficiente e emocionalmente controlado;',
      posEmotionHowToCultivate: areaData?.posEmotionHowToCultivate ?? 'Escrever num diário, todo dia, motivos para gratidão',
      posEmotionTriggers: areaData?.posEmotionTriggers ?? 'Ver como uma situação poderia ter sido pior;\nRaros momentos de empatia;\nLista',
      posEmotionStrategies: areaData?.posEmotionStrategies ?? 'Agradecer;\nMeditar;\nAnotar em um diário;',
      negEmotionName: areaData?.negEmotionName ?? 'Vergonha',
      negEmotionEffect: areaData?.negEmotionEffect ?? 'Sinto culpa e vergonha por coisas que faço e vejo a reprovação das pessoas pois ter moral é algo fundamental;',
      negEmotionHowToSuppress: areaData?.negEmotionHowToSuppress ?? 'Evitar situações e ações que levem a este estado e diminuir a importância dos outros na minha vida;',
      negEmotionTriggers: areaData?.negEmotionTriggers ?? 'Ouvir o julgamento das outras pessoas;\nO desprezo dos outros;\nSer mal falado;',
      negEmotionStrategies: areaData?.negEmotionStrategies ?? 'Ter mais moral;\nNão ser permissivo com essas situações;\nFazer mais ações positivas;',
      reasonsGrid: areaData?.reasonsGrid || defaultGrid,
      conquests: areaData?.conquests || createInitialConquests(),
      activities: areaData?.activities || createInitialActivities()
    };
  }

  const defaultConquests = createInitialConquests();
  const defaultActivities = createInitialActivities();

  return {
    ...areaData,
    reasonsGrid: areaData?.reasonsGrid || defaultGrid,
    conquests: areaData?.conquests || defaultConquests,
    activities: areaData?.activities || defaultActivities
  };
};

export const ensureVertentesAndPontos = (savedState: any) => {
  const defaultVertentes = {
    spirituality: { conexao: 5, proposito: 5, paz: 5 },
    body: { saude: 5, vitalidade: 5, estetica: 5 },
    mind: { emocional: 5, intelectual: 5, foco: 5 },
    social: { familia: 5, amoroso: 5, social: 5 },
    finances: { realizacao: 5, financeiro: 5, social: 5 },
    entertainment: { tempo: 5, hobbies: 5, desconexao: 5 }
  };

  const v = { ...defaultVertentes };

  if (savedState?.vertentes) {
    const sv = savedState.vertentes;

    if (sv.profissional) {
      if (sv.profissional.realizacao !== undefined) v.finances.realizacao = sv.profissional.realizacao;
      if (sv.profissional.financeiro !== undefined) v.finances.financeiro = sv.profissional.financeiro;
      if (sv.profissional.social !== undefined) v.finances.social = sv.profissional.social;
    }

    if (sv.pessoal) {
      if (sv.pessoal.emocional !== undefined) v.mind.emocional = sv.pessoal.emocional;
      if (sv.pessoal.intelectual !== undefined) v.mind.intelectual = sv.pessoal.intelectual;
      if (sv.pessoal.saude !== undefined) v.body.saude = sv.pessoal.saude;
    }

    if (sv.qualidadeVida) {
      if (sv.qualidadeVida.familia !== undefined) v.social.familia = sv.qualidadeVida.familia;
      if (sv.qualidadeVida.amoroso !== undefined) v.social.amoroso = sv.qualidadeVida.amoroso;
      if (sv.qualidadeVida.social !== undefined) v.social.social = sv.qualidadeVida.social;
    }

    const keys: ('spirituality' | 'body' | 'mind' | 'social' | 'finances' | 'entertainment')[] = [
      'spirituality', 'body', 'mind', 'social', 'finances', 'entertainment'
    ];
    keys.forEach(k => {
      if (sv[k]) {
        v[k] = { ...v[k], ...sv[k] };
      }
    });
  }

  let pontos = savedState?.pontosAtencao || [];
  pontos = pontos.map((p: any) => {
    let cat = p.categoria;
    if (cat === 'qualidade_vida') {
      cat = 'social';
    } else if (cat === 'profissional') {
      cat = 'finances';
    } else if (cat === 'pessoal') {
      if (p.texto && p.texto.toLowerCase().includes('hobbie')) {
        cat = 'entertainment';
      } else {
        cat = 'mind';
      }
    }
    return { ...p, categoria: cat };
  });

  if (pontos.length === 0) {
    pontos = [
      { id: 'pa-1', categoria: 'social', texto: 'Ver mais minha família', checked: false },
      { id: 'pa-2', categoria: 'social', texto: 'Criar novas amizades', checked: false },
      { id: 'pa-3', categoria: 'finances', texto: 'Continuar até o fim qualquer projeto', checked: false },
      { id: 'pa-4', categoria: 'finances', texto: 'Guardar mais dinheiro', checked: false },
      { id: 'pa-5', categoria: 'finances', texto: 'Doar 5% todo mês', checked: false },
      { id: 'pa-6', categoria: 'mind', texto: 'Continuar com o hábito da meditação', checked: false },
      { id: 'pa-7', categoria: 'entertainment', texto: 'Criar novo hobbie', checked: false }
    ];
  }

  return { vertentes: v, pontosAtencao: pontos };
};

export const mergeWithDefaults = (savedState: any): LifeSummaryState => {
  const { vertentes, pontosAtencao } = ensureVertentesAndPontos(savedState);
  return {
    spirituality: ensureAreaFields(savedState?.spirituality || defaultState.spirituality, 'spirituality'),
    body: ensureAreaFields(savedState?.body || defaultState.body, 'body'),
    mind: ensureAreaFields(savedState?.mind || defaultState.mind, 'mind'),
    social: ensureAreaFields(savedState?.social || defaultState.social, 'social'),
    finances: ensureAreaFields(savedState?.finances || defaultState.finances, 'finances'),
    entertainment: ensureAreaFields(savedState?.entertainment || defaultState.entertainment, 'entertainment'),
    vertentes,
    pontosAtencao,
  };
};
