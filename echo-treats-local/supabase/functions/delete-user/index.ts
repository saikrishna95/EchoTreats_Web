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
    const { user_id } = await req.json();

    if (!user_id) {
      return json({ error: "user_id is required" });
    }

    // @ts-ignore Deno global
    const supabaseAdmin = createClient(
      // @ts-ignore Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (error) {
      return json({ error: error.message });
    }

    await supabaseAdmin.from("profiles").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);

    return json({ success: true });

  } catch (err) {
    return json({ error: String(err) });
  }
});
