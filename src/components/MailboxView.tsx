import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Send, MoreHorizontal, Pin, Trash2, PenLine, X } from "lucide-react";
import { companions as builtInCompanions, squareAgents, type Companion } from "@/lib/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomCompanions } from "@/hooks/useUserData";
import { usePinecones } from "@/hooks/usePinecones";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface ChatItem {
  conversationId: string;
  companion: Companion;
  pinned: boolean;
  lastTime: string;
  unread: boolean;
}

const timeFromIso = (iso: string) => new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

const MailboxView = () => {
  const { user } = useAuth();
  const { customCompanions } = useCustomCompanions();
  const { randomDrop } = usePinecones();
  const allCompanions = [...builtInCompanions, ...customCompanions];

  const [selectedChat, setSelectedChat] = useState<{ companion: Companion; conversationId: string } | null>(null);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations
  const reloadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Seed initial welcome letter from 松鼠 if user has no squirrel conversation yet
    const seedKey = `mailbox_seeded_squirrel_${user.id}`;
    if (!localStorage.getItem(seedKey)) {
      const { data: existing } = await supabase
        .from("mail_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("companion_id", "shanshan")
        .maybeSingle();
      if (!existing) {
        const { data: newConv } = await supabase
          .from("mail_conversations")
          .insert({
            user_id: user.id,
            companion_id: "shanshan",
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select()
          .maybeSingle();
        if (newConv) {
          await supabase.from("mail_messages").insert({
            user_id: user.id,
            conversation_id: newConv.id,
            role: "assistant",
            text:
              "你好呀，我是松鼠 🐿️\n\n欢迎来到轻松书 —— 这里是我们一起囤藏生活坚果的小树洞。\n\n在这里你可以：\n· 在「日记」里记下任何心情，我和其他伙伴会在角落悄悄留言\n· 在「信箱」里给我们写信，慢慢聊\n· 在「整理」里看看 AI 帮你梳理出的账单、心情和小确幸\n· 在「伙伴」里认识更多想陪你的小动物\n\n今天过得怎么样？要不要回一封信告诉我～",
          });
        }
      }
      localStorage.setItem(seedKey, "1");
    }

    const { data: convs } = await supabase
      .from("mail_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    const list: ChatItem[] = (convs || [])
      .map((c: any) => {
        const comp = allCompanions.find((x) => x.id === c.companion_id);
        if (!comp) return null;
        return {
          conversationId: c.id,
          companion: comp,
          pinned: false,
          lastTime: c.last_message_at ? timeFromIso(c.last_message_at) : "刚刚",
          unread: (c.unread_count ?? 0) > 0,
        };
      })
      .filter(Boolean) as ChatItem[];
    setChatList(list);
    setLoading(false);
  }, [user, customCompanions.length]);

  useEffect(() => { reloadConversations(); }, [reloadConversations]);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    longPressTimer.current = setTimeout(() => setContextMenu({ id, x: clientX, y: clientY }), 600);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handlePin = (id: string) => {
    setChatList((prev) => {
      const updated = prev.map((c) => c.conversationId === id ? { ...c, pinned: !c.pinned } : c);
      return [...updated.filter((c) => c.pinned), ...updated.filter((c) => !c.pinned)];
    });
    setContextMenu(null);
    toast.success("已更新");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("mail_conversations").delete().eq("id", id);
    setChatList((prev) => prev.filter((c) => c.conversationId !== id));
    setContextMenu(null);
    toast.success("已删除对话");
  };

  useEffect(() => {
    const dismiss = () => setContextMenu(null);
    if (contextMenu) window.addEventListener("click", dismiss);
    return () => window.removeEventListener("click", dismiss);
  }, [contextMenu]);

  const [showNewChat, setShowNewChat] = useState(false);

  const availableCompanions: Companion[] = [
    ...allCompanions,
    ...squareAgents.map((a) => ({
      id: a.id, name: a.name, avatar: a.avatar,
      colorClass: "bg-secondary", textColorClass: "text-foreground",
      role: a.role, bio: "", intimacy: 0, level: 1,
      lastMsg: "还没有对话", delay: "随机",
    })),
  ].filter((c) => !chatList.some((item) => item.companion.id === c.id));

  const handleStartNewChat = async (comp: Companion) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("mail_conversations")
      .insert({ user_id: user.id, companion_id: comp.id, last_message_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (error || !data) { toast.error("创建对话失败"); return; }
    setShowNewChat(false);
    setSelectedChat({ companion: comp, conversationId: data.id });
    reloadConversations();
  };

  if (selectedChat) {
    return (
      <ChatDetail
        companion={selectedChat.companion}
        conversationId={selectedChat.conversationId}
        onBack={() => { setSelectedChat(null); reloadConversations(); }}
      />
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <h1 className="text-2xl font-black text-foreground">信箱</h1>
        <button onClick={() => setShowNewChat(true)} className="bg-primary text-primary-foreground px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
          <PenLine size={14} /><span className="text-xs font-bold">写信</span>
        </button>
      </div>
      {loading && chatList.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-8">载入信箱...</div>
      ) : chatList.length === 0 ? (
        <div className="px-6 text-center text-xs text-muted-foreground/60 py-12">
          <p className="mb-2">📫</p>
          <p>还没有书信往来</p>
          <p className="mt-1 text-muted-foreground/40">点击右上角「写信」开始与伙伴对话</p>
        </div>
      ) : (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {chatList.map((item, idx) => (
            <div
              key={item.conversationId}
              onClick={() => { if (!contextMenu) setSelectedChat({ companion: item.companion, conversationId: item.conversationId }); }}
              onTouchStart={(e) => handleTouchStart(item.conversationId, e)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => handleTouchStart(item.conversationId, e)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className={`flex items-center gap-3 px-4 py-3 active:bg-secondary/60 transition-colors cursor-pointer select-none ${item.pinned ? "bg-secondary/30" : ""} ${idx < chatList.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className={`w-11 h-11 ${item.companion.colorClass} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>{item.companion.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-foreground text-sm">{item.companion.name}</span>
                  <span className="text-[10px] text-muted-foreground/40 text-right">{item.lastTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground truncate">{item.companion.lastMsg}</p>
                  {item.unread && <span className="flex-shrink-0 ml-2 text-sm pinecone-sparkle">🌰</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[200] bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 140), top: contextMenu.y - 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => handlePin(contextMenu.id)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-secondary w-full text-left">
            <Pin size={14} />
            {chatList.find((c) => c.conversationId === contextMenu.id)?.pinned ? "取消置顶" : "置顶"}
          </button>
          <div className="border-t border-border" />
          <button onClick={() => handleDelete(contextMenu.id)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-secondary w-full text-left">
            <Trash2 size={14} />删除
          </button>
        </div>
      )}
      {showNewChat && (
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm z-[110] flex items-end">
          <div className="bg-card w-full rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 max-h-[70%] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-foreground">选择伙伴写信</h3>
              <button onClick={() => setShowNewChat(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto space-y-2 scrollbar-hide">
              {availableCompanions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">所有伙伴都已在信箱中</p>
              ) : (
                availableCompanions.map((comp) => (
                  <button key={comp.id} onClick={() => handleStartNewChat(comp)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 active:bg-secondary transition-colors text-left">
                    <div className={`w-10 h-10 ${comp.colorClass} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{comp.avatar}</div>
                    <div>
                      <span className="font-bold text-foreground text-sm">{comp.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{comp.role}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatDetail = ({ companion, conversationId, onBack }: { companion: Companion; conversationId: string; onBack: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("mail_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      setMessages((data || []).map((m: any) => ({
        id: m.id, role: m.role, content: m.text, time: timeFromIso(m.created_at),
      })));
    })();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !user) return;
    const text = input.trim();
    setInput("");

    // Save user message to cloud
    const { data: userMsgRow } = await supabase
      .from("mail_messages")
      .insert({ user_id: user.id, conversation_id: conversationId, role: "user", text })
      .select()
      .maybeSingle();
    if (userMsgRow) {
      setMessages((prev) => [...prev, { id: userMsgRow.id, role: "user", content: text, time: timeFromIso(userMsgRow.created_at) }]);
      randomDrop("letter");
    }
    setIsTyping(true);

    try {
      const fullMessages = [...messages, { role: "user" as const, content: text }];
      const { data, error } = await supabase.functions.invoke("companion-chat", {
        body: { companionId: companion.id, messages: fullMessages.map((m) => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;

      const reply = data?.reply || "...";
      const { data: aiMsgRow } = await supabase
        .from("mail_messages")
        .insert({ user_id: user.id, conversation_id: conversationId, role: "assistant", text: reply })
        .select()
        .maybeSingle();
      await supabase
        .from("mail_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      if (aiMsgRow) {
        setMessages((prev) => [...prev, { id: aiMsgRow.id, role: "assistant", content: reply, time: timeFromIso(aiMsgRow.created_at) }]);
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      const msg = e?.message || "";
      if (msg.includes("429")) toast.error("AI 太忙啦，稍后再试");
      else if (msg.includes("402")) toast.error("AI 额度已用完");
      else toast.error(msg || "回复失败，请稍后再试");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="px-4 pt-14 pb-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground"><ChevronLeft size={22} /></button>
          <div className={`w-8 h-8 ${companion.colorClass} rounded-lg flex items-center justify-center text-lg`}>{companion.avatar}</div>
          <div>
            <span className="font-bold text-foreground text-sm">{companion.name}</span>
            <span className={`text-[10px] ml-2 ${companion.textColorClass} bg-secondary px-1.5 py-0.5 rounded-full`}>{companion.role}</span>
          </div>
        </div>
        <MoreHorizontal size={18} className="text-muted-foreground" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {messages.length === 0 && !isTyping && (
          <div className="text-center text-xs text-muted-foreground/40 py-8">写下第一封信，{companion.name} 会回复你</div>
        )}
        {messages.map((msg) =>
          msg.role === "assistant" ? (
            <div key={msg.id} className="flex gap-3">
              <div className={`w-8 h-8 ${companion.colorClass} rounded-lg flex-shrink-0 flex items-center justify-center text-lg`}>{companion.avatar}</div>
              <div>
                <div className="bg-secondary/60 border border-border p-4 rounded-2xl rounded-tl-md text-foreground/80 text-sm leading-relaxed max-w-[85%] whitespace-pre-line">{msg.content}</div>
                <span className="text-[9px] text-muted-foreground/30 mt-1 block pl-1">{msg.time}</span>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-end">
              <div className="bg-primary text-primary-foreground p-3.5 rounded-2xl rounded-tr-md text-sm leading-relaxed max-w-[80%]">{msg.content}</div>
              <span className="text-[9px] text-muted-foreground/30 mt-1 pr-1">{msg.time}</span>
            </div>
          )
        )}
        {isTyping && (
          <div className="flex gap-3">
            <div className={`w-8 h-8 ${companion.colorClass} rounded-lg flex-shrink-0 flex items-center justify-center text-lg`}>{companion.avatar}</div>
            <div className="bg-secondary/60 border border-border px-4 py-3 rounded-2xl rounded-tl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pb-2 border-t border-border">
        <div className="relative flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`给 ${companion.name} 回信...`}
            className="flex-1 bg-secondary border border-border rounded-full py-2.5 px-5 focus:outline-none focus:border-muted-foreground/40 text-sm text-foreground placeholder:text-muted-foreground/30"
          />
          <button onClick={handleSend} disabled={!input.trim()} className="p-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-30 transition-opacity">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MailboxView;
