import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationButton() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSupported(false);
        setLoading(false);
        return;
      }
      setSupported(true);

      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };
    check();
  }, []);

  const subscribe = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const { data, error } = await supabase.functions.invoke("setup-push");
      if (error || !data?.publicKey) throw new Error("Falha ao obter chave VAPID");

      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // Request permission and subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = subscription.toJSON();

      // Save subscription to DB
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
        },
        { onConflict: "user_id,endpoint" }
      );

      setIsSubscribed(true);
      toast({ title: "Notificações ativadas", description: "Você receberá alertas de manutenções pendentes e atrasadas." });
    } catch (err: any) {
      console.error("Subscription error:", err);
      if (Notification.permission === "denied") {
        toast({ title: "Permissão negada", description: "Habilite as notificações nas configurações do navegador.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao ativar notificações", description: err.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", subscription.endpoint);
        }
      }
      setIsSubscribed(false);
      toast({ title: "Notificações desativadas" });
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (!supported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors disabled:opacity-50"
      title={isSubscribed ? "Desativar notificações" : "Ativar notificações"}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isSubscribed ? (
        <Bell size={18} className="text-primary" />
      ) : (
        <BellOff size={18} />
      )}
      {isSubscribed ? "Notificações ativas" : "Ativar notificações"}
    </button>
  );
}
