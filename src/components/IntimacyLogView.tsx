import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { ChevronLeft, Heart, MessageCircle, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Companion } from "@/lib/data";

interface LogItem {
  id: string;
  kind: "reply" | "mail" | "comment";
  delta: number;
  text: string;
  at: string;
}

const KIND_META: Record<LogItem["kind"], { label: string; icon: any; color: string }> = {
  reply: { label: "回复评论", icon: MessageCircle, color: "bg-companion-indigo text-companion-indigo-text" },
  mail: { label: "回信", icon: Mail, color: "bg-companion-amber text-companion-amber-text" },
  comment: { label: "伙伴留下评论", icon: Sparkles, color: "bg-companion-green text-companion-green-text" },
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `今天 ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
};

const isImageAvatar = (a: string) => a.startsWith("data:image");

export default function IntimacyLogView({ companion, onBack }: { companion: Companion; onBack: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // 1) User replies to this companion's diary comments (+1 each)
      const { data: comments } = await supabase
        .from("diary_comments")
        .select("id, text")
        .eq("user_id", user.id)
        .eq("companion_id", companion.id);
      const cIds = (comments || []).map((c) => c.id);
      let replyItems: LogItem[] = [];
      if (cIds.length) {
        const { data: replies } = await supabase
          .from("comment_replies")
          .select("id, text, created_at, role, comment_id")
          .eq("user_id", user.id)
          .in("comment_id", cIds)
          .eq("role", "user")
          .order("created_at", { ascending: false });
        replyItems = (replies || []).map((r: any) => ({
          id: `r-${r.id}`,
          kind: "reply",
          delta: 1,
          text: r.text,
          at: r.created_at,
        }));
      }

      // 2) Comments TA left for the user (+1 each)
      const commentItems: LogItem[] = (comments || []).map((c: any) => ({
        id: `c-${c.id}`,
        kind: "comment",
        delta: 1,
        text: c.text,
        at: "",
      }));
      // fetch created_at for comments
      if (cIds.length) {
        const { data: cFull } = await supabase
          .from("diary_comments")
          .select("id, created_at")
          .in("id", cIds);
        const map = new Map((cFull || []).map((x: any) => [x.id, x.created_at]));
        commentItems.forEach((c) => {
          c.at = map.get(c.id.slice(2)) || new Date().toISOString();
        });
      }

      // 3) User mail replies to this companion (+3 each)
      const { data: convs } = await supabase
        .from("mail_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("companion_id", companion.id);
      const convIds = (convs || []).map((c) => c.id);
      let mailItems: LogItem[] = [];
      if (convIds.length) {
        const { data: msgs } = await supabase
          .from("mail_messages")
          .select("id, text, created_at, role")
          .eq("user_id", user.id)
          .in("conversation_id", convIds)
          .eq("role", "user")
          .order("created_at", { ascending: false });
        mailItems = (msgs || []).map((m: any) => ({
          id: `m-${m.id}`,
          kind: "mail",
          delta: 3,
          text: m.text,
          at: m.created_at,
        }));
      }

      const all = [...replyItems, ...mailItems, ...commentItems].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      );
      setItems(all);
      setLoading(false);
    })();
  }, [user, companion.id]);

  const total = items.reduce((s, i) => s + i.delta, 0);

  return (
    <div className="pb-4 animate-in slide-in-from-right duration-300">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <span className="text-sm font-bold text-foreground">{companion.name} · 亲密度记录</span>
      </div>

      <div className="px-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className={`w-14 h-14 ${companion.colorClass} rounded-2xl flex items-center justify-center text-3xl overflow-hidden`}>
            {isImageAvatar(companion.avatar) ? <img src={companion.avatar} alt="" className="w-full h-full object-cover" /> : companion.avatar}
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground/50">当前亲密度</p>
            <div className="flex items-baseline gap-1">
              <Heart size={14} className="text-intimacy" fill="currentColor" />
              <span className="text-2xl font-black text-foreground">{companion.intimacy}</span>
              <span className="text-xs text-muted-foreground/40">/100</span>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">已记录 +{total}</p>
          </div>
        </div>

        <div className="mt-4 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground/50 py-10">加载中…</p>
          ) : items.length === 0 ? (
            <div className="py-10 text-center px-6">
              <p className="text-xs text-muted-foreground/60">还没有亲密度记录</p>
              <p className="text-[10px] text-muted-foreground/40 mt-2 leading-relaxed">回复 TA 的评论 +1，回信 +3，让你们更亲近吧～</p>
            </div>
          ) : (
            items.map((it) => {
              const meta = KIND_META[it.kind];
              const Icon = meta.icon;
              return (
                <div key={it.id} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">{meta.label}</span>
                      <span className="text-xs font-black text-intimacy">+{it.delta}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 line-clamp-2 mt-0.5">{it.text}</p>
                    <p className="text-[10px] text-muted-foreground/30 mt-1">{it.at ? formatTime(it.at) : ""}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 bg-secondary/40 rounded-2xl p-4 text-[10px] text-muted-foreground/60 leading-relaxed">
          <p className="font-bold text-foreground mb-1">如何提升亲密度？</p>
          <p>· 回复 TA 在日记中的评论：+1</p>
          <p>· 给 TA 回信：+3</p>
          <p>· TA 主动留下评论：+1</p>
        </div>
      </div>
    </div>
  );
}
