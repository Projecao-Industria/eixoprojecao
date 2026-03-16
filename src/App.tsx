import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Patrimonio from "./pages/Patrimonio";
import Manutencao from "./pages/Manutencao";
import Usuarios from "./pages/Usuarios";
import Cadastros from "./pages/Cadastros";
import HistoricoBem from "./pages/HistoricoBem";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold">Eixo<span className="text-primary">.</span></h1>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function DirectorRoute({ children }: { children: React.ReactNode }) {
  const { perfil, loading } = useAuth();
  if (loading) return null;
  if (perfil !== "Diretor") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function NonManutencaoRoute({ children }: { children: React.ReactNode }) {
  const { perfil, loading } = useAuth();
  if (loading) return null;
  if (perfil === "Manutenção") return <Navigate to="/patrimonio" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patrimonio" element={<Patrimonio />} />
              <Route path="/manutencao" element={<Manutencao />} />
              <Route path="/usuarios" element={<DirectorRoute><Usuarios /></DirectorRoute>} />
              <Route path="/cadastros" element={<DirectorRoute><Cadastros /></DirectorRoute>} />
              <Route path="/historico" element={<HistoricoBem />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default App;
