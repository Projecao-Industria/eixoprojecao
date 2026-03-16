import { useState, useEffect, useMemo } from "react";
import { Search, CalendarDays, Package, CheckCircle2, Clock, PlayCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/mockData";
import { toast } from "sonner";

type Frequencia = "Semanal" | "Quinzenal" | "Mensal" | "Trimestral";

interface Agenda {
  id: string;
  bem_id: string;
  descricao: string;
  frequencia: Frequencia;
  primeira_data: string;
}

interface BemSimple {
  id: string;
  descricao: string;
}

function calcNextDate(primeiraData: string, frequencia: Frequencia): Date {
  const start = new Date(primeiraData + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let days = 7;
  if (frequencia === "Quinzenal") days = 14;
  else if (frequencia === "Mensal") days = 30;
  else if (frequencia === "Trimestral") days = 90;

  let next = new Date(start);
  while (next < now) {
    next.setDate(next.getDate() + days);
  }
  return next;
}

function isInCurrentWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return date >= startOfWeek && date <= endOfWeek;
}

export default function CalendarioManutencoes() {
  const navigate = useNavigate();
  const { categoriasPermitidas, setoresPermitidos } = useAuth();
  const [bemId, setBemId] = useState("");
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [bens, setBens] = useState<BemSimple[]>([]);
  const [manutencoesDates, setManutencoesDates] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  // Form for creating new agenda
  const [formDescricao, setFormDescricao] = useState("");
  const [formFrequencia, setFormFrequencia] = useState<Frequencia>("Mensal");
  const [formPrimeiraData, setFormPrimeiraData] = useState("");

  const [foundBem, setFoundBem] = useState<BemSimple | null>(null);

  // Fetch bens
  useEffect(() => {
    async function fetchBens() {
      let q = supabase.from("bens").select("id, descricao, categoria_id").eq("status", "Ativo").order("id");
      if (categoriasPermitidas) {
        q = q.in("categoria_id", categoriasPermitidas);
      }
      if (setoresPermitidos) {
        q = (q as any).in("setor_id", setoresPermitidos);
      }
      const { data } = await q;
      setBens((data || []).map((b: any) => ({ id: b.id, descricao: b.descricao })));
    }
    fetchBens();
  }, [categoriasPermitidas, setoresPermitidos]);

  // Fetch all agendas
  useEffect(() => {
    fetchAgendas();
  }, []);

  async function fetchAgendas() {
    const { data } = await supabase.from("manutencao_agenda").select("*").order("created_at");
    setAgendas((data || []) as Agenda[]);

    // Fetch maintenance records to check status
    const { data: manData } = await supabase.from("manutencoes").select("bem_id, data, descricao").eq("tipo", "Preventiva");
    const dateMap: Record<string, string[]> = {};
    (manData || []).forEach((m: any) => {
      const key = `${m.bem_id}_${m.descricao}`;
      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push(m.data);
    });
    setManutencoesDates(dateMap);
  }

  // Lookup bem when bemId changes
  useEffect(() => {
    if (!bemId) {
      setFoundBem(null);
      return;
    }
    const b = bens.find((b) => b.id === bemId);
    setFoundBem(b || null);
  }, [bemId, bens]);

  // Agendas for the searched bem
  const bemAgendas = useMemo(() => {
    if (!bemId || !foundBem) return [];
    return agendas.filter((a) => a.bem_id === bemId);
  }, [bemId, foundBem, agendas]);

  // Weekly scheduled maintenances (when no bem is searched)
  const weeklyItems = useMemo(() => {
    if (bemId) return [];
    return agendas
      .map((a) => {
        const bem = bens.find((b) => b.id === a.bem_id);
        const nextDate = calcNextDate(a.primeira_data, a.frequencia);
        const key = `${a.bem_id}_${a.descricao}`;
        const dates = manutencoesDates[key] || [];
        const nextDateStr = nextDate.toISOString().split("T")[0];
        const realizado = dates.includes(nextDateStr);
        return {
          ...a,
          bemDescricao: bem?.descricao || a.bem_id,
          nextDate,
          nextDateStr,
          realizado,
          inWeek: isInCurrentWeek(nextDate),
        };
      })
      .filter((item) => item.inWeek)
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }, [agendas, bens, manutencoesDates, bemId]);

  async function handleCreateAgenda() {
    if (!foundBem || !formDescricao || !formPrimeiraData) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    await supabase.from("manutencao_agenda").insert({
      bem_id: foundBem.id,
      descricao: formDescricao,
      frequencia: formFrequencia,
      primeira_data: formPrimeiraData,
    });
    setFormDescricao("");
    setFormPrimeiraData("");
    await fetchAgendas();
    setLoading(false);
    toast.success("Manutenção agendada com sucesso!");
  }

  async function handleDeleteAgenda(id: string) {
    await supabase.from("manutencao_agenda").delete().eq("id", id);
    await fetchAgendas();
    toast.success("Agendamento removido.");
  }

  function handleRealizarManutencao(item: { bem_id: string; descricao: string; nextDateStr: string }) {
    const params = new URLSearchParams({
      bem: item.bem_id,
      descricao: item.descricao,
      data: item.nextDateStr,
      tipo: "Preventiva",
    });
    navigate(`/manutencao?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Calendário de Manutenções</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Programe manutenções preventivas e acompanhe os próximos agendamentos
        </p>
      </div>

      {/* Search Bem */}
      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
        <Label className="text-sm font-medium mb-2 block">Número do Bem</Label>
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Informe o número do bem (ex: 00001)..."
            value={bemId}
            onChange={(e) => setBemId(e.target.value.replace(/\D/g, ""))}
            className="pl-9 max-w-sm"
          />
        </div>
      </div>

      {/* If bem found, show agenda form + existing agendas */}
      {bemId && foundBem && (
        <div className="animate-fade-in space-y-4">
          {/* Create new agenda */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={18} className="text-primary" />
              <h2 className="font-display font-semibold">Agendar Manutenção Preventiva</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Bem: <span className="font-medium text-foreground">#{foundBem.id} — {foundBem.descricao}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tipo da Manutenção</Label>
                <Input
                  placeholder="Ex: Troca de óleo"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                />
              </div>
              <div>
                <Label>Frequência</Label>
                <Select value={formFrequencia} onValueChange={(v) => setFormFrequencia(v as Frequencia)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Primeira vez realizada</Label>
                <Input
                  type="date"
                  value={formPrimeiraData}
                  onChange={(e) => setFormPrimeiraData(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleCreateAgenda} disabled={loading} className="mt-4 gap-2">
              <CalendarDays size={16} />
              Agendar
            </Button>
          </div>

          {/* Existing agendas for this bem */}
          {bemAgendas.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="font-display font-semibold text-sm">Manutenções Agendadas para este Bem</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Frequência</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Primeira Data</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Próxima</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bemAgendas.map((a) => {
                      const nextDate = calcNextDate(a.primeira_data, a.frequencia);
                      return (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{a.descricao}</td>
                          <td className="px-4 py-3 text-muted-foreground">{a.frequencia}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(a.primeira_data)}</td>
                          <td className="px-4 py-3 font-medium">{formatDate(nextDate.toISOString().split("T")[0])}</td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAgenda(a.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {bemId && !foundBem && (
        <div className="bg-card rounded-xl border border-border p-8 text-center animate-fade-in">
          <Package size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum bem encontrado com o número informado.</p>
        </div>
      )}

      {/* Weekly view when no bem is searched */}
      {!bemId && (
        <div className="animate-fade-in">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h3 className="font-display font-semibold text-sm">Manutenções Programadas para a Semana</h3>
            </div>
            {weeklyItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhuma manutenção programada para esta semana.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bem</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo da Manutenção</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Frequência</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data Prevista</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyItems.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium">{item.bemDescricao}</span>
                          <span className="text-xs text-muted-foreground ml-1">#{item.bem_id}</span>
                        </td>
                        <td className="px-4 py-3 font-medium">{item.descricao}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.frequencia}</td>
                        <td className="px-4 py-3">{formatDate(item.nextDateStr)}</td>
                        <td className="px-4 py-3 text-center">
                          {item.realizado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-accent/15 text-accent border-accent/30">
                              <CheckCircle2 size={12} /> Realizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-warning/15 text-warning-foreground border-warning/30">
                              <Clock size={12} /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!item.realizado && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => handleRealizarManutencao(item)}
                            >
                              <PlayCircle size={14} /> Realizar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

