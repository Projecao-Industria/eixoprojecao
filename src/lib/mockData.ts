export type Categoria = 
  | "Máquinas"
  | "Ferramentas"
  | "Informática"
  | "Móveis e Utensílios"
  | "Infraestrutura – Instalações"
  | "Veículos";

export type Setor =
  | "Corte Marcenaria"
  | "Montagem Marcenaria"
  | "Solda"
  | "Visual"
  | "Fachada"
  | "Montagem Externa"
  | "Administrativo";

export type StatusBem = "Ativo" | "Baixado";

export type PerfilUsuario = "Diretor" | "Gestor" | "Manutenção";

export const CATEGORIAS: Categoria[] = [
  "Máquinas",
  "Ferramentas",
  "Informática",
  "Móveis e Utensílios",
  "Infraestrutura – Instalações",
  "Veículos",
];

export const SETORES: Setor[] = [
  "Corte Marcenaria",
  "Montagem Marcenaria",
  "Solda",
  "Visual",
  "Fachada",
  "Montagem Externa",
  "Administrativo",
];

export type DepreciacaoAnual = 10 | 15 | 20 | 40 | 60 | 80 | 100;

export const DEPRECIACOES: DepreciacaoAnual[] = [10, 15, 20, 40, 60, 80, 100];

export interface Bem {
  id: string;
  descricao: string;
  categoria: Categoria;
  setor: Setor;
  usuario: string;
  dataCompra: string;
  nfe: string;
  valorCompra: number;
  depreciacaoAnual: DepreciacaoAnual;
  valorResidual: number;
  dataBaixa: string | null;
  motivoBaixa: string;
  status: StatusBem;
}

export interface ManutencaoItem {
  id: string;
  descricao: string;
  custo: number;
}

export interface Manutencao {
  id: string;
  numero: string;
  bemId: string;
  descricao: string;
  data: string;
  tipo: string;
  custo: number;
  responsavel: string;
  observacoes: string;
  itens: ManutencaoItem[];
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  categorias: Categoria[];
  setores: Setor[];
}

// Mock data
export const mockUsuarios: Usuario[] = [
  {
    id: "1",
    nome: "Carlos Silva",
    email: "carlos@empresa.com",
    perfil: "Diretor",
    categorias: [...CATEGORIAS],
    setores: [...SETORES],
  },
  {
    id: "2",
    nome: "Matheus Oliveira",
    email: "matheus@empresa.com",
    perfil: "Gestor",
    categorias: [...CATEGORIAS],
    setores: [...SETORES],
  },
  {
    id: "3",
    nome: "Ivomar Santos",
    email: "ivomar@empresa.com",
    perfil: "Manutenção",
    categorias: ["Veículos"],
    setores: ["Montagem Externa"],
  },
];

