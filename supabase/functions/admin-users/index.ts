import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (req.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: corsHeaders });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

try {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // GET ?action=list — return all profiles
  if (req.method === "GET" && action === "list") {
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, name, nickname, phone, career, ntrp, hand, game_preference, bio, profile_img, is_bad_member, bad_member_reason, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ users: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST ?action=change_password — admin resets a user's password
  if (req.method === "POST" && action === "change_password") {
    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "userId and newPassword (min 6 chars) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST ?action=set_bad_member — toggle bad member flag + reason
  if (req.method === "POST" && action === "set_bad_member") {
    const { userId, isBad, reason } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { error } = await admin
      .from("profiles")
      .update({
        is_bad_member: !!isBad,
        bad_member_reason: isBad ? (reason || "") : null,
      })
      .eq("id", userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
} catch (err) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
