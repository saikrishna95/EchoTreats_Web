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
    const { user_id, new_password } = await req.json();

    if (!user_id || !new_password) {
      return json({ error: "user_id and new_password are required" });
    }

    if (new_password.length < 6) {
      return json({ error: "Password must be at least 6 characters" });
    }

    // @ts-ignore Deno global
    const supabaseAdmin = createClient(
      // @ts-ignore Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: new_password,
    });

    if (error) {
      return json({ error: error.message });
    }

    return json({ success: true });

  } catch (err) {
    return json({ error: String(err) });
  }
});
