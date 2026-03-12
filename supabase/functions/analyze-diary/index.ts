import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
          messages: [
            {
              role: "system",
              content: `你是一个日记分析助手。分析用户的日记内容，返回：
1. 1-3个关键词标签（如 #美食、#电影、#感悟、#运动、#职场、#旅行、#阅读、#音乐、#社交、#心情）
2. 情绪等级（1-5，1=很低落 2=有点低落 3=平淡 4=开心 5=非常开心）
3. 情绪关键词（一个词描述情绪，如：开心、感动、孤独、释然、兴奋、平静、温暖、空虚）`,
            },
            {
              role: "user",
              content,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_diary",
                description: "分析日记的标签和情绪",
                parameters: {
                  type: "object",
                  properties: {
                    tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "1-3个关键词标签，不带#号",
                    },
                    moodScore: {
                      type: "number",
                      description: "情绪等级 1-5",
                    },
                    moodLabel: {
                      type: "string",
                      description: "情绪关键词",
                    },
                  },
                  required: ["tags", "moodScore", "moodLabel"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "analyze_diary" },
          },
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ tags: [], moodScore: 3, moodLabel: "平淡" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-diary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
