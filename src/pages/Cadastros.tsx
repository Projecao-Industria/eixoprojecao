import { useState } from "react";
import { Plus, Trash2, Building2, Tag } from "lucide-react";
import { CATEGORIAS, SETORES } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Cadastros() {
  const [categorias, setCategorias] = useState<string[]>([...CATEGORIAS]);
  const [setores, setSetores] = useState<string[]>([...SETORES]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoSetor, setNovoSetor] = useState("");

  function addCategoria() {
    if (!novaCategoria.trim() || categorias.includes(novaCategoria.trim())) return;
    setCategorias([...categorias, novaCategoria.trim()]);
    setNovaCategoria("");
  }

  function removeCategoria(c: string) {
    setCategorias(categorias.filter((x) => x !== c));
  }

  function addSetor() {
    if (!novoSetor.trim() || setores.includes(novoSetor.trim())) return;
    setSetores([...setores, novoSetor.trim()]);
    setNovoSetor("");
  }

  function removeSetor(s: string) {
    setSetores(setores.filter((x) => x !== s));
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
            />
            <Button onClick={addCategoria} size="sm" className="gap-1 shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </div>
          <div className="space-y-1.5">
            {categorias.map((c) => (
              <div
                key={c}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group"
              >
                <span className="text-sm font-medium">{c}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCategoria(c)}
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
            />
            <Button onClick={addSetor} size="sm" className="gap-1 shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </div>
          <div className="space-y-1.5">
            {setores.map((s) => (
              <div
                key={s}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group"
              >
                <span className="text-sm font-medium">{s}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeSetor(s)}
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