export function calcularValorResidual(valorCompra: number, depreciacaoAnual: DepreciacaoAnual, dataCompra: string): number {
  if (!dataCompra || !valorCompra) return 0;
  const compra = new Date(dataCompra + "T00:00:00");
  const hoje = new Date();
  const anosDecorridos = (hoje.getTime() - compra.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const fator = Math.max(0, 1 - (depreciacaoAnual / 100) * anosDecorridos);
  return Math.max(0, Math.round(valorCompra * fator * 100) / 100);
}

export function generateNextManutencaoNumero(manutencoes: Manutencao[]): string {
  const maxNum = manutencoes.reduce((max, m) => Math.max(max, parseInt(m.numero || "0")), 0);
  return String(maxNum + 1).padStart(5, "0");
}

export const mockBens: Bem[] = [
  {
    id: "00001",
    descricao: "Serra Circular Makita",
    categoria: "Máquinas",
    setor: "Corte Marcenaria",
    usuario: "João",
    dataCompra: "2023-03-15",
    nfe: "12345",
    valorCompra: 4500,
    depreciacaoAnual: 10,
    valorResidual: 0,
    dataBaixa: null,
    motivoBaixa: "",
    status: "Ativo",
  },
  {
    id: "00002",
    descricao: "Notebook Dell Latitude",
    categoria: "Informática",
    setor: "Administrativo",
    usuario: "Maria",
    dataCompra: "2023-06-20",
    nfe: "67890",
    valorCompra: 6200,
    depreciacaoAnual: 20,
    valorResidual: 0,
    dataBaixa: null,
    motivoBaixa: "",
    status: "Ativo",
  },
  {
    id: "00003",
    descricao: "Fiat Fiorino 2020",
    categoria: "Veículos",
    setor: "Montagem Externa",
    usuario: "Pedro",
    dataCompra: "2020-01-10",
    nfe: "11111",
    valorCompra: 52000,
    depreciacaoAnual: 20,
    valorResidual: 0,
    dataBaixa: null,
    motivoBaixa: "",
    status: "Ativo",
  },
  {
    id: "00004",
    descricao: "Mesa de Escritório",
    categoria: "Móveis e Utensílios",
    setor: "Administrativo",
    usuario: "Ana",
    dataCompra: "2022-11-05",
    nfe: "22222",
    valorCompra: 1800,
    depreciacaoAnual: 10,
    valorResidual: 0,
    dataBaixa: "2025-01-15",
    motivoBaixa: "Bem danificado",
    status: "Baixado",
  },
  {
    id: "00005",
    descricao: "Máquina de Solda MIG",
    categoria: "Máquinas",
    setor: "Solda",
    usuario: "Roberto",
    dataCompra: "2021-07-22",
    nfe: "33333",
    valorCompra: 8500,
    depreciacaoAnual: 10,
    valorResidual: 0,
    dataBaixa: null,
    motivoBaixa: "",
    status: "Ativo",
  },
];

export const mockManutencoes: Manutencao[] = [
  {
    id: "1",
    numero: "00001",
    bemId: "00001",
    descricao: "Troca de disco de corte",
    data: "2024-02-10",
    tipo: "Preventiva",
    custo: 150,
    responsavel: "Ivomar",
    observacoes: "Disco desgastado, substituído por novo",
    itens: [{ id: "1", descricao: "Disco de corte diamantado", custo: 150 }],
  },
  {
    id: "2",
    numero: "00002",
    bemId: "00003",
    descricao: "Revisão completa 30.000km",
    data: "2024-01-20",
    tipo: "Preventiva",
    custo: 1200,
    responsavel: "Ivomar",
    observacoes: "Troca de óleo, filtros e pastilhas de freio",
    itens: [
      { id: "1", descricao: "Troca de óleo", custo: 300 },
      { id: "2", descricao: "Filtros", custo: 400 },
      { id: "3", descricao: "Pastilhas de freio", custo: 500 },
    ],
  },
  {
    id: "3",
    numero: "00003",
    bemId: "00005",
    descricao: "Reparo no alimentador de arame",
    data: "2024-03-05",
    tipo: "Corretiva",
    custo: 450,
    responsavel: "Carlos",
    observacoes: "Peça importada, prazo de 5 dias",
    itens: [{ id: "1", descricao: "Alimentador de arame", custo: 450 }],
  },
  {
    id: "4",
    numero: "00004",
    bemId: "00002",
    descricao: "Formatação e upgrade de RAM",
    data: "2024-04-12",
    tipo: "Corretiva",
    custo: 350,
    responsavel: "TI",
    observacoes: "Upgrade de 8GB para 16GB",
    itens: [
      { id: "1", descricao: "Memória RAM 8GB", custo: 200 },
      { id: "2", descricao: "Serviço de formatação", custo: 150 },
    ],
  },
];

export const currentUser = mockUsuarios[0];

export function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export function generateNextId(bens: Bem[]): string {
  const maxId = bens.reduce((max, b) => Math.max(max, parseInt(b.id)), 0);
  return String(maxId + 1).padStart(5, "0");
}
