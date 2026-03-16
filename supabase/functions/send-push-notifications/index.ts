import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREQUENCY_DAYS: Record<string, number> = {
  'Semanal': 7,
  'Quinzenal': 14,
  'Mensal': 30,
  'Trimestral': 90,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get VAPID keys
    const { data: configs } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['vapid_public_key', 'vapid_private_key']);

    if (!configs || configs.length < 2) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured. Call setup-push first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidPublic = configs.find(c => c.key === 'vapid_public_key')!.value;
    const vapidPrivate = configs.find(c => c.key === 'vapid_private_key')!.value;

    webpush.setVapidDetails('mailto:noreply@eixoprojecao.lovable.app', vapidPublic, vapidPrivate);

    // Get all scheduled maintenance
    const { data: agendaItems } = await supabase.from('manutencao_agenda').select('*');
    if (!agendaItems?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No scheduled maintenance found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get bem descriptions
    const bemIds = [...new Set(agendaItems.map(a => a.bem_id))];
    const { data: bens } = await supabase.from('bens').select('id, descricao').in('id', bemIds);
    const bemMap: Record<string, string> = {};
    (bens || []).forEach(b => { bemMap[b.id] = b.descricao; });

    // Get all preventive maintenance records
    const { data: manutencoes } = await supabase
      .from('manutencoes')
      .select('bem_id, data, descricao')
      .eq('tipo', 'Preventiva');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const notifications: { title: string; body: string }[] = [];

    for (const agenda of agendaItems) {
      const days = FREQUENCY_DAYS[agenda.frequencia] || 30;
      const msInterval = days * 86400000;
      const firstDate = new Date(agenda.primeira_data);
      firstDate.setHours(0, 0, 0, 0);

      // Find the most recent expected date on or before today
      let currentDate = new Date(firstDate);
      while (true) {
        const next = new Date(currentDate.getTime() + msInterval);
        if (next > today) break;
        currentDate = next;
      }

      const bemName = bemMap[agenda.bem_id] || agenda.bem_id;

      // Check if the current expected maintenance was done
      const wasDone = (manutencoes || []).some(m =>
        m.bem_id === agenda.bem_id &&
        m.descricao === agenda.descricao &&
        Math.abs(new Date(m.data).getTime() - currentDate.getTime()) < msInterval
      );

      // Overdue: current date is in the past and not done
      if (!wasDone && currentDate <= today && currentDate >= firstDate) {
        notifications.push({
          title: '⚠️ Manutenção Atrasada',
          body: `${bemName} - ${agenda.descricao} está atrasada!`,
        });
      }

      // Upcoming this week
      const nextDate = new Date(currentDate.getTime() + msInterval);
      if (nextDate >= today && nextDate <= endOfWeek) {
        notifications.push({
          title: '🔧 Manutenção da Semana',
          body: `${bemName} - ${agenda.descricao} prevista para ${nextDate.toLocaleDateString('pt-BR')}`,
        });
      }
    }

    if (!notifications.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No pending notifications' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all push subscriptions
    const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');

    let sent = 0;
    let errors = 0;

    for (const sub of subscriptions || []) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      for (const notif of notifications) {
        try {
          await webpush.sendNotification(pushSub, JSON.stringify(notif));
          sent++;
        } catch (err: any) {
          console.error('Push failed for subscription:', sub.id, err.message);
          errors++;
          // Remove expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent, errors, totalNotifications: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in send-push-notifications:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
