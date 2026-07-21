import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = "admin123";

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
    const { password, action } = body ?? {};

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "관리자 인증에 실패했습니다." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "delete") {
      const { commentId } = body ?? {};
      if (typeof commentId !== "string" || !commentId.trim()) {
        return new Response(JSON.stringify({ error: "댓글 ID가 필요합니다." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: delChildErr } = await supabase
        .from("notice_comments")
        .delete()
        .eq("parent_id", commentId);
      if (delChildErr) {
        return new Response(JSON.stringify({ error: delChildErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: delErr } = await supabase
        .from("notice_comments")
        .delete()
        .eq("id", commentId);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ ok: true, deleted: true, commentId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { noticeId, content, parentId } = body ?? {};
    if (typeof noticeId !== "string" || !noticeId.trim()) {
      return new Response(JSON.stringify({ error: "공지 ID가 필요합니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!trimmed) {
      return new Response(JSON.stringify({ error: "댓글 내용을 입력하세요." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parent = typeof parentId === "string" && parentId.trim() ? parentId.trim() : null;

    const id = `ac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = Date.now();
    const { error } = await supabase.from("notice_comments").insert({
      id,
      notice_id: noticeId,
      user_id: null,
      user_name: "관리자",
      content: trimmed,
      created_at: createdAt,
      is_admin: true,
      parent_id: parent,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        comment: {
          id,
          noticeId,
          userId: null,
          userName: "관리자",
          content: trimmed,
          createdAt,
          isAdmin: true,
          parentId: parent,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
