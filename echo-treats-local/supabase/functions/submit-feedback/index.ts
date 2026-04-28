// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      name,
      email,
      phone,
      location,
      taste_rating,
      presentation_rating,
      service_rating,
      product_ids,
      comment,
    } = await req.json();

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = String(phone || "").trim();
    const cleanLocation = String(location || "").trim();
    const cleanComment = String(comment || "").trim();
    const cleanProducts = Array.isArray(product_ids)
      ? product_ids.filter((id) => typeof id === "string" && id.trim().length > 0)
      : [];

    if (!cleanName || !cleanEmail) {
      return json({ error: "Name and email are required." }, 400);
    }

    const ratings = [taste_rating, presentation_rating, service_rating].map((value) => Number(value));
    if (ratings.some((value) => !Number.isFinite(value) || value < 1 || value > 5)) {
      return json({ error: "All ratings must be between 1 and 5." }, 400);
    }

    if (cleanProducts.length === 0) {
      return json({ error: "Please select at least one product." }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabaseAdmin.from("feedback").insert({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || null,
      location: cleanLocation || null,
      taste_rating: ratings[0],
      presentation_rating: ratings[1],
      service_rating: ratings[2],
      product_ids: cleanProducts,
      comment: cleanComment || null,
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
