import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if VAPID keys already exist
    const { data: existingKey } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'vapid_public_key')
      .single();

    if (existingKey) {
      return new Response(JSON.stringify({ publicKey: existingKey.value }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys();

    await supabase.from('app_config').insert([
      { key: 'vapid_public_key', value: vapidKeys.publicKey },
      { key: 'vapid_private_key', value: vapidKeys.privateKey },
    ]);

    return new Response(JSON.stringify({ publicKey: vapidKeys.publicKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in setup-push:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
