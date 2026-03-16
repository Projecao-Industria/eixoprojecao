import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import {
  mockBens,
  formatCurrency,
  formatDate,
  generateNextId,
  CATEGORIAS,
  SETORES,
  type Bem,
  type Categoria,
  type Setor,
  type StatusBem,
} from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Patrimonio() {
  const [bens, setBens] = useState<Bem[]>(mockBens);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBem, setEditingBem] = useState<Bem | null>(null);

  const emptyBem: Omit<Bem, "id"> = {
    descricao: "",
    categoria: "Máquinas",
    setor: "Corte Marcenaria",
    usuario: "",
    dataCompra: "",
    nfe: "",
    valorCompra: 0,
    valorResidual: 0,
    dataBaixa: null,
    status: "Ativo",
  };

  const [form, setForm] = useState<Omit<Bem, "id">>(emptyBem);

  const filtered = bens.filter((b) => {
    const matchSearch =
      b.descricao.toLowerCase().includes(search.toLowerCase()) ||
      b.id.includes(search) ||
      b.usuario.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = filterCategoria === "all" || b.categoria === filterCategoria;
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchCategoria && matchStatus;
  });

  function openNew() {
    setEditingBem(null);
    setForm(emptyBem);
    setDialogOpen(true);
  }

  function openEdit(bem: Bem) {
    setEditingBem(bem);
    setForm({ ...bem });
    setDialogOpen(true);
  }

  function handleSave() {
    if (editingBem) {
      setBens((prev) =>
        prev.map((b) => (b.id === editingBem.id ? { ...form, id: editingBem.id } : b))
      );
    } else {
      const newId = generateNextId(bens);
      setBens((prev) => [...prev, { ...form, id: newId }]);
    }
    setDialogOpen(false);
  }

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

      {/* Filters */}
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
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
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

      {/* Table */}
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
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => openEdit(b)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                  <td className="px-4 py-3 font-medium">{b.descricao}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{b.categoria}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{b.setor}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{b.usuario}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-right">{formatCurrency(b.valorCompra)}</td>
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum bem encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingBem ? `Editar Bem #${editingBem.id}` : "Novo Bem"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
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
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SETORES.map((s) => (
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
                />
              </div>
              <div>
                <Label>NFe</Label>
                <Input
                  value={form.nfe}
                  onChange={(e) => setForm({ ...form, nfe: e.target.value })}
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
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as StatusBem })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Baixado">Baixado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Compra (R$)</Label>
                <Input
                  type="number"
                  value={form.valorCompra || ""}
                  onChange={(e) => setForm({ ...form, valorCompra: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Valor Residual (R$)</Label>
                <Input
                  type="number"
                  value={form.valorResidual || ""}
                  onChange={(e) => setForm({ ...form, valorResidual: Number(e.target.value) })}
                />
              </div>
            </div>
            {form.status === "Baixado" && (
              <div>
                <Label>Data Baixa</Label>
                <Input
                  type="date"
                  value={form.dataBaixa || ""}
                  onChange={(e) => setForm({ ...form, dataBaixa: e.target.value })}
                />
              </div>
            )}
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
