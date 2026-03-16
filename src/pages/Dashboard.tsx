import { useState, useEffect } from "react";
import { Package, Wrench, CheckCircle2, XCircle, DollarSign, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate, calcularValorResidual } from "@/lib/mockData";

interface BemRow {
  id: string;
  descricao: string;
  status: string;
  valor_compra: number;
  depreciacao_anual: number;
  data_compra: string;
  categoria: string;
  setor: string;
}

interface ManutencaoRow {
  id: string;
  descricao: string;
  data: string;
  tipo: string;
  custo: number;
  bem_id: string;
  bem_descricao?: string;
}

export default function Dashboard() {
  const { nome } = useAuth();
  const [bens, setBens] = useState<BemRow[]>([]);
  const [manutencoes, setManutencoes] = useState<ManutencaoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [bensRes, manutRes] = await Promise.all([
        supabase
          .from("bens")
          .select("id, descricao, status, valor_compra, depreciacao_anual, data_compra, categorias(nome), setores(nome)")
          .order("created_at", { ascending: false }),
        supabase
          .from("manutencoes")
          .select("id, descricao, data, tipo, custo, bem_id")
          .order("data", { ascending: false })
          .limit(5),
      ]);

      if (bensRes.data) {
        const mapped = bensRes.data.map((b: any) => ({
          id: b.id,
          descricao: b.descricao,
          status: b.status,
          valor_compra: b.valor_compra,
          depreciacao_anual: b.depreciacao_anual,
          data_compra: b.data_compra,
          categoria: b.categorias?.nome || "",
          setor: b.setores?.nome || "",
        }));
        setBens(mapped);

        // Enrich manutencoes with bem descricao
        if (manutRes.data) {
          const bensMap = new Map(mapped.map((b: BemRow) => [b.id, b.descricao]));
          setManutencoes(
            manutRes.data.map((m: any) => ({
              ...m,
              bem_descricao: bensMap.get(m.bem_id) || m.bem_id,
            }))
          );
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const ativos = bens.filter((b) => b.status === "Ativo");
  const totalAtivos = ativos.length;
  const totalBaixados = bens.filter((b) => b.status === "Baixado").length;

  const valorCompraAtivos = ativos.reduce((sum, b) => sum + b.valor_compra, 0);
  const valorDepreciadoAtivos = ativos.reduce(
    (sum, b) => sum + calcularValorResidual(b.valor_compra, b.depreciacao_anual as any, b.data_compra),
    0
  );

  const stats = [
    { label: "Total de Bens", value: bens.length, icon: Package, color: "text-primary" },
    { label: "Ativos", value: totalAtivos, icon: CheckCircle2, color: "text-accent" },
    { label: "Baixados", value: totalBaixados, icon: XCircle, color: "text-destructive" },
    { label: "Manutenções", value: manutencoes.length, icon: Wrench, color: "text-warning" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Olá, {nome?.split(" ")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumo do patrimônio e manutenções da empresa.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <s.icon size={18} className={s.color} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-display font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={18} className="text-primary" />
            <h2 className="font-display font-semibold text-sm text-muted-foreground">Valor de Compra do Patrimônio</h2>
          </div>
          <p className="text-3xl font-display font-bold text-primary">{formatCurrency(valorCompraAtivos)}</p>
          <p className="text-xs text-muted-foreground mt-1">Apenas bens ativos</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={18} className="text-accent" />
            <h2 className="font-display font-semibold text-sm text-muted-foreground">Patrimônio Depreciado</h2>
          </div>
          <p className="text-3xl font-display font-bold text-accent">{formatCurrency(valorDepreciadoAtivos)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor residual dos bens ativos</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Últimas Manutenções</h2>
          <Link to="/manutencao" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="space-y-3">
          {manutencoes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
          )}
          {manutencoes.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{m.descricao || "Sem descrição"}</p>
                <p className="text-xs text-muted-foreground">
                  {m.bem_descricao} · {formatDate(m.data)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(m.custo)}</p>
                <span className="text-xs text-muted-foreground">{m.tipo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Bens Recentes</h2>
          <Link to="/patrimonio" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="space-y-3">
          {bens.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum bem cadastrado.</p>
          )}
          {bens.slice(0, 3).map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{b.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  #{b.id} · {b.categoria} · {b.setor}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(b.valor_compra)}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    b.status === "Ativo"
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}