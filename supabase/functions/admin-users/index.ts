import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET ?action=list — return all profiles with reservation/matching counts
    if (req.method === "GET" && action === "list") {
      const { data, error } = await admin
        .from("profiles")
        .select("id, email, name, nickname, phone, career, ntrp, hand, game_preference, bio, profile_img, is_bad_member, bad_member_reason, marketing_consent, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Count court reservations per user
      const { data: courtRows } = await admin
        .from("reservations")
        .select("user_id")
        .eq("type", "court");
      const courtCounts: Record<string, number> = {};
      for (const r of courtRows || []) {
        courtCounts[r.user_id] = (courtCounts[r.user_id] || 0) + 1;
      }

      // Count pension reservations per user
      const { data: pensionRows } = await admin
        .from("reservations")
        .select("user_id")
        .eq("type", "pension");
      const pensionCounts: Record<string, number> = {};
      for (const r of pensionRows || []) {
        pensionCounts[r.user_id] = (pensionCounts[r.user_id] || 0) + 1;
      }

      // Count matching posts per user
      const { data: matchRows } = await admin
        .from("matching_posts")
        .select("user_id");
      const matchCounts: Record<string, number> = {};
      for (const r of matchRows || []) {
        matchCounts[r.user_id] = (matchCounts[r.user_id] || 0) + 1;
      }

      const users = (data || []).map((u: Record<string, unknown>) => ({
        ...u,
        court_count: courtCounts[u.id as string] || 0,
        pension_count: pensionCounts[u.id as string] || 0,
        matching_count: matchCounts[u.id as string] || 0,
      }));

      return new Response(JSON.stringify({ users }), {
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
});
