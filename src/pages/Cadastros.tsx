import { useState, useEffect } from "react";
import { Plus, Trash2, Building2, Tag, UserCheck, Link2, CalendarIcon, X, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CategoriaRow { id: string; nome: string }
interface SetorRow { id: string; nome: string }
interface GerenteRow { id: string; nome: string; cpf: string }
interface SetorGerenteRow {
  id: string;
  setor_id: string;
  gerente_id: string;
  data_inicio: string;
  data_fim: string | null;
  gerentes?: { nome: string } | null;
}

export default function Cadastros() {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [setores, setSetores] = useState<SetorRow[]>([]);
  const [gerentes, setGerentes] = useState<GerenteRow[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoSetor, setNovoSetor] = useState("");
  const [novoGerenteNome, setNovoGerenteNome] = useState("");
  const [novoGerenteCpf, setNovoGerenteCpf] = useState("");

  // Current gerente per setor
  const [gerenteAtualPorSetor, setGerenteAtualPorSetor] = useState<Record<string, string>>({});

  // Vincular gerente dialog
  const [vinculoOpen, setVinculoOpen] = useState(false);
  const [vinculoSetorId, setVinculoSetorId] = useState("");
  const [vinculoSetorNome, setVinculoSetorNome] = useState("");
  const [vinculoGerenteId, setVinculoGerenteId] = useState("");
  const [vinculoDataInicio, setVinculoDataInicio] = useState<Date | undefined>();
  const [vinculoDataFim, setVinculoDataFim] = useState<Date | undefined>();
  const [vinculosSetor, setVinculosSetor] = useState<SetorGerenteRow[]>([]);

  // Edit data_fim
  const [editingVinculoId, setEditingVinculoId] = useState<string | null>(null);
  const [editDataFim, setEditDataFim] = useState<Date | undefined>();

  useEffect(() => {
    fetchCategorias();
    fetchSetores();
    fetchGerentes();
    fetchGerentesAtuais();
  }, []);

  async function fetchCategorias() {
    const { data } = await supabase.from("categorias").select("id, nome").order("nome");
    if (data) setCategorias(data);
  }

  async function fetchSetores() {
    const { data } = await supabase.from("setores").select("id, nome").order("nome");
    if (data) setSetores(data);
  }

  async function fetchGerentes() {
    const { data } = await supabase.from("gerentes").select("id, nome, cpf").order("nome");
    if (data) setGerentes(data);
  }

  async function fetchGerentesAtuais() {
    const { data } = await supabase
      .from("setor_gerentes")
      .select("setor_id, gerentes(nome)")
      .is("data_fim", null);
    if (data) {
      const map: Record<string, string> = {};
      for (const v of data as any[]) {
        map[v.setor_id] = v.gerentes?.nome || "";
      }
      setGerenteAtualPorSetor(map);
    }
  }

  async function fetchVinculosSetor(setorId: string) {
    const { data } = await supabase
      .from("setor_gerentes")
      .select("id, setor_id, gerente_id, data_inicio, data_fim, gerentes(nome)")
      .eq("setor_id", setorId)
      .order("data_inicio", { ascending: false });
    if (data) setVinculosSetor(data as unknown as SetorGerenteRow[]);
  }

  // Categorias CRUD
  async function addCategoria() {
    const nome = novaCategoria.trim();
    if (!nome || categorias.some((c) => c.nome === nome)) return;
    const { error } = await supabase.from("categorias").insert({ nome });
    if (error) {
      toast({ title: "Erro ao adicionar categoria", description: error.message, variant: "destructive" });
      return;
    }
    setNovaCategoria("");
    fetchCategorias();
  }

  async function removeCategoria(id: string) {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover categoria", description: error.message, variant: "destructive" });
      return;
    }
    fetchCategorias();
  }

  // Setores CRUD
  async function addSetor() {
    const nome = novoSetor.trim();
    if (!nome || setores.some((s) => s.nome === nome)) return;
    const { error } = await supabase.from("setores").insert({ nome });
    if (error) {
      toast({ title: "Erro ao adicionar setor", description: error.message, variant: "destructive" });
      return;
    }
    setNovoSetor("");
    fetchSetores();
  }

  async function removeSetor(id: string) {
    const { error } = await supabase.from("setores").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover setor", description: error.message, variant: "destructive" });
      return;
    }
    fetchSetores();
  }

  // Gerentes CRUD
  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  async function addGerente() {
    const nome = novoGerenteNome.trim();
    const cpf = novoGerenteCpf.trim();
    if (!nome) return;
    const { error } = await supabase.from("gerentes").insert({ nome, cpf });
    if (error) {
      toast({ title: "Erro ao adicionar gerente", description: error.message, variant: "destructive" });
      return;
    }
    setNovoGerenteNome("");
    setNovoGerenteCpf("");
    fetchGerentes();
  }

  async function removeGerente(id: string) {
    const { error } = await supabase.from("gerentes").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover gerente", description: error.message, variant: "destructive" });
      return;
    }
    fetchGerentes();
  }

  // Vincular gerente
  function openVinculo(setor: SetorRow) {
    setVinculoSetorId(setor.id);
    setVinculoSetorNome(setor.nome);
    setVinculoGerenteId("");
    setVinculoDataInicio(undefined);
    setVinculoDataFim(undefined);
    setVinculoOpen(true);
    fetchVinculosSetor(setor.id);
  }

  async function saveVinculo() {
    if (!vinculoGerenteId || !vinculoDataInicio) {
      toast({ title: "Preencha o gerente e a data de início", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("setor_gerentes").insert({
      setor_id: vinculoSetorId,
      gerente_id: vinculoGerenteId,
      data_inicio: format(vinculoDataInicio, "yyyy-MM-dd"),
      data_fim: vinculoDataFim ? format(vinculoDataFim, "yyyy-MM-dd") : null,
    });
    if (error) {
      toast({ title: "Erro ao vincular gerente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Gerente vinculado com sucesso" });
    setVinculoGerenteId("");
    setVinculoDataInicio(undefined);
    setVinculoDataFim(undefined);
    fetchVinculosSetor(vinculoSetorId);
  }

  async function removeVinculo(id: string) {
    await supabase.from("setor_gerentes").delete().eq("id", id);
    fetchVinculosSetor(vinculoSetorId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Cadastros</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerenciar categorias, setores e gerentes do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Categorias */}
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={18} className="text-primary" />
            <h2 className="font-display font-semibold text-lg">Categorias</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nova categoria..."
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategoria()}
              maxLength={100}
            />
            <Button onClick={addCategoria} size="sm" className="gap-1 shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </div>
          <div className="space-y-1.5">
            {categorias.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group">
                <span className="text-sm font-medium">{c.nome}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCategoria(c.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Setores */}
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-primary" />
            <h2 className="font-display font-semibold text-lg">Setores</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Novo setor..."
              value={novoSetor}
              onChange={(e) => setNovoSetor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSetor()}
              maxLength={100}
            />
            <Button onClick={addSetor} size="sm" className="gap-1 shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </div>
          <div className="space-y-1.5">
            {setores.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group">
                <span className="text-sm font-medium">{s.nome}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs gap-1" onClick={() => openVinculo(s)}>
                    <Link2 size={12} /> Gerente
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeSetor(s.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gerentes */}
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={18} className="text-primary" />
            <h2 className="font-display font-semibold text-lg">Gerentes</h2>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            <Input
              placeholder="Nome completo..."
              value={novoGerenteNome}
              onChange={(e) => setNovoGerenteNome(e.target.value)}
              maxLength={150}
            />
            <div className="flex gap-2">
              <Input
                placeholder="CPF..."
                value={novoGerenteCpf}
                onChange={(e) => setNovoGerenteCpf(formatCpf(e.target.value))}
                maxLength={14}
              />
              <Button onClick={addGerente} size="sm" className="gap-1 shrink-0">
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            {gerentes.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group">
                <div>
                  <span className="text-sm font-medium">{g.nome}</span>
                  {g.cpf && <span className="text-xs text-muted-foreground ml-2">{g.cpf}</span>}
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeGerente(g.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog Vincular Gerente */}
      <Dialog open={vinculoOpen} onOpenChange={setVinculoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Gerente — {vinculoSetorNome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Novo vínculo */}
            <div className="space-y-3 border border-border rounded-lg p-4">
              <Select value={vinculoGerenteId} onValueChange={setVinculoGerenteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gerente" />
                </SelectTrigger>
                <SelectContent>
                  {gerentes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !vinculoDataInicio && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {vinculoDataInicio ? format(vinculoDataInicio, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={vinculoDataInicio} onSelect={setVinculoDataInicio} locale={ptBR} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data Fim (opcional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !vinculoDataFim && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {vinculoDataFim ? format(vinculoDataFim, "dd/MM/yyyy") : "Atual"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={vinculoDataFim} onSelect={setVinculoDataFim} locale={ptBR} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button onClick={saveVinculo} size="sm" className="w-full gap-1">
                <Plus size={14} /> Vincular
              </Button>
            </div>

            {/* Lista de vínculos existentes */}
            {vinculosSetor.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-muted-foreground">Histórico de gerentes</h3>
                {vinculosSetor.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group">
                    <div className="text-sm">
                      <span className="font-medium">{(v.gerentes as any)?.nome || "—"}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {format(new Date(v.data_inicio + "T00:00:00"), "dd/MM/yyyy")}
                        {" — "}
                        {v.data_fim ? format(new Date(v.data_fim + "T00:00:00"), "dd/MM/yyyy") : "Atual"}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVinculo(v.id)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
