import { useState, useEffect } from "react";
import { Plus, Search, Pencil, ArrowDownCircle, RotateCcw, Trash2, Printer } from "lucide-react";
import { formatDate, generateNextId, type Bem } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GenericEntregaDialog from "@/components/GenericEntregaDialog";
import GenericDevolucaoDialog from "@/components/GenericDevolucaoDialog";

interface Epi {
  id: string;
  descricao: string;
  marca: string;
  numeroCa: string;
  dataCompra: string;
  dataVencimento: string | null;
  dataBaixa: string | null;
  motivoBaixa: string;
  status: "Ativo" | "Baixado";
}

const emptyEpi: Omit<Epi, "id"> = {
  descricao: "",
  marca: "",
  numeroCa: "",
  dataCompra: "",
  dataVencimento: null,
  dataBaixa: null,
  motivoBaixa: "",
  status: "Ativo",
};

export default function EPIs() {
  const { categoriasPermitidas, setoresPermitidos } = useAuth();
  const [epis, setEpis] = useState<Epi[]>([]);

  useEffect(() => {
    fetchAll();
  }, [categoriasPermitidas, setoresPermitidos]);

  async function fetchAll() {
    const res = await (supabase as any).from("epis").select("*").order("id");
    if (res.data) {
      const mapped: Epi[] = res.data.map((b: any) => ({
        id: b.id,
        descricao: b.descricao,
        marca: b.marca || "",
        numeroCa: b.numero_ca || "",
        dataCompra: b.data_compra || "",
        dataVencimento: b.data_vencimento || null,
        dataBaixa: b.data_baixa || null,
        motivoBaixa: b.motivo_baixa || "",
        status: b.status as "Ativo" | "Baixado",
      }));
      setEpis(mapped);
    }
  }

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEpi, setEditingEpi] = useState<Epi | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBaixa, setShowBaixa] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entregaOpen, setEntregaOpen] = useState(false);
  const [devolucaoOpen, setDevolucaoOpen] = useState(false);
  const [form, setForm] = useState<Omit<Epi, "id">>(emptyEpi);

  const filtered = epis.filter((e) => {
    const matchSearch =
      e.descricao.toLowerCase().includes(search.toLowerCase()) ||
      e.id.includes(search) ||
      e.marca.toLowerCase().includes(search.toLowerCase()) ||
      e.numeroCa.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openNew() {
    setEditingEpi(null);
    setIsEditing(true);
    setShowBaixa(false);
    setForm(emptyEpi);
    setDialogOpen(true);
  }

  function openView(epi: Epi) {
    setEditingEpi(epi);
    setIsEditing(false);
    setShowBaixa(false);
    setForm({ ...epi });
    setDialogOpen(true);
  }

  async function handleSave() {
    const dbRow = {
      descricao: form.descricao,
      marca: form.marca,
      numero_ca: form.numeroCa,
      data_compra: form.dataCompra || null,
      data_vencimento: form.dataVencimento || null,
      motivo_baixa: form.motivoBaixa,
      status: form.status,
      data_baixa: form.dataBaixa || null,
    };

    if (editingEpi) {
      const { error } = await (supabase as any).from("epis").update(dbRow).eq("id", editingEpi.id);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const newId = generateNextId(epis as unknown as Bem[]);
      const { error } = await (supabase as any).from("epis").insert({ ...dbRow, id: newId, status: "Ativo" });
      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        return;
      }
    }
    setDialogOpen(false);
    fetchAll();
  }

  async function handleBaixar() {
    if (!editingEpi) return;
    const hoje = new Date().toISOString().split("T")[0];
    await (supabase as any).from("epis").update({
      status: "Baixado",
      data_baixa: hoje,
      motivo_baixa: form.motivoBaixa,
    }).eq("id", editingEpi.id);
    setDialogOpen(false);
    fetchAll();
  }

  async function handleReverterBaixa() {
    if (!editingEpi) return;
    await (supabase as any).from("epis").update({
      status: "Ativo",
      data_baixa: null,
      motivo_baixa: "",
    }).eq("id", editingEpi.id);
    setDialogOpen(false);
    fetchAll();
  }

  async function handleDeleteEpi() {
    if (!editingEpi) return;
    const { error } = await (supabase as any).from("epis").delete().eq("id", editingEpi.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item excluído com sucesso" });
    }
    setDeleteConfirmOpen(false);
    setDialogOpen(false);
    fetchAll();
  }

  const isViewMode = editingEpi && !isEditing;
  const isCreating = !editingEpi;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">EPIs</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciamento de Equipamentos de Proteção Individual</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEntregaOpen(true)} className="gap-2">
            <Printer size={16} />Imprimir Entrega
          </Button>
          <Button variant="outline" onClick={() => setDevolucaoOpen(true)} className="gap-2">
            <Printer size={16} />Imprimir Devolução
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus size={16} />Novo
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por descrição, ID, marca ou Nº CA..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Marca</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Nº CA</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Data Compra</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Data Vencimento</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} onClick={() => openView(e)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{e.id}</td>
                  <td className="px-4 py-3 font-medium">{e.descricao}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{e.marca}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{e.numeroCa}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{e.dataCompra ? formatDate(e.dataCompra) : "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{e.dataVencimento ? formatDate(e.dataVencimento) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${e.status === "Ativo" ? "bg-accent/15 text-accent border-accent/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum item encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {isCreating ? "Novo EPI" : `EPI #${editingEpi?.id}`}
            </DialogTitle>
          </DialogHeader>

          {isViewMode && editingEpi?.status === "Ativo" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                <Pencil size={14} /> Editar
              </Button>
              <Button variant="destructive" size="sm" className="gap-1" onClick={() => setShowBaixa(!showBaixa)}>
                <ArrowDownCircle size={14} /> Baixar
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 size={14} /> Excluir
              </Button>
            </div>
          )}

          {isViewMode && editingEpi?.status === "Baixado" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-accent border-accent/30 hover:bg-accent/10" onClick={handleReverterBaixa}>
                <RotateCcw size={14} /> Reverter Baixa
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 size={14} /> Excluir
              </Button>
            </div>
          )}

          {isViewMode && showBaixa && (
            <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <Label>Motivo da Baixa</Label>
              <Textarea value={form.motivoBaixa} onChange={(e) => setForm({ ...form, motivoBaixa: e.target.value })} placeholder="Descreva o motivo da baixa..." rows={3} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBaixa(false)}>Cancelar</Button>
                <Button variant="destructive" size="sm" onClick={handleBaixar}>Confirmar Baixa</Button>
              </div>
            </div>
          )}

          {editingEpi?.status === "Baixado" && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
              <span className="font-medium text-destructive">Item Baixado</span>
              {editingEpi.dataBaixa && (<span className="text-muted-foreground ml-2">em {formatDate(editingEpi.dataBaixa)}</span>)}
              {editingEpi.motivoBaixa && (<p className="text-muted-foreground mt-1">Motivo: {editingEpi.motivoBaixa}</p>)}
            </div>
          )}

          <div className="space-y-4 mt-2">
            <div>
              <Label>Descrição do Item</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} disabled={!!isViewMode} />
            </div>
            <div>
              <Label>Marca</Label>
              <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} disabled={!!isViewMode} />
            </div>
            <div>
              <Label>Número do CA</Label>
              <Input value={form.numeroCa} onChange={(e) => setForm({ ...form, numeroCa: e.target.value })} disabled={!!isViewMode} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data da Compra</Label>
                <Input type="date" value={form.dataCompra} onChange={(e) => setForm({ ...form, dataCompra: e.target.value })} disabled={!!isViewMode} />
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input type="date" value={form.dataVencimento || ""} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value || null })} disabled={!!isViewMode} />
              </div>
            </div>

            {(isEditing || isCreating) && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GenericEntregaDialog
        open={entregaOpen}
        onOpenChange={setEntregaOpen}
        categoriasPermitidas={categoriasPermitidas}
        setoresPermitidos={setoresPermitidos}
        itemTable="epis"
        entregaTable="epis_entregas"
        title="Imprimir Entrega de EPIs"
        pdfTitle="FICHA DE ENTREGA DE EPIs"
        pdfFilename="entrega_epis"
      />

      <GenericDevolucaoDialog
        open={devolucaoOpen}
        onOpenChange={setDevolucaoOpen}
        itemTable="epis"
        entregaTable="epis_entregas"
        title="Devolução de EPIs"
        pdfTitle="FICHA DE DEVOLUÇÃO DE EPIs"
        pdfFilename="devolucao_epis"
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir EPI #{editingEpi?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEpi} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
