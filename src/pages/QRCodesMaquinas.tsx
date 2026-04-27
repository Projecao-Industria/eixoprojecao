import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Search, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Bem } from "@/lib/mockData";

export default function QRCodesMaquinas() {
  const { categoriasPermitidas } = useAuth();
  const [bens, setBens] = useState<Bem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBens() {
      let query = supabase
        .from("bens")
        .select("id, descricao, categoria_id")
        .order("id");
      if (categoriasPermitidas) {
        query = query.in("categoria_id", categoriasPermitidas);
      }
      const { data } = await query;
      setBens(data || []);
      setLoading(false);
    }
    fetchBens();
  }, [categoriasPermitidas]);

  const filtered = bens.filter(
    (b) =>
      b.id.includes(search.toLowerCase()) ||
      b.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-display">QR Codes de Manutenção</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Escaneie o QR Code para abrir a criação de manutenção com a máquina pré-selecionada.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer size={16} />
          Imprimir
        </Button>
      </div>

      <div className="relative print:hidden">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filtrar por número ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando máquinas...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma máquina encontrada.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-4 print:gap-3">
          {filtered.map((bem) => {
            const url = `${baseUrl}/manutencao?bem=${bem.id}`;
            return (
              <div
                key={bem.id}
                className="flex flex-col items-center border rounded-xl p-4 bg-card gap-3 print:break-inside-avoid print:border print:rounded-lg print:p-3"
              >
                <QRCodeSVG
                  value={url}
                  size={140}
                  level="M"
                  className="print:w-[110px] print:h-[110px]"
                />
                <div className="text-center">
                  <p className="font-mono text-xs text-muted-foreground">#{bem.id}</p>
                  <p className="font-semibold text-sm leading-tight mt-0.5 line-clamp-2">
                    {bem.descricao}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          main, main * { visibility: visible; }
          main { position: absolute; inset: 0; }
        }
      `}</style>
    </div>
  );
}
