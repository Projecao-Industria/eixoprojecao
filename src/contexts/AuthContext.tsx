import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type PerfilUsuario = Database["public"]["Enums"]["perfil_usuario"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  perfil: PerfilUsuario | null;
  nome: string | null;
  categoriasPermitidas: string[] | null; // null = all access
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  perfil: null,
  nome: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [nome, setNome] = useState<string | null>(null);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("perfil, nome")
      .eq("id", userId)
      .single();
    setPerfil(data?.perfil ?? null);
    setNome(data?.nome ?? null);
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setPerfil(null);
          setNome(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, perfil, nome, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
