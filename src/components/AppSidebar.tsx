import { LayoutDashboard, Package, Wrench, Users, User, Settings, History, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { currentUser } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const links = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/patrimonio", label: "Patrimônio", icon: Package },
  { to: "/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/cadastros", label: "Cadastros", icon: Settings },
];

export default function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-display text-lg font-bold text-sidebar-primary-foreground tracking-tight">
          Eixo<span className="text-sidebar-primary">.</span>
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Patrimônio & Manutenção</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <User size={14} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{currentUser.nome}</p>
            <p className="text-xs text-sidebar-foreground/50">{currentUser.perfil}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast({ title: "Sessão encerrada" });
            window.location.href = "/";
          }}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
