import { useState, useMemo, useEffect } from "react";
import { Search, Package, Wrench, FileText, Car, Cog, Pencil, Save, PackageCheck, Undo2, Trash2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  calcularValorResidual,
} from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EntregaDB {
  id: string;
  bemId: string;
  gerenteNome: string;
  dataEntrega: string;
  dataDevolucao: string | null;
}

interface BemDB {
  id: string;
  descricao: string;
  categoria: string;
  setor: string;
  usuario: string;
  dataCompra: string;
  nfe: string;
  valorCompra: number;
  depreciacaoAnual: number;
  dataBaixa: string | null;
  motivoBaixa: string;
  status: string;
}

interface ManutencaoDB {
  id: string;
  numero: string;
  bemId: string;
  descricao: string;
  data: string;
  tipo: string;
  custo: number;
  fornecedor: string;
}

export default function HistoricoBem() {
  const [searchParams] = useSearchParams();
  const [bemId, setBemId] = useState(searchParams.get("bem") || "");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [editingExtras, setEditingExtras] = useState(false);
  const [bem, setBem] = useState<BemDB | null>(null);
  const [manutencoes, setManutencoes] = useState<ManutencaoDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [entregas, setEntregas] = useState<EntregaDB[]>([]);

  useEffect(() => {
    const fromUrl = searchParams.get("bem");
    if (fromUrl) setBemId(fromUrl);
  }, [searchParams]);

  // Fetch bem from Supabase when bemId changes
  useEffect(() => {
    if (!bemId) { setBem(null); setManutencoes([]); setEntregas([]); return; }

    const fetchBem = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bens")
        .select("*, categorias(nome), setores(nome)")
        .eq("id", bemId)
        .maybeSingle();

      if (error || !data) {
        setBem(null);
        setManutencoes([]);
        setExtraFields({});
        setLoading(false);
        return;
      }

      const catNome = (data as any).categorias?.nome || "";
      const setNome = (data as any).setores?.nome || "";

      setBem({
        id: data.id,
        descricao: data.descricao,
        categoria: catNome,
        setor: setNome,
        usuario: data.usuario,
        dataCompra: data.data_compra,
        nfe: data.nfe,
        valorCompra: data.valor_compra,
        depreciacaoAnual: data.depreciacao_anual,
        dataBaixa: data.data_baixa,
        motivoBaixa: data.motivo_baixa,
        status: data.status,
      });

      // Fetch extras
      const { data: extras } = await supabase
        .from("bem_extras")
        .select("*")
        .eq("bem_id", bemId)
        .maybeSingle();

      if (extras) {
        setExtraFields({
          placa: extras.placa || "",
          kmCompra: extras.km || "",
          renavam: extras.renavam || "",
          chassi: extras.chassi || "",
          numSerie: extras.numero_serie || "",
          modelo: extras.modelo || "",
          anoFabricacao: (extras as any).ano_fabricacao || "",
          anoModelo: (extras as any).ano_modelo || "",
        });
      } else {
        setExtraFields({});
      }

      // Fetch manutencoes
      const { data: mData } = await supabase
        .from("manutencoes")
        .select("*")
        .eq("bem_id", bemId)
        .order("data", { ascending: false });

      setManutencoes(
        (mData || []).map((m) => ({
          id: m.id,
          numero: m.numero,
          bemId: m.bem_id,
          descricao: m.descricao,
          data: m.data,
          tipo: m.tipo,
          custo: m.custo,
          fornecedor: m.fornecedor,
        }))
      );

      // Fetch entregas
      const { data: eData } = await supabase
        .from("entregas")
        .select("*")
        .eq("bem_id", bemId)
        .order("data_entrega", { ascending: false });

      setEntregas(
        (eData || []).map((e: any) => ({
          id: e.id,
          bemId: e.bem_id,
          gerenteNome: e.gerente_nome,
          dataEntrega: e.data_entrega,
          dataDevolucao: e.data_devolucao,
        }))
      );

      setLoading(false);
    };

    fetchBem();
  }, [bemId]);

  const handleSaveExtras = async () => {
    if (!bem) return;
    const payload = {
      bem_id: bem.id,
      placa: extraFields.placa || "",
      km: extraFields.kmCompra || "",
      renavam: extraFields.renavam || "",
      chassi: extraFields.chassi || "",
      numero_serie: extraFields.numSerie || "",
      modelo: extraFields.modelo || "",
      ano_fabricacao: extraFields.anoFabricacao || "",
      ano_modelo: extraFields.anoModelo || "",
    };

    const { data: existing } = await supabase
      .from("bem_extras")
      .select("id")
      .eq("bem_id", bem.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("bem_extras").update(payload).eq("bem_id", bem.id);
    } else {
      await supabase.from("bem_extras").insert(payload);
    }

    setEditingExtras(false);
    toast.success("Especificações salvas!");
  };

  const handleDevolucao = async (entregaId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("entregas")
      .update({ data_devolucao: today })
      .eq("id", entregaId);

    if (error) {
      toast.error("Erro ao registrar devolução");
      return;
    }

    setEntregas(prev =>
      prev.map(e => e.id === entregaId ? { ...e, dataDevolucao: today } : e)
    );
    toast.success("Devolução registrada!");
  };

  const handleDeleteEntrega = async (entregaId: string) => {
    const { error } = await supabase.from("entregas").delete().eq("id", entregaId);
    if (error) {
      toast.error("Erro ao excluir registro de entrega");
      return;
    }
    setEntregas(prev => prev.filter(e => e.id !== entregaId));
    toast.success("Registro de entrega excluído!");
  };

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

      {bemId && !bem && !loading && (
        <div className="bg-card rounded-xl border border-border p-8 text-center animate-fade-in">
          <Package size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum bem encontrado com o número informado.</p>
        </div>
      )}

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
              <TabsTrigger value="entregas" className="gap-1.5">
                <PackageCheck size={14} /> Entregas ({entregas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="mt-4 space-y-4">
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
                  <div><span className="text-muted-foreground">ID</span><p className="font-mono font-medium">#{bem.id}</p></div>
                  <div><span className="text-muted-foreground">Descrição</span><p className="font-medium">{bem.descricao}</p></div>
                  <div><span className="text-muted-foreground">Categoria</span><p className="font-medium">{bem.categoria}</p></div>
                  <div><span className="text-muted-foreground">Setor</span><p className="font-medium">{bem.setor}</p></div>
                  <div><span className="text-muted-foreground">Usuário</span><p className="font-medium">{bem.usuario}</p></div>
                  <div><span className="text-muted-foreground">NFe</span><p className="font-medium">{bem.nfe}</p></div>
                  <div><span className="text-muted-foreground">Data Compra</span><p className="font-medium">{formatDate(bem.dataCompra)}</p></div>
                  <div><span className="text-muted-foreground">Valor Compra</span><p className="font-medium">{formatCurrency(bem.valorCompra)}</p></div>
                  <div><span className="text-muted-foreground">Valor Residual</span><p className="font-medium">{formatCurrency(calcularValorResidual(bem.valorCompra, bem.depreciacaoAnual as any, bem.dataCompra))}</p></div>
                  <div><span className="text-muted-foreground">Depreciação</span><p className="font-medium">{bem.depreciacaoAnual}% a.a.</p></div>
                  {bem.dataBaixa && (
                    <div><span className="text-muted-foreground">Data Baixa</span><p className="font-medium">{formatDate(bem.dataBaixa)}</p></div>
                  )}
                  {bem.motivoBaixa && (
                    <div className="col-span-2"><span className="text-muted-foreground">Motivo Baixa</span><p className="font-medium">{bem.motivoBaixa}</p></div>
                  )}
                </div>
              </div>

              {isVeiculo && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Car size={18} className="text-primary" />
                      <h2 className="font-display font-semibold">Especificações do Veículo</h2>
                    </div>
                    {editingExtras ? (
                      <Button size="sm" className="gap-1" onClick={handleSaveExtras}>
                        <Save size={14} /> Salvar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingExtras(true)}>
                        <Pencil size={14} /> Editar
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Placa</Label><Input value={extraFields.placa || ""} onChange={(e) => setExtraFields({ ...extraFields, placa: e.target.value })} placeholder="ABC-1234" disabled={!editingExtras} /></div>
                    <div><Label>KM na Data de Compra</Label><Input value={extraFields.kmCompra || ""} onChange={(e) => setExtraFields({ ...extraFields, kmCompra: e.target.value })} placeholder="0" disabled={!editingExtras} /></div>
                    <div><Label>Renavam</Label><Input value={extraFields.renavam || ""} onChange={(e) => setExtraFields({ ...extraFields, renavam: e.target.value })} placeholder="Renavam" disabled={!editingExtras} /></div>
                    <div><Label>Chassi</Label><Input value={extraFields.chassi || ""} onChange={(e) => setExtraFields({ ...extraFields, chassi: e.target.value })} placeholder="Chassi" disabled={!editingExtras} /></div>
                    <div><Label>Ano Fabricação</Label><Input value={extraFields.anoFabricacao || ""} onChange={(e) => setExtraFields({ ...extraFields, anoFabricacao: e.target.value })} placeholder="2024" disabled={!editingExtras} /></div>
                    <div><Label>Ano Modelo</Label><Input value={extraFields.anoModelo || ""} onChange={(e) => setExtraFields({ ...extraFields, anoModelo: e.target.value })} placeholder="2025" disabled={!editingExtras} /></div>
                  </div>
                </div>
              )}

              {isMaquina && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cog size={18} className="text-primary" />
                      <h2 className="font-display font-semibold">Especificações da Máquina</h2>
                    </div>
                    {editingExtras ? (
                      <Button size="sm" className="gap-1" onClick={handleSaveExtras}>
                        <Save size={14} /> Salvar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingExtras(true)}>
                        <Pencil size={14} /> Editar
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Número de Série</Label><Input value={extraFields.numSerie || ""} onChange={(e) => setExtraFields({ ...extraFields, numSerie: e.target.value })} placeholder="Número de série" disabled={!editingExtras} /></div>
                    <div><Label>Modelo</Label><Input value={extraFields.modelo || ""} onChange={(e) => setExtraFields({ ...extraFields, modelo: e.target.value })} placeholder="Modelo" disabled={!editingExtras} /></div>
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
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fornecedor</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manutencoes.map((m) => (
                          <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => window.location.href = `/manutencao?open=${m.id}`}>
                            <td className="px-4 py-3 font-mono text-xs">#{m.numero}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(m.data)}</td>
                            <td className="px-4 py-3 font-medium">{m.descricao}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                m.tipo === "Preventiva" ? "bg-accent/15 text-accent border-accent/30" : "bg-warning/15 text-warning-foreground border-warning/30"
                              }`}>{m.tipo}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{m.fornecedor}</td>
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

            <TabsContent value="entregas" className="mt-4">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {entregas.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <PackageCheck size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhuma entrega registrada para este bem.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Responsável</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data Entrega</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data Devolução</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entregas.map((e) => (
                          <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{e.gerenteNome}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(e.dataEntrega)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{e.dataDevolucao ? formatDate(e.dataDevolucao) : "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                e.dataDevolucao
                                  ? "bg-muted text-muted-foreground border-border"
                                  : "bg-accent/15 text-accent border-accent/30"
                              }`}>
                                {e.dataDevolucao ? "Devolvido" : "Em posse"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!e.dataDevolucao && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="gap-1">
                                        <Undo2 size={14} /> Devolução
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Devolução</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Deseja registrar a devolução deste bem? A data de hoje será usada como data de devolução.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDevolucao(e.id)}>
                                          Confirmar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {e.dataDevolucao && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                        <Trash2 size={14} />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Registro de Entrega</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Deseja apagar o registro de entrega? Utilizar apenas para erros de lançamentos.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteEntrega(e.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
