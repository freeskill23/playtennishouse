import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { title, body: msgBody, token, chatId } = body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      return new Response(JSON.stringify({ error: "title이 필요합니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let botToken = typeof token === "string" && token.trim() ? token.trim() : null;
    let targetChatId = typeof chatId === "string" && chatId.trim() ? chatId.trim() : null;

    if (!botToken || !targetChatId) {
      const { data, error } = await supabase
        .from("settings")
        .select("telegram_bot_token, telegram_chat_id")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      botToken = botToken || data?.telegram_bot_token || null;
      targetChatId = targetChatId || data?.telegram_chat_id || null;
    }

    if (!botToken || !targetChatId) {
      return new Response(
        JSON.stringify({ error: "Telegram bot token 또는 chat ID가 설정되지 않았습니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const text = `🔔 ${title}\n\n${typeof msgBody === "string" ? msgBody : ""}`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!tgRes.ok) {
      const tgErr = await tgRes.text();
      return new Response(
        JSON.stringify({ error: "Telegram 전송 실패", detail: tgErr }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
