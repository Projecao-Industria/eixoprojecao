import { Package, Wrench, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { mockBens, mockManutencoes, formatCurrency, formatDate, currentUser } from "@/lib/mockData";

export default function Dashboard() {
  const totalAtivos = mockBens.filter((b) => b.status === "Ativo").length;
  const totalBaixados = mockBens.filter((b) => b.status === "Baixado").length;
  const totalManutencoes = mockManutencoes.length;
  const valorTotal = mockBens.reduce((sum, b) => sum + b.valorCompra, 0);

  const stats = [
    { label: "Total de Bens", value: mockBens.length, icon: Package, color: "text-primary" },
    { label: "Ativos", value: totalAtivos, icon: CheckCircle2, color: "text-accent" },
    { label: "Baixados", value: totalBaixados, icon: XCircle, color: "text-destructive" },
    { label: "Manutenções", value: totalManutencoes, icon: Wrench, color: "text-warning" },
  ];

  const recentManutencoes = [...mockManutencoes]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Olá, {currentUser.nome.split(" ")[0]} 👋
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

      <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold">Valor Total do Patrimônio</h2>
        </div>
        <p className="text-3xl font-display font-bold text-primary">{formatCurrency(valorTotal)}</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Últimas Manutenções</h2>
          <Link to="/manutencao" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="space-y-3">
          {recentManutencoes.map((m) => {
            const bem = mockBens.find((b) => b.id === m.bemId);
            return (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{m.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {bem?.descricao} · {formatDate(m.data)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(m.custo)}</p>
                  <span className="text-xs text-muted-foreground">{m.tipo}</span>
                </div>
              </div>
            );
          })}
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
          {mockBens.slice(0, 3).map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{b.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  #{b.id} · {b.categoria} · {b.setor}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(b.valorCompra)}</p>
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
