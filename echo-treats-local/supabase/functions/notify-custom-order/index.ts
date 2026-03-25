import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NOTIFY_EMAIL = "echotreats.v@gmail.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Log the order notification attempt
    console.log(`Custom order received from ${body.name} (${body.email})`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513; border-bottom: 2px solid #D4A574; padding-bottom: 10px;">🎂 New Custom Order Request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name</td><td style="padding: 8px;">${escapeHtml(body.name || "N/A")}</td></tr>
          <tr style="background: #f9f5f0;"><td style="padding: 8px; font-weight: bold; color: #555;">Email</td><td style="padding: 8px;">${escapeHtml(body.email || "N/A")}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Phone</td><td style="padding: 8px;">${escapeHtml(body.phone || "N/A")}</td></tr>
          <tr style="background: #f9f5f0;"><td style="padding: 8px; font-weight: bold; color: #555;">Product Type</td><td style="padding: 8px;">${escapeHtml(body.product_type || "N/A")}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Occasion</td><td style="padding: 8px;">${escapeHtml(body.occasion || "N/A")}</td></tr>
          <tr style="background: #f9f5f0;"><td style="padding: 8px; font-weight: bold; color: #555;">Flavor</td><td style="padding: 8px;">${escapeHtml(body.flavor || "N/A")}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Size / Quantity</td><td style="padding: 8px;">${escapeHtml(body.size_quantity || "N/A")}</td></tr>
          <tr style="background: #f9f5f0;"><td style="padding: 8px; font-weight: bold; color: #555;">Delivery Date</td><td style="padding: 8px;">${escapeHtml(body.delivery_date || "N/A")}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Address</td><td style="padding: 8px;">${escapeHtml(body.address || "N/A")}</td></tr>
          <tr style="background: #f9f5f0;"><td style="padding: 8px; font-weight: bold; color: #555;">Pincode</td><td style="padding: 8px;">${escapeHtml(body.pincode || "N/A")}</td></tr>
        </table>
        ${body.message ? `<div style="margin-top: 16px; padding: 12px; background: #f9f5f0; border-radius: 8px;"><strong>Message:</strong><br/>${escapeHtml(body.message).replace(/\n/g, '<br/>')}</div>` : ''}
      </div>
    `;

    // Store notification for admin to see (email will work once email domain is configured)
    console.log("Custom order notification HTML prepared for:", NOTIFY_EMAIL);
    console.log("Order details:", JSON.stringify({
      name: body.name,
      email: body.email,
      phone: body.phone,
      product_type: body.product_type,
      address: body.address,
    }));

    return new Response(JSON.stringify({ success: true, message: "Order recorded. Email notifications will be enabled once email domain is configured." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-custom-order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
