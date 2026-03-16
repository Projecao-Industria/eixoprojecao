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
export const mockUsuarios: Usuario[] = [];

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

export const mockBens: Bem[] = [];

export const mockManutencoes: Manutencao[] = [];

export const currentUser: Usuario = {
  id: "",
  nome: "Usuário",
  email: "",
  perfil: "Diretor",
  categorias: [...CATEGORIAS],
  setores: [...SETORES],
};

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
