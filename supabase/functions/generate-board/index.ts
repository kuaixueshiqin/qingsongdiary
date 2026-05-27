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
    const { topic, diaryContents } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: pull live web context for the topic (评分、简介、推荐等)
    let webContext = "";
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (FIRECRAWL_API_KEY) {
      try {
        const sRes = await fetch("https://api.firecrawl.dev/v2/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: `${topic} 推荐 评分 介绍`, limit: 5 }),
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          const results = sData?.data?.web || sData?.data || [];
          if (Array.isArray(results) && results.length > 0) {
            webContext = results
              .slice(0, 5)
              .map((r: any, i: number) => `${i + 1}. ${r.title || ""} — ${r.description || r.snippet || ""}`)
              .join("\n");
          }
        }
      } catch (e) { console.error("firecrawl search error:", e); }
    }

    const systemPrompt = `你是"轻松书"App的AI助手。用户会给你一个话题关键词、他们的日记内容、以及该话题的实时联网信息。
你需要：
1. 优先从日记中提取与话题相关的个人经历
2. 结合联网信息补充客观介绍、评分或推荐（用自然口吻，不要照搬）
3. 生成一个精简的看板卡片

请使用 generate_board 工具返回结构化数据。`;

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
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `话题关键词: "${topic}"

以下是我的日记内容:
${diaryContents}

${webContext ? `以下是关于"${topic}"的实时联网信息（参考用）:\n${webContext}\n\n` : ""}请从日记中提取与"${topic}"相关的内容，结合联网信息生成看板数据。如果日记中没有直接相关内容，请基于联网信息和话题给出合理的推荐性条目。`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_board",
                description:
                  "根据日记内容和话题生成看板卡片数据",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "看板标题，如'我的电影清单'",
                    },
                    emoji: {
                      type: "string",
                      description: "一个代表该话题的emoji符号",
                    },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: {
                            type: "string",
                            description: "条目内容，简洁，如'《沙丘2》· 震撼'",
                          },
                        },
                        required: ["text"],
                        additionalProperties: false,
                      },
                      description: "看板条目列表，3-6条",
                    },
                    summary: {
                      type: "string",
                      description:
                        "一句话总结，如'本月看了3部电影，偏好科幻类型'",
                    },
                  },
                  required: ["title", "emoji", "items", "summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_board" },
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
          JSON.stringify({ error: "AI额度不足，请充值" }),
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

    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI未能生成有效数据" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const boardData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(boardData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-board error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
