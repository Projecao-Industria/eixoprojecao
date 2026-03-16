import { useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  mockManutencoes,
  mockBens,
  formatCurrency,
  formatDate,
  type Manutencao,
} from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ManutencaoPage() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>(mockManutencoes);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Manutencao | null>(null);

  const emptyForm: Omit<Manutencao, "id"> = {
    bemId: "",
    descricao: "",
    data: "",
    tipo: "Preventiva",
    custo: 0,
    responsavel: "",
    observacoes: "",
  };

  const [form, setForm] = useState<Omit<Manutencao, "id">>(emptyForm);

  const filtered = manutencoes.filter((m) => {
    const bem = mockBens.find((b) => b.id === m.bemId);
    return (
      m.descricao.toLowerCase().includes(search.toLowerCase()) ||
      bem?.descricao.toLowerCase().includes(search.toLowerCase()) ||
      m.responsavel.toLowerCase().includes(search.toLowerCase())
    );
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(m: Manutencao) {
    setEditing(m);
    setForm({ ...m });
    setDialogOpen(true);
  }

  function handleSave() {
    if (editing) {
      setManutencoes((prev) =>
        prev.map((m) => (m.id === editing.id ? { ...form, id: editing.id } : m))
      );
    } else {
      const newId = String(manutencoes.length + 1);
      setManutencoes((prev) => [...prev, { ...form, id: newId }]);
    }
    setDialogOpen(false);
  }

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
            placeholder="Buscar por descrição, bem ou responsável..."
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Responsável</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const bem = mockBens.find((b) => b.id === m.bemId);
                return (
                  <tr
                    key={m.id}
                    onClick={() => openEdit(m)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
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
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{m.responsavel}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.custo)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma manutenção encontrada.
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
              {editing ? "Editar Manutenção" : "Nova Manutenção"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Bem</Label>
              <Select
                value={form.bemId}
                onValueChange={(v) => setForm({ ...form, bemId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o bem" /></SelectTrigger>
                <SelectContent>
                  {mockBens.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      #{b.id} - {b.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Custo (R$)</Label>
                <Input
                  type="number"
                  value={form.custo || ""}
                  onChange={(e) => setForm({ ...form, custo: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Responsável</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={3}
              />
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
