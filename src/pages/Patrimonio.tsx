import { useState, useEffect } from "react";
import { Plus, Search, Filter, Pencil, ArrowDownCircle, RotateCcw, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  mockBens,
  formatCurrency,
  formatDate,
  generateNextId,
  calcularValorResidual,
  DEPRECIACOES,
  type Bem,
  type Categoria,
  type Setor,
  type DepreciacaoAnual,
} from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CurrencyInput from "@/components/CurrencyInput";

export default function Patrimonio() {
  const navigate = useNavigate();
  const [bens, setBens] = useState<Bem[]>(mockBens);
  const [categoriasDB, setCategoriasDB] = useState<string[]>([]);
  const [setoresDB, setSetoresDB] = useState<string[]>([]);

  useEffect(() => {
    async function fetchLists() {
      const [catRes, setRes] = await Promise.all([
        supabase.from("categorias").select("nome").order("nome"),
        supabase.from("setores").select("nome").order("nome"),
      ]);
      if (catRes.data) setCategoriasDB(catRes.data.map((c: any) => c.nome));
      if (setRes.data) setSetoresDB(setRes.data.map((s: any) => s.nome));
    }
    fetchLists();
  }, []);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterSetor, setFilterSetor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBem, setEditingBem] = useState<Bem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBaixa, setShowBaixa] = useState(false);

  const emptyBem: Omit<Bem, "id"> = {
    descricao: "",
    categoria: "Máquinas",
    setor: "Corte Marcenaria",
    usuario: "",
    dataCompra: "",
    nfe: "",
    valorCompra: 0,
    depreciacaoAnual: 10,
    valorResidual: 0,
    dataBaixa: null,
    motivoBaixa: "",
    status: "Ativo",
  };

  const [form, setForm] = useState<Omit<Bem, "id">>(emptyBem);

  const filtered = bens.filter((b) => {
    const matchSearch =
      b.descricao.toLowerCase().includes(search.toLowerCase()) ||
      b.id.includes(search) ||
      b.usuario.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = filterCategoria === "all" || b.categoria === filterCategoria;
    const matchSetor = filterSetor === "all" || b.setor === filterSetor;
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchCategoria && matchSetor && matchStatus;
  });

  function openNew() {
    setEditingBem(null);
    setIsEditing(true);
    setShowBaixa(false);
    setForm(emptyBem);
    setDialogOpen(true);
  }

  function openView(bem: Bem) {
    setEditingBem(bem);
    setIsEditing(false);
    setShowBaixa(false);
    const valorRes = calcularValorResidual(bem.valorCompra, bem.depreciacaoAnual, bem.dataCompra);
    setForm({ ...bem, valorResidual: valorRes });
    setDialogOpen(true);
  }

  function handleSave() {
    if (editingBem) {
      setBens((prev) =>
        prev.map((b) => (b.id === editingBem.id ? { ...form, id: editingBem.id } : b))
      );
    } else {
      const newId = generateNextId(bens);
      const valorRes = calcularValorResidual(form.valorCompra, form.depreciacaoAnual, form.dataCompra);
      setBens((prev) => [...prev, { ...form, id: newId, status: "Ativo", valorResidual: valorRes }]);
    }
    setDialogOpen(false);
  }

  function handleBaixar() {
    if (!editingBem) return;
    const hoje = new Date().toISOString().split("T")[0];
    const updated: Bem = {
      ...form,
      id: editingBem.id,
      status: "Baixado",
      dataBaixa: hoje,
    };
    setBens((prev) => prev.map((b) => (b.id === editingBem.id ? updated : b)));
    setDialogOpen(false);
  }

  function handleReverterBaixa() {
    if (!editingBem) return;
    const updated: Bem = {
      ...form,
      id: editingBem.id,
      status: "Ativo",
      dataBaixa: null,
      motivoBaixa: "",
    };
    setBens((prev) => prev.map((b) => (b.id === editingBem.id ? updated : b)));
    setDialogOpen(false);
  }

  const isViewMode = editingBem && !isEditing;
  const isCreating = !editingBem;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Patrimônio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerenciamento de bens da empresa
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={16} />
          Novo
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, ID ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full md:w-48">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categoriasDB.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSetor} onValueChange={setFilterSetor}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Setores</SelectItem>
              {setoresDB.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Baixado">Baixado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Setor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Usuário</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Valor Compra</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Valor Residual</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const valorRes = calcularValorResidual(b.valorCompra, b.depreciacaoAnual, b.dataCompra);
                return (
                  <tr
                    key={b.id}
                    onClick={() => openView(b)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3 font-medium">{b.descricao}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{b.categoria}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{b.setor}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{b.usuario}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-right">{formatCurrency(b.valorCompra)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right">{formatCurrency(valorRes)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          b.status === "Ativo"
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum bem encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {isCreating ? "Novo Bem" : `Bem #${editingBem?.id}`}
            </DialogTitle>
          </DialogHeader>

          {/* Action buttons for view mode - Ativo */}
          {isViewMode && editingBem?.status === "Ativo" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                <Pencil size={14} /> Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => setShowBaixa(!showBaixa)}
              >
                <ArrowDownCircle size={14} /> Baixar Bem
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setDialogOpen(false);
                  navigate(`/historico?bem=${editingBem.id}`);
                }}
              >
                <History size={14} /> Histórico
              </Button>
            </div>
          )}

          {/* Action buttons for view mode - Baixado */}
          {isViewMode && editingBem?.status === "Baixado" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-accent border-accent/30 hover:bg-accent/10" onClick={handleReverterBaixa}>
                <RotateCcw size={14} /> Reverter Baixa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setDialogOpen(false);
                  navigate(`/historico?bem=${editingBem.id}`);
                }}
              >
                <History size={14} /> Histórico
              </Button>
            </div>
          )}

          {/* Baixa form */}
          {isViewMode && showBaixa && (
            <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <Label>Motivo da Baixa</Label>
              <Textarea
                value={form.motivoBaixa}
                onChange={(e) => setForm({ ...form, motivoBaixa: e.target.value })}
                placeholder="Descreva o motivo da baixa..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBaixa(false)}>Cancelar</Button>
                <Button variant="destructive" size="sm" onClick={handleBaixar}>Confirmar Baixa</Button>
              </div>
            </div>
          )}

          {/* Status badge for baixado */}
          {editingBem?.status === "Baixado" && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
              <span className="font-medium text-destructive">Bem Baixado</span>
              {editingBem.dataBaixa && (
                <span className="text-muted-foreground ml-2">em {formatDate(editingBem.dataBaixa)}</span>
              )}
              {editingBem.motivoBaixa && (
                <p className="text-muted-foreground mt-1">Motivo: {editingBem.motivoBaixa}</p>
              )}
            </div>
          )}

          <div className="space-y-4 mt-2">
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                disabled={isViewMode}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}
                  disabled={isViewMode}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriasDB.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Setor</Label>
                <Select
                  value={form.setor}
                  onValueChange={(v) => setForm({ ...form, setor: v as Setor })}
                  disabled={isViewMode}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {setoresDB.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Usuário</Label>
                <Input
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label>NFe</Label>
                <Input
                  value={form.nfe}
                  onChange={(e) => setForm({ ...form, nfe: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Compra</Label>
                <Input
                  type="date"
                  value={form.dataCompra}
                  onChange={(e) => setForm({ ...form, dataCompra: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label>Depreciação Anual</Label>
                <Select
                  value={String(form.depreciacaoAnual)}
                  onValueChange={(v) => setForm({ ...form, depreciacaoAnual: Number(v) as DepreciacaoAnual })}
                  disabled={isViewMode}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPRECIACOES.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Compra (R$)</Label>
                <CurrencyInput
                  value={form.valorCompra}
                  onChange={(v) => setForm({ ...form, valorCompra: v })}
                  disabled={isViewMode}
                />
              </div>
              {editingBem && (
                <div>
                  <Label>Valor Residual (R$)</Label>
                  <Input
                    value={formatCurrency(calcularValorResidual(form.valorCompra, form.depreciacaoAnual, form.dataCompra))}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              )}
            </div>

            {(isEditing || isCreating) && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
