import { useState, useMemo, useEffect } from "react";
import { Search, Package, Wrench, FileText, Car, Cog } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  mockBens,
  mockManutencoes,
  formatCurrency,
  formatDate,
  calcularValorResidual,
  type Bem,
  type Manutencao,
} from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HistoricoBem() {
  const [searchParams] = useSearchParams();
  const [bemId, setBemId] = useState(searchParams.get("bem") || "");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  const bem = useMemo(() => mockBens.find((b) => b.id === bemId), [bemId]);
  const manutencoes = useMemo(
    () => (bem ? mockManutencoes.filter((m) => m.bemId === bem.id).sort((a, b) => b.data.localeCompare(a.data)) : []),
    [bem]
  );

  useEffect(() => {
    const fromUrl = searchParams.get("bem");
    if (fromUrl) setBemId(fromUrl);
  }, [searchParams]);

  const isVeiculo = bem?.categoria === "Veículos";
  const isMaquina = bem?.categoria === "Máquinas";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Histórico do Bem</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulte informações detalhadas e histórico de manutenções
        </p>
      </div>

      {/* Search box */}
      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
        <Label className="text-sm font-medium mb-2 block">Número do Bem</Label>
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Informe o número do bem (ex: 00001)..."
            value={bemId}
            onChange={(e) => setBemId(e.target.value.replace(/\D/g, "").padStart(e.target.value.replace(/\D/g, "").length, ""))}
            className="pl-9 max-w-sm"
          />
        </div>
      </div>

      {/* Bem not found */}
      {bemId && !bem && (
        <div className="bg-card rounded-xl border border-border p-8 text-center animate-fade-in">
          <Package size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum bem encontrado com o número informado.</p>
        </div>
      )}

      {/* Bem found */}
      {bem && (
        <div className="animate-fade-in">
          <Tabs defaultValue="detalhes">
            <TabsList>
              <TabsTrigger value="detalhes" className="gap-1.5">
                <FileText size={14} /> Detalhes
              </TabsTrigger>
              <TabsTrigger value="manutencoes" className="gap-1.5">
                <Wrench size={14} /> Manutenções ({manutencoes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="mt-4 space-y-4">
              {/* General info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={18} className="text-primary" />
                  <h2 className="font-display font-semibold">Informações Gerais</h2>
                  <span
                    className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      bem.status === "Ativo"
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    }`}
                  >
                    {bem.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID</span>
                    <p className="font-mono font-medium">#{bem.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Descrição</span>
                    <p className="font-medium">{bem.descricao}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria</span>
                    <p className="font-medium">{bem.categoria}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Setor</span>
                    <p className="font-medium">{bem.setor}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usuário</span>
                    <p className="font-medium">{bem.usuario}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NFe</span>
                    <p className="font-medium">{bem.nfe}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Compra</span>
                    <p className="font-medium">{formatDate(bem.dataCompra)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor Compra</span>
                    <p className="font-medium">{formatCurrency(bem.valorCompra)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor Residual</span>
                    <p className="font-medium">{formatCurrency(calcularValorResidual(bem.valorCompra, bem.depreciacaoAnual, bem.dataCompra))}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Depreciação</span>
                    <p className="font-medium">{bem.depreciacaoAnual}% a.a.</p>
                  </div>
                  {bem.dataBaixa && (
                    <div>
                      <span className="text-muted-foreground">Data Baixa</span>
                      <p className="font-medium">{formatDate(bem.dataBaixa)}</p>
                    </div>
                  )}
                  {bem.motivoBaixa && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Motivo Baixa</span>
                      <p className="font-medium">{bem.motivoBaixa}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle-specific fields */}
              {isVeiculo && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Car size={18} className="text-primary" />
                    <h2 className="font-display font-semibold">Especificações do Veículo</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Placa</Label>
                      <Input
                        value={extraFields.placa || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, placa: e.target.value })}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <div>
                      <Label>KM na Data de Compra</Label>
                      <Input
                        value={extraFields.kmCompra || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, kmCompra: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Renavam</Label>
                      <Input
                        value={extraFields.renavam || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, renavam: e.target.value })}
                        placeholder="Renavam"
                      />
                    </div>
                    <div>
                      <Label>Chassi</Label>
                      <Input
                        value={extraFields.chassi || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, chassi: e.target.value })}
                        placeholder="Chassi"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Machine-specific fields */}
              {isMaquina && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Cog size={18} className="text-primary" />
                    <h2 className="font-display font-semibold">Especificações da Máquina</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Número de Série</Label>
                      <Input
                        value={extraFields.numSerie || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, numSerie: e.target.value })}
                        placeholder="Número de série"
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={extraFields.modelo || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, modelo: e.target.value })}
                        placeholder="Modelo"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manutencoes" className="mt-4">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {manutencoes.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Wrench size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhuma manutenção registrada para este bem.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nº</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Responsável</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manutencoes.map((m) => (
                          <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">#{m.numero}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(m.data)}</td>
                            <td className="px-4 py-3 font-medium">{m.descricao}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  m.tipo === "Preventiva"
                                    ? "bg-accent/15 text-accent border-accent/30"
                                    : "bg-warning/15 text-warning-foreground border-warning/30"
                                }`}
                              >
                                {m.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{m.responsavel}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.custo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {manutencoes.length > 0 && (
                  <div className="px-4 py-3 bg-muted/30 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Total de manutenções: {manutencoes.length}</span>
                    <span className="font-semibold">{formatCurrency(manutencoes.reduce((s, m) => s + m.custo, 0))}</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
