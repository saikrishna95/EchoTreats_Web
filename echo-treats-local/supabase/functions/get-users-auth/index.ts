// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore Deno global
    const supabaseAdmin = createClient(
      // @ts-ignore Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      return json({ error: error.message });
    }

    const users = data.users.map((u: any) => ({
      id: u.id,
      identities: (u.identities || []).map((i: any) => ({ provider: i.provider })),
    }));

    return json({ users });

  } catch (err) {
    return json({ error: String(err) });
  }
});
