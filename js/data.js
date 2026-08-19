/**
 * Dados Iniciais e Definições do Sistema
 * Extraídos com fidelidade de PLANILHA DE HORAS.ods
 */

const INITIAL_COMPANY_DATA = {
  empresa: 'VIA TAQUALITO COMÉRCIO DE ALIMENTOS LTDA',
  cnpj: '64.864.904/0001-48',
  endereco: 'Estrada Rodrigues Caldas nº 127 suc 305A',
  inicioCiclo: '2026-06-21'
};

const FUNCOES_DISPONIVEIS = [
  'Atendente de lanchonete',
  'Forneiro',
  'Gerente',
  'Sub gerente',
  'Caixa',
  'Auxiliar de gerente',
  'Caixa responsável',
  'Atendente responsável',
  'Confeiteiro',
  'Auxiliar de Confeiteiro',
  'Auxiliar de Cozinha',
  'Aux. de Serviços Gerais',
  'Chapeiro'
];

const ESCALAS_DISPONIVEIS = [
  { id: '6x1', label: '6x1 (07:20 diárias)', carga: '07:20', minutes: 440 },
  { id: '12x36', label: '12x36 (12:00 diárias)', carga: '12:00', minutes: 720 }
];

const EVENTOS_DISPONIVEIS = [
  { id: 'normal', label: 'Normal' },
  { id: 'at. med', label: 'Atestado Médico (at. med)' },
  { id: 'folga', label: 'Folga' },
  { id: 'falta', label: 'Falta' },
  { id: 'feriado', label: 'Feriado' },
  { id: 'dom', label: 'Domingo Trabalhado (dom)' },
  { id: 'dobra', label: 'Dobra (100%)' }
];

const GRAUS_INSTRUCAO = [
  'Ensino fundamental incompleto',
  'Ensino fundamental completo',
  'Ensino médio incompleto',
  'Ensino médio completo',
  'Ensino superior incompleto',
  'Ensino superior completo'
];

const INITIAL_EMPLOYEES = [
  {
    id: 1,
    nome: 'Josemildo Dantas da Costa',
    funcao: 'Gerente',
    matricula: '',
    ctps: '',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 2,
    nome: 'Anne Caroline Sanabio dos Santos',
    funcao: 'Auxiliar de gerente',
    matricula: '',
    ctps: '00196064/36730',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 3,
    nome: 'Juan Luiz Sanabio dos Santos',
    funcao: 'Auxiliar de gerente',
    matricula: '',
    ctps: '00196064/24723',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 4,
    nome: 'Juliane Jacob da Silva',
    funcao: 'Caixa',
    matricula: '',
    ctps: '17934003/00773',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 5,
    nome: 'Anna Gabrielly Ferreira Siqueira',
    funcao: 'Caixa',
    matricula: '',
    ctps: '15156646/00786',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 6,
    nome: 'Ana Carla de Souza Ferreira',
    funcao: 'Chefe de cozinha',
    matricula: '',
    ctps: '06405381/00050',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 7,
    nome: 'Adrielly Cristiny Sant’ana da Silva',
    funcao: 'Auxiliar de Cozinha',
    matricula: '',
    ctps: '21648579/00760',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 8,
    nome: 'Beatriz Cristina Cruver de Oliveira',
    funcao: 'Auxiliar de Cozinha',
    matricula: '',
    ctps: '1830650/00774',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 9,
    nome: 'Samara do Conceição do Nascimento',
    funcao: 'Auxiliar de Cozinha',
    matricula: '',
    ctps: '20202646/00769',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 10,
    nome: 'Aline Lima de Oliveira',
    funcao: 'Aux. de Serviços Gerais',
    matricula: '',
    ctps: '16180605/00700',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 11,
    nome: 'Wesley Alves',
    funcao: 'Auxiliar de Cozinha',
    matricula: '',
    ctps: '18363645/00710',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 12,
    nome: 'Vitor Nascimento Fontoura Gomes',
    funcao: 'Chapeiro',
    matricula: '',
    ctps: '15338939/00770',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 13,
    nome: 'Kethelyn Cristine Alves Maria de Jesus',
    funcao: 'Chapeiro',
    matricula: '',
    ctps: '0610916/0060',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 14,
    nome: 'Andreya Thauani Silva de Souza',
    funcao: 'Atendente de lanchonete',
    matricula: '',
    ctps: '19311359/00750',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 15,
    nome: 'Kaylane Regina Madeira dos Santos',
    funcao: 'Atendente de lanchonete',
    matricula: '',
    ctps: '20514491/00710',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 16,
    nome: 'Kauã Lisboa Bezerra',
    funcao: 'Atendente de lanchonete',
    matricula: '',
    ctps: '18133307/00783',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 17,
    nome: 'Juliana Ramos Pereira Araújo',
    funcao: 'Atendente de lanchonete',
    matricula: '',
    ctps: '21405742/00739',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 18,
    nome: 'Tatiane Soares do Nascimento',
    funcao: 'Atendente de lanchonete',
    matricula: '',
    ctps: '16296195/00745',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 19,
    nome: 'Isabele Fernanda Machado Moreira do Poço',
    funcao: 'Atendente de lanchonete',
    matricula: '',
    ctps: '22730588/00701',
    escala: '6x1',
    ativo: true,
    cadastral: {}
  },
  {
    id: 20,
    nome: '',
    funcao: '',
    matricula: '',
    ctps: '',
    escala: '6x1',
    ativo: false,
    cadastral: {}
  },
  {
    id: 21,
    nome: '',
    funcao: '',
    matricula: '',
    ctps: '',
    escala: '6x1',
    ativo: false,
    cadastral: {}
  },
  {
    id: 22,
    nome: '',
    funcao: '',
    matricula: '',
    ctps: '',
    escala: '6x1',
    ativo: false,
    cadastral: {}
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    INITIAL_COMPANY_DATA,
    FUNCOES_DISPONIVEIS,
    ESCALAS_DISPONIVEIS,
    EVENTOS_DISPONIVEIS,
    GRAUS_INSTRUCAO,
    INITIAL_EMPLOYEES
  };
}
