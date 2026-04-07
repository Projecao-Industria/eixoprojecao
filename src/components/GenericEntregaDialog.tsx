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
  itemTable: string;
  entregaTable: string;
  title: string;
  pdfTitle: string;
  pdfFilename: string;
}

export default function GenericEntregaDialog({
  open, onOpenChange, categoriasPermitidas, setoresPermitidos,
  itemTable, entregaTable, title, pdfTitle, pdfFilename,
}: Props) {
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
    let query = (supabase as any)
      .from(itemTable)
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
      toast({ title: "Selecione ao menos um item", variant: "destructive" });
      return;
    }

    const selectedBens = bens.filter(b => selected.has(b.id));

    const { data: activeEntregas } = await (supabase as any)
      .from(entregaTable)
      .select("bem_id")
      .in("bem_id", selectedBens.map(b => b.id))
      .is("data_devolucao", null);

    if (activeEntregas && activeEntregas.length > 0) {
      const activeIds = [...new Set(activeEntregas.map((e: any) => e.bem_id))];
      const activeDescriptions = selectedBens
        .filter(b => activeIds.includes(b.id))
        .map(b => `#${b.id} - ${b.descricao}`);
      toast({
        title: "Itens já entregues sem devolução",
        description: `Os seguintes itens já possuem entrega ativa:\n${activeDescriptions.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

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
        description: "Os itens selecionados pertencem a setores com gerentes diferentes.",
        variant: "destructive",
      });
      return;
    }

    const gerenteNome = gerentesPorSetor.size > 0
      ? [...gerentesPorSetor.values()][0].nome
      : "___________________________";

    const entregas = selectedBens.map(b => ({
      bem_id: b.id,
      gerente_nome: gerenteNome,
      data_entrega: dataEntrega,
    }));

    const { error: insertError } = await (supabase as any).from(entregaTable).insert(entregas);
    if (insertError) {
      toast({ title: "Erro ao registrar entrega", description: insertError.message, variant: "destructive" });
      return;
    }

    generatePDF(selectedBens, gerenteNome, dataEntrega);
    onOpenChange(false);
  }

  function generatePDF(items: BemRow[], gerenteNome: string, dataEntrega: string) {
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

    const tableData = items.map(b => [b.id, b.descricao, b.usuario, b.nfe]);

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
    const declaracao = "Declaro que, como responsável pelo setor, recebi da empresa os itens acima, comprometendo-me com sua guarda, uso adequado e conservação, responsabilizando-me por qualquer dano, perda ou extravio decorrente de mau uso ou negligência.\nEstou ciente de que, em tais situações, autorizo a empresa a realizar o desconto do valor de reposição ou reparo diretamente conforme regulamento interno.\n\nDeclaro ainda que, caso aplicado, a coluna usuário serve apenas para controle interno de qual colaborador faz mais uso da ferramenta no dia-a-dia, não isentando-me da responsabilidade de zelo dos bens entregues.\n\nComprometo-me ainda a devolver todos os itens nas mesmas condições em que os recebi, salvo desgaste natural decorrente do uso adequado, sempre que solicitado pelos meus superiores.";
    const lines = doc.splitTextToSize(declaracao, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 8;

    doc.setFontSize(10);
    doc.text(`Data de Entrega: ${formatDate(dataEntrega)}`, margin, y);
    y += 20;

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

    doc.save(`${pdfFilename}_${dataEntrega}.pdf`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data de Entrega</Label>
            <Input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className="w-48" />
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar itens..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

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
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => toggleSelect(b.id)}>
                    <td className="px-3 py-2"><Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} /></td>
                    <td className="px-3 py-2 font-mono text-xs">#{b.id}</td>
                    <td className="px-3 py-2">{b.descricao}</td>
                    <td className="px-3 py-2 text-muted-foreground">{b.setor_nome}</td>
                    <td className="px-3 py-2 text-muted-foreground">{b.usuario}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Nenhum item encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">{selected.size} item(ns) selecionado(s)</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleImprimir} className="gap-2"><Printer size={16} />Gerar PDF</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
