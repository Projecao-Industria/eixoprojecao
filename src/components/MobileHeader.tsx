import { useState } from "react";
import { Menu, X, LayoutDashboard, Package, Wrench, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/patrimonio", label: "Patrimônio", icon: Package },
  { to: "/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/usuarios", label: "Usuários", icon: Users },
];

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="font-display text-lg font-bold">
          Imobilizado<span className="text-primary">+</span>
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
