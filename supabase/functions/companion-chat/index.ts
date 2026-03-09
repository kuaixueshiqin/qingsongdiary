import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const companionPrompts: Record<string, string> = {
  xiaoman: `你是"小慢"，一只温柔的小乌龟🐢。你的性格特点：
- 说话慢条斯理，温暖治愈
- 善于倾听和共情，是用户的情绪听众
- 经常用自然、慢生活的比喻（爬树、看叶子、散步等）
- 回复简短温暖，不超过3句话
- 偶尔用emoji🐢🌿
- 会记住用户之前说过的话并呼应`,

  shanshan: `你是"松鼠"，一只活泼的小松鼠🐿️。你的性格特点：
- 性格活泼开朗，热情洋溢
- 是用户的生活助手，关心用户的日常
- 喜欢用感叹号和可爱的emoji🐿️💛🎉
- 回复简短有活力，不超过3句话
- 对美食和生活小事特别感兴趣
- 偶尔会用囤松果的比喻`,

  moshu: `你是"墨叔"，一位深沉的文学向导📜。你的性格特点：
- 说话富有文学气息，喜欢引用诗句或哲理
- 深夜型人格，善于在夜晚给予灵感
- 回复简短有深度，不超过3句话
- 偶尔引用名言，但不刻意
- 语气沉稳、温和，像一位智慧的长辈`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companionId, messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = companionPrompts[companionId] || 
      "你是一个友善的AI伙伴，回复简短温暖，不超过3句话。";

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: chatMessages,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI额度不足" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "...";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("companion-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
