import { useState } from "react";
import { Menu, X, LayoutDashboard, Package, Wrench, Users, Settings, History } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const allLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, directorOnly: false, hideForManutencao: true },
  { to: "/patrimonio", label: "Patrimônio", icon: Package, directorOnly: false, hideForManutencao: false },
  { to: "/manutencao", label: "Manutenção", icon: Wrench, directorOnly: false, hideForManutencao: false },
  { to: "/historico", label: "Histórico", icon: History, directorOnly: false, hideForManutencao: false },
  { to: "/usuarios", label: "Usuários", icon: Users, directorOnly: true, hideForManutencao: false },
  { to: "/cadastros", label: "Cadastros", icon: Settings, directorOnly: true, hideForManutencao: false },
];

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { perfil } = useAuth();

  const links = allLinks.filter((link) => !link.directorOnly || perfil === "Diretor");

  return (
    <div className="md:hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="font-display text-lg font-bold">
          Eixo<span className="text-primary">.</span>
        </h1>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-muted">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open && (
        <nav className="bg-card border-b border-border p-2 space-y-1 animate-fade-in">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}