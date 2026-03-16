import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  generateNextManutencaoNumero,
  type Manutencao,
  type ManutencaoItem,
  type Bem,
} from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function BemSearchSelect({
  value,
  onChange,
  bens,
}: {
  value: string;
  onChange: (bemId: string) => void;
  bens: Bem[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedBem = bens.find((b) => b.id === value);

  const results = useMemo(() => {
    if (!query) return bens.slice(0, 10);
    const q = query.toLowerCase();
    return bens.filter(
      (b) =>
        b.id.includes(q) ||
        b.descricao.toLowerCase().includes(q)
    );
  }, [query, bens]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {selectedBem ? `#${selectedBem.id} - ${selectedBem.descricao}` : "Buscar bem..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-7 h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {results.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                onChange(b.id);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="font-mono text-xs text-muted-foreground">#{b.id}</span>{" "}
              <span className="font-medium">{b.descricao}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum bem encontrado.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ManutencaoPage() {
  const { categoriasPermitidas } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [bensDB, setBensDB] = useState<Bem[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Manutencao | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    let bensQuery = supabase.from("bens").select("id, descricao, categoria_id").order("id");
    if (categoriasPermitidas) {
      bensQuery = bensQuery.in("categoria_id", categoriasPermitidas);
    }
    const bensRes = await bensQuery;

    const allowedBemIds: string[] = [];
    if (bensRes.data) {
      setBensDB(bensRes.data.map((b: any) => ({
        id: b.id, descricao: b.descricao, categoria: "" as any, setor: "" as any,
        usuario: "", dataCompra: "", nfe: "", valorCompra: 0, depreciacaoAnual: 10,
        valorResidual: 0, dataBaixa: null, motivoBaixa: "", status: "Ativo" as any,
      })));
      allowedBemIds.push(...bensRes.data.map((b: any) => b.id));
    }

    let manQuery = supabase.from("manutencoes").select("*, manutencao_itens(*)").order("numero");
    if (categoriasPermitidas && allowedBemIds.length > 0) {
      manQuery = manQuery.in("bem_id", allowedBemIds);
    } else if (categoriasPermitidas && allowedBemIds.length === 0) {
      setManutencoes([]);
      return;
    }
    const manRes = await manQuery;
    if (bensRes.data) {
      setBensDB(bensRes.data.map((b: any) => ({
        id: b.id, descricao: b.descricao, categoria: "" as any, setor: "" as any,
        usuario: "", dataCompra: "", nfe: "", valorCompra: 0, depreciacaoAnual: 10,
        valorResidual: 0, dataBaixa: null, motivoBaixa: "", status: "Ativo" as any,
      })));
    }
    if (manRes.data) {
      const mapped: Manutencao[] = manRes.data.map((m: any) => ({
        id: m.id,
        numero: m.numero,
        bemId: m.bem_id,
        descricao: m.descricao,
        data: m.data || "",
        tipo: m.tipo,
        custo: Number(m.custo),
        fornecedor: m.fornecedor,
        nfePedido: m.nfe_pedido || "",
        observacoes: m.observacoes,
        itens: (m.manutencao_itens || []).map((i: any) => ({
          id: i.id,
          descricao: i.descricao,
          custo: Number(i.custo),
        })),
      }));
      setManutencoes(mapped);
    }
  }

  const emptyForm: Omit<Manutencao, "id"> = {
    numero: "",
    bemId: "",
    descricao: "",
    data: "",
    tipo: "Preventiva",
    custo: 0,
    fornecedor: "",
    nfePedido: "",
    observacoes: "",
    itens: [],
  };

  const [form, setForm] = useState<Omit<Manutencao, "id">>(emptyForm);

  const filtered = manutencoes.filter((m) => {
    const bem = bensDB.find((b) => b.id === m.bemId);
    const q = search.toLowerCase();
    return (
      m.descricao.toLowerCase().includes(q) ||
      m.numero.includes(q) ||
      m.bemId.includes(search) ||
      bem?.descricao.toLowerCase().includes(q) ||
      m.fornecedor.toLowerCase().includes(q)
    );
  });

  function openNew() {
    setEditing(null);
    const numero = generateNextManutencaoNumero(manutencoes);
    setForm({ ...emptyForm, numero });
    setDialogOpen(true);
  }

  function openEdit(m: Manutencao) {
    setEditing(m);
    setForm({ ...m });
    setDialogOpen(true);
  }

  async function handleSave() {
    const totalItens = form.itens.reduce((s, i) => s + i.custo, 0);
    const custo = totalItens > 0 ? totalItens : form.custo;

    const dbRow = {
      numero: form.numero,
      bem_id: form.bemId,
      descricao: form.descricao,
      data: form.data,
      tipo: form.tipo as "Preventiva" | "Corretiva",
      custo,
      fornecedor: form.fornecedor,
      nfe_pedido: form.nfePedido,
      observacoes: form.observacoes,
    };

    if (editing) {
      await supabase.from("manutencoes").update(dbRow).eq("id", editing.id);
      // Replace items
      await supabase.from("manutencao_itens").delete().eq("manutencao_id", editing.id);
      if (form.itens.length > 0) {
        await supabase.from("manutencao_itens").insert(
          form.itens.map((i) => ({ manutencao_id: editing.id, descricao: i.descricao, custo: i.custo }))
        );
      }
    } else {
      const { data: inserted } = await supabase.from("manutencoes").insert(dbRow).select("id").single();
      if (inserted && form.itens.length > 0) {
        await supabase.from("manutencao_itens").insert(
          form.itens.map((i) => ({ manutencao_id: inserted.id, descricao: i.descricao, custo: i.custo }))
        );
      }
    }
    setDialogOpen(false);
    fetchAll();
  }

  function addItem() {
    const newItem: ManutencaoItem = {
      id: String(form.itens.length + 1),
      descricao: "",
      custo: 0,
    };
    setForm({ ...form, itens: [...form.itens, newItem] });
  }

  function updateItem(index: number, field: keyof ManutencaoItem, value: string | number) {
    const updated = form.itens.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setForm({ ...form, itens: updated });
  }

  function removeItem(index: number) {
    setForm({ ...form, itens: form.itens.filter((_, i) => i !== index) });
  }

  const totalItens = form.itens.reduce((s, i) => s + i.custo, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Manutenção</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de manutenções realizadas
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={16} />
          Nova
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº manutenção, nº bem, descrição ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nº</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fornecedor</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const bem = bensDB.find((b) => b.id === m.bemId);
                return (
                  <tr
                    key={m.id}
                    onClick={() => openEdit(m)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">#{m.numero}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(m.data)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{bem?.descricao || "—"}</span>
                      <span className="text-xs text-muted-foreground ml-1">#{m.bemId}</span>
                    </td>
                    <td className="px-4 py-3">{m.descricao}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
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
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{m.fornecedor}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.custo)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma manutenção encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? `Manutenção #${editing.numero}` : `Nova Manutenção #${form.numero}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Bem</Label>
              <BemSearchSelect
                value={form.bemId}
                onChange={(v) => setForm({ ...form, bemId: v })}
                bens={bensDB}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input
                value={form.fornecedor}
                onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
              />
            </div>
            <div>
              <Label>NFe ou Número Pedido</Label>
              <Input
                value={form.nfePedido}
                onChange={(e) => setForm({ ...form, nfePedido: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={2}
              />
            </div>

            {/* Itens da manutenção */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Itens da Manutenção</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus size={14} /> Adicionar Item
                </Button>
              </div>
              {form.itens.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground w-32">Custo (R$)</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.itens.map((item, idx) => (
                        <tr key={idx} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5">
                            <Input
                              value={item.descricao}
                              onChange={(e) => updateItem(idx, "descricao", e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Descrição do item"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="number"
                              value={item.custo || ""}
                              onChange={(e) => updateItem(idx, "custo", Number(e.target.value))}
                              className="h-8 text-sm text-right"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {form.itens.length > 0 && (
                        <tr className="bg-muted/30">
                          <td className="px-3 py-2 text-right font-medium text-muted-foreground">Total:</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatCurrency(totalItens)}</td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {form.itens.length === 0 && (
                <div>
                  <Label>Custo Total (R$)</Label>
                  <Input
                    type="number"
                    value={form.custo || ""}
                    onChange={(e) => setForm({ ...form, custo: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
