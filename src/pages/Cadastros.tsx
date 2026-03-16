import { useState, useEffect } from "react";
import { Plus, Trash2, Building2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CategoriaRow { id: string; nome: string }
interface SetorRow { id: string; nome: string }

export default function Cadastros() {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [setores, setSetores] = useState<SetorRow[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoSetor, setNovoSetor] = useState("");

  useEffect(() => {
    fetchCategorias();
    fetchSetores();
  }, []);

  async function fetchCategorias() {
    const { data } = await supabase.from("categorias").select("id, nome").order("nome");
    if (data) setCategorias(data);
  }

  async function fetchSetores() {
    const { data } = await supabase.from("setores").select("id, nome").order("nome");
    if (data) setSetores(data);
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Cadastros</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerenciar categorias e setores do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group"
              >
                <span className="text-sm font-medium">{c.nome}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCategoria(c.id)}
                >
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
              <div
                key={s.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group"
              >
                <span className="text-sm font-medium">{s.nome}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeSetor(s.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
