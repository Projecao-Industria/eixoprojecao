import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/mockData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BemRow {
  id: string;
  descricao: string;
  usuario: string;
  nfe: string;
  setor_id: string;
  setor_nome: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriasPermitidas: string[] | null;
  setoresPermitidos: string[] | null;
}

export default function EntregaDialog({ open, onOpenChange, categoriasPermitidas, setoresPermitidos }: Props) {
  const [bens, setBens] = useState<BemRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      fetchBens();
      setSelected(new Set());
      setSearch("");
      setDataEntrega(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  async function fetchBens() {
    let query = supabase
      .from("bens")
      .select("id, descricao, usuario, nfe, setor_id, setores(nome)")
      .eq("status", "Ativo")
      .order("id");

    if (categoriasPermitidas) {
      query = query.in("categoria_id", categoriasPermitidas);
    }
    if (setoresPermitidos) {
      query = query.in("setor_id", setoresPermitidos);
    }

    const { data } = await query;
    if (data) {
      setBens(data.map((b: any) => ({
        id: b.id,
        descricao: b.descricao,
        usuario: b.usuario,
        nfe: b.nfe,
        setor_id: b.setor_id,
        setor_nome: b.setores?.nome || "",
      })));
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(b => b.id)));
    }
  }

  const filtered = bens.filter(b =>
    b.descricao.toLowerCase().includes(search.toLowerCase()) ||
    b.id.includes(search) ||
    b.usuario.toLowerCase().includes(search.toLowerCase())
  );

  async function handleImprimir() {
    if (selected.size === 0) {
      toast({ title: "Selecione ao menos um bem", variant: "destructive" });
      return;
    }

    const selectedBens = bens.filter(b => selected.has(b.id));

    // Check if all selected bens belong to sectors with the same current manager
    const setorIds = [...new Set(selectedBens.map(b => b.setor_id))];

    const { data: vinculosData } = await supabase
      .from("setor_gerentes")
      .select("setor_id, gerente_id, gerentes(nome)")
      .in("setor_id", setorIds)
      .is("data_fim", null);

    const gerentesPorSetor = new Map<string, { id: string; nome: string }>();
    if (vinculosData) {
      for (const v of vinculosData as any[]) {
        gerentesPorSetor.set(v.setor_id, { id: v.gerente_id, nome: v.gerentes?.nome || "" });
      }
    }

    const gerentesUnicos = new Set<string>();
    for (const setorId of setorIds) {
      const g = gerentesPorSetor.get(setorId);
      if (g) gerentesUnicos.add(g.id);
    }

    if (gerentesUnicos.size > 1) {
      toast({
        title: "Não é possível gerar o documento",
        description: "Os bens selecionados pertencem a setores com gerentes diferentes. Selecione bens do mesmo responsável.",
        variant: "destructive",
      });
      return;
    }

    const gerenteNome = gerentesPorSetor.size > 0
      ? [...gerentesPorSetor.values()][0].nome
      : "___________________________";

    generatePDF(selectedBens, gerenteNome, dataEntrega);
    onOpenChange(false);
  }

  function generatePDF(items: BemRow[], gerenteNome: string, dataEntrega: string) {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA DE ENTREGA DE FERRAMENTAS", pageWidth / 2, y, { align: "center" });
    y += 10;

    // Company names side by side
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

    // Table
    const tableData = items.map(b => [b.id, b.descricao, b.usuario, b.nfe]);

    autoTable(doc, {
      startY: y,
      head: [["Código", "Nome do Bem", "Usuário", "NFe"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 98, 166], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      theme: "grid",
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Declaration text
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const declaracao = "Declaro que recebi os itens descritos acima e estou ciente de que sou responsável pela guarda, bom uso e devolução dos mesmos nas condições recebidas, salvo desgaste natural decorrente do uso adequado.";
    const lines = doc.splitTextToSize(declaracao, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 10;

    // Delivery date
    doc.setFontSize(10);
    doc.text(`Data de Entrega: ${formatDate(dataEntrega)}`, margin, y);
    y += 20;

    // Signatures
    const sigWidth = (pageWidth - margin * 2 - 20) / 3;
    const sigY = y;

    // Signature 1 - Gerente
    doc.line(margin, sigY, margin + sigWidth, sigY);
    doc.setFontSize(8);
    doc.text("Assinatura Responsável", margin, sigY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(gerenteNome, margin, sigY + 10);

    // Signature 2 - Manutenção
    const sig2X = margin + sigWidth + 10;
    doc.line(sig2X, sigY, sig2X + sigWidth, sigY);
    doc.setFont("helvetica", "normal");
    doc.text("Resp. Manutenção e Patrimônio", sig2X, sigY + 5);

    // Signature 3 - Empresa
    const sig3X = sig2X + sigWidth + 10;
    doc.line(sig3X, sigY, sig3X + sigWidth, sigY);
    doc.text("Resp. pela Empresa", sig3X, sigY + 5);

    doc.save(`entrega_ferramentas_${dataEntrega}.pdf`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Imprimir Entrega de Ferramentas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data de Entrega</Label>
            <Input
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar bens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Setor</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => toggleSelect(b.id)}
                  >
                    <td className="px-3 py-2">
                      <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">#{b.id}</td>
                    <td className="px-3 py-2">{b.descricao}</td>
                    <td className="px-3 py-2 text-muted-foreground">{b.setor_nome}</td>
                    <td className="px-3 py-2 text-muted-foreground">{b.usuario}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Nenhum bem encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} bem(ns) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleImprimir} className="gap-2">
                <Printer size={16} />
                Gerar PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
