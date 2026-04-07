import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/mockData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EntregaRow {
  id: string;
  bem_id: string;
  descricao: string;
  usuario: string;
  nfe: string;
  setor_nome: string;
  gerente_nome: string;
  data_entrega: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTable: string;
  entregaTable: string;
  title: string;
  pdfTitle: string;
  pdfFilename: string;
}

export default function GenericDevolucaoDialog({
  open, onOpenChange, itemTable, entregaTable, title, pdfTitle, pdfFilename,
}: Props) {
  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [gerentes, setGerentes] = useState<string[]>([]);
  const [gerenteFiltro, setGerenteFiltro] = useState<string>("");
  const [dataDevolucao, setDataDevolucao] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      fetchEntregas();
      setSelected(new Set());
      setSearch("");
      setGerenteFiltro("");
      setDataDevolucao(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  async function fetchEntregas() {
    const { data } = await (supabase as any)
      .from(entregaTable)
      .select("id, bem_id, gerente_nome, data_entrega")
      .is("data_devolucao", null)
      .order("data_entrega", { ascending: false });

    if (!data || data.length === 0) {
      setEntregas([]);
      setGerentes([]);
      return;
    }

    const bemIds = [...new Set(data.map((e: any) => e.bem_id))];
    const { data: bensData } = await (supabase as any)
      .from(itemTable)
      .select("id, descricao, usuario, nfe, setores(nome)")
      .in("id", bemIds);

    const bensMap = new Map<string, any>();
    if (bensData) {
      for (const b of bensData) {
        bensMap.set(b.id, b);
      }
    }

    const rows: EntregaRow[] = data.map((e: any) => {
      const bem = bensMap.get(e.bem_id);
      return {
        id: e.id,
        bem_id: e.bem_id,
        descricao: bem?.descricao || "",
        usuario: bem?.usuario || "",
        nfe: bem?.nfe || "",
        setor_nome: bem?.setores?.nome || "",
        gerente_nome: e.gerente_nome,
        data_entrega: e.data_entrega,
      };
    });

    setEntregas(rows);
    const uniqueGerentes = [...new Set(rows.map(r => r.gerente_nome))].filter(Boolean).sort();
    setGerentes(uniqueGerentes);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = entregas.filter(e => {
    if (gerenteFiltro && e.gerente_nome !== gerenteFiltro) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.descricao.toLowerCase().includes(s) || e.bem_id.includes(s) || e.usuario.toLowerCase().includes(s);
    }
    return true;
  });

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(e => e.id)));
    }
  }

  async function handleDevolver() {
    if (selected.size === 0) {
      toast.error("Selecione ao menos um item para devolver.");
      return;
    }

    const selectedItems = entregas.filter(e => selected.has(e.id));
    const gerentesUnicos = new Set(selectedItems.map(e => e.gerente_nome));
    if (gerentesUnicos.size > 1) {
      toast.error("Selecione apenas itens do mesmo gerente responsável.");
      return;
    }

    const ids = selectedItems.map(e => e.id);
    const { error } = await (supabase as any)
      .from(entregaTable)
      .update({ data_devolucao: dataDevolucao })
      .in("id", ids);

    if (error) {
      toast.error("Erro ao registrar devoluções: " + error.message);
      return;
    }

    generatePDF(selectedItems, dataDevolucao);
    toast.success(`${selectedItems.length} item(ns) devolvido(s) com sucesso!`);
    onOpenChange(false);
  }

  function generatePDF(items: EntregaRow[], dataDevolucao: string) {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(pdfTitle, pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RUTA INDÚSTRIA E COMÉRCIO LTDA", margin, y);
    doc.text("DGA INDÚSTRIA E COMÉRCIO LTDA", pageWidth - margin, y, { align: "right" });
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("CNPJ: 07.078.714/0001-61", margin, y);
    doc.text("CNPJ:", pageWidth - margin, y, { align: "right" });
    y += 8;

    const setorNome = items.length > 0 ? items[0].setor_nome : "";
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Setor: ${setorNome}`, margin, y);
    y += 8;

    const tableData = items.map(e => [e.bem_id, e.descricao, e.usuario, e.nfe]);

    autoTable(doc, {
      startY: y,
      head: [["Código", "Descrição", "Usuário", "NFe"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 98, 166], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      theme: "grid",
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const declaracao = "Declaro que os itens acima listados foram devolvidos à empresa nas condições informadas, ficando a empresa responsável por sua conferência e guarda a partir desta data.";
    const lines = doc.splitTextToSize(declaracao, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 8;

    doc.setFontSize(10);
    doc.text(`Data de Devolução: ${formatDate(dataDevolucao)}`, margin, y);
    y += 20;

    const gerenteNome = items[0]?.gerente_nome || "___________________________";
    const sigWidth = (pageWidth - margin * 2 - 20) / 3;
    const sigY = y;

    doc.line(margin, sigY, margin + sigWidth, sigY);
    doc.setFontSize(8);
    doc.text("Assinatura Responsável", margin, sigY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(gerenteNome, margin, sigY + 10);

    const sig2X = margin + sigWidth + 10;
    doc.line(sig2X, sigY, sig2X + sigWidth, sigY);
    doc.setFont("helvetica", "normal");
    doc.text("Resp. Manutenção e Patrimônio", sig2X, sigY + 5);

    const sig3X = sig2X + sigWidth + 10;
    doc.line(sig3X, sigY, sig3X + sigWidth, sigY);
    doc.text("Resp. pela Empresa", sig3X, sigY + 5);

    doc.save(`${pdfFilename}_${dataDevolucao}.pdf`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Gerente Responsável</Label>
              <Select value={gerenteFiltro} onValueChange={(v) => { setGerenteFiltro(v); setSelected(new Set()); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o gerente..." /></SelectTrigger>
                <SelectContent>
                  {gerentes.map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Devolução</Label>
              <Input type="date" value={dataDevolucao} onChange={(e) => setDataDevolucao(e.target.value)} className="w-48" />
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar itens..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {!gerenteFiltro ? (
            <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
              Selecione um gerente responsável para visualizar os itens pendentes de devolução.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 w-10">
                      <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} />
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Setor</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => toggleSelect(e.id)}>
                      <td className="px-3 py-2"><Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} /></td>
                      <td className="px-3 py-2 font-mono text-xs">#{e.bem_id}</td>
                      <td className="px-3 py-2">{e.descricao}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.setor_nome}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.usuario}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(e.data_entrega)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Nenhum item pendente de devolução.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">{selected.size} item(ns) selecionado(s)</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleDevolver} className="gap-2" disabled={!gerenteFiltro}>
                <Printer size={16} />Devolver e Gerar PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
