import { useState, useEffect } from "react";
import { Plus, User, Shield, Settings, Wrench, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  type Usuario,
  type PerfilUsuario,
  type Categoria,
  type Setor,
} from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const perfilIcons: Record<PerfilUsuario, typeof Shield> = {
  Diretor: Shield,
  Gestor: Settings,
  Manutenção: Wrench,
};

const perfilColors: Record<PerfilUsuario, string> = {
  Diretor: "bg-primary/15 text-primary border-primary/30",
  Gestor: "bg-accent/15 text-accent border-accent/30",
  Manutenção: "bg-warning/15 text-warning-foreground border-warning/30",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [categoriasDB, setCategoriasDB] = useState<string[]>([]);
  const [setoresDB, setSetoresDB] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUsuarios() {
      const [{ data: profiles }, { data: profCats }, { data: profSets }, { data: categoriasDb }, { data: setoresDb }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("profile_categorias").select("profile_id, categoria_id, categorias(nome)"),
        supabase.from("profile_setores").select("profile_id, setor_id, setores(nome)"),
        supabase.from("categorias").select("id, nome"),
        supabase.from("setores").select("id, nome").order("nome"),
    ]);
      if (categoriasDb) setCategoriasDB(categoriasDb.map((c: any) => c.nome));
      if (setoresDb) setSetoresDB(setoresDb.map((s: any) => s.nome));
      if (profiles) {
        const mapped: Usuario[] = profiles.map((p: any) => {
          const cats = (profCats || [])
            .filter((pc: any) => pc.profile_id === p.id)
            .map((pc: any) => pc.categorias?.nome)
            .filter(Boolean) as Categoria[];
          const sets = (profSets || [])
            .filter((ps: any) => ps.profile_id === p.id)
            .map((ps: any) => ps.setores?.nome)
            .filter(Boolean) as Setor[];
          return {
            id: p.id,
            nome: p.nome,
            email: p.email,
            perfil: p.perfil as PerfilUsuario,
            categorias: cats,
            setores: sets,
          };
        });
        setUsuarios(mapped);
      }
    }
    fetchUsuarios();
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const emptyForm: Omit<Usuario, "id"> = {
    nome: "",
    email: "",
    perfil: "Manutenção",
    categorias: [],
    setores: [],
  };

  const [form, setForm] = useState<Omit<Usuario, "id">>(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setPassword("");
    setShowPassword(false);
    setDialogOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({ ...u });
    setPassword("");
    setShowPassword(false);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (editing) {
      setSaving(true);
      try {
        // Update profile
        await supabase.from("profiles").update({ nome: form.nome, perfil: form.perfil }).eq("id", editing.id);

        // Update categorias
        await supabase.from("profile_categorias").delete().eq("profile_id", editing.id);
        const { data: categoriasDb } = await supabase.from("categorias").select("id, nome");
        if (form.categorias.length > 0 && categoriasDb) {
          const catRows = form.categorias
            .map((catNome) => {
              const found = categoriasDb.find((c) => c.nome === catNome);
              return found ? { profile_id: editing.id, categoria_id: found.id } : null;
            })
            .filter(Boolean);
          if (catRows.length > 0) {
            await supabase.from("profile_categorias").insert(catRows as any);
          }
        }

        // Update setores
        await supabase.from("profile_setores").delete().eq("profile_id", editing.id);
        const { data: setoresDb } = await supabase.from("setores").select("id, nome");
        if (form.setores.length > 0 && setoresDb) {
          const setRows = form.setores
            .map((setNome) => {
              const found = setoresDb.find((s) => s.nome === setNome);
              return found ? { profile_id: editing.id, setor_id: found.id } : null;
            })
            .filter(Boolean);
          if (setRows.length > 0) {
            await supabase.from("profile_setores").insert(setRows as any);
          }
        }

        setUsuarios((prev) =>
          prev.map((u) => (u.id === editing.id ? { ...form, id: editing.id } : u))
        );
        toast({ title: "Usuário atualizado com sucesso" });
        setDialogOpen(false);
      } catch (err: any) {
        toast({ title: err.message || "Erro ao atualizar", variant: "destructive" });
      } finally {
        setSaving(false);
      }
      return;
    }

    // New user — create via edge function
    if (!password || password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: { nome: form.nome, email: form.email, password, perfil: form.perfil },
      });

      if (res.error || res.data?.error) {
        toast({ title: res.data?.error || "Erro ao criar usuário", variant: "destructive" });
        return;
      }

      const newId = res.data.user?.id;
      if (!newId) {
        toast({ title: "Erro: ID do usuário não retornado", variant: "destructive" });
        return;
      }

      // Save categorias and setores for the new user
      const { data: categoriasDb } = await supabase.from("categorias").select("id, nome");
      const { data: setoresDb } = await supabase.from("setores").select("id, nome");

      if (form.categorias.length > 0 && categoriasDb) {
        const catRows = form.categorias
          .map((catNome) => {
            const found = categoriasDb.find((c) => c.nome === catNome);
            return found ? { profile_id: newId, categoria_id: found.id } : null;
          })
          .filter(Boolean);
        if (catRows.length > 0) {
          await supabase.from("profile_categorias").insert(catRows as any);
        }
      }

      if (form.setores.length > 0 && setoresDb) {
        const setRows = form.setores
          .map((setNome) => {
            const found = setoresDb.find((s) => s.nome === setNome);
            return found ? { profile_id: newId, setor_id: found.id } : null;
          })
          .filter(Boolean);
        if (setRows.length > 0) {
          await supabase.from("profile_setores").insert(setRows as any);
        }
      }

      setUsuarios((prev) => [...prev, { ...form, id: newId }]);
      toast({ title: "Usuário criado com sucesso" });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: err.message || "Erro ao criar usuário", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`Tem certeza que deseja excluir ${editing.nome}?`)) return;

    setDeleting(true);
    try {
      const res = await supabase.functions.invoke("delete-user", {
        body: { userId: editing.id },
      });

      if (res.error || res.data?.error) {
        toast({ title: res.data?.error || "Erro ao excluir usuário", variant: "destructive" });
        return;
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== editing.id));
      toast({ title: "Usuário excluído com sucesso" });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: err.message || "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  function toggleCategoria(cat: Categoria) {
    setForm((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }));
  }

  function toggleSetor(setor: Setor) {
    setForm((prev) => ({
      ...prev,
      setores: prev.setores.includes(setor)
        ? prev.setores.filter((s) => s !== setor)
        : [...prev.setores, setor],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerenciamento de perfis e permissões
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={16} />
          Novo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usuarios.map((u) => {
          const Icon = perfilIcons[u.perfil];
          return (
            <div
              key={u.id}
              onClick={() => openEdit(u)}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${perfilColors[u.perfil]}`}
                >
                  <Icon size={12} />
                  {u.perfil}
                </span>
              </div>
              {u.perfil === "Manutenção" && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Categorias: {u.categorias.join(", ") || "Nenhuma"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Setores: {u.setores.join(", ") || "Nenhum"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {!editing && (
              <div>
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <Label>Perfil</Label>
              <Select
                value={form.perfil}
                onValueChange={(v) => {
                  const perfil = v as PerfilUsuario;
                  setForm({
                    ...form,
                    perfil,
                    categorias: perfil !== "Manutenção" ? [...CATEGORIAS] : form.categorias,
                    setores: perfil !== "Manutenção" ? [...SETORES] : form.setores,
                  });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diretor">Diretor</SelectItem>
                  <SelectItem value="Gestor">Gestor</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.perfil === "Manutenção" && (
              <>
                <div>
                  <Label className="mb-2 block">Categorias</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoriasDB.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={form.categorias.includes(cat as Categoria)}
                          onCheckedChange={() => toggleCategoria(cat as Categoria)}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Setores</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SETORES.map((setor) => (
                      <label
                        key={setor}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={form.setores.includes(setor)}
                          onCheckedChange={() => toggleSetor(setor)}
                        />
                        {setor}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              {editing ? (
                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
                  <Trash2 size={14} />
                  {deleting ? "Excluindo..." : "Excluir"}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Criando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
