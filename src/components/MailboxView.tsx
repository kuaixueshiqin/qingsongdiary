import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Send, MoreHorizontal, Pin, Trash2, PenLine, X } from "lucide-react";
import { companions, squareAgents, type Companion } from "@/lib/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface ChatItem {
  companion: Companion;
  pinned: boolean;
  lastTime: string;
  unread: boolean;
}

const initialMessages: Record<string, Message[]> = {
  xiaoman: [
    { id: "m1", role: "assistant", content: "亲爱的用户：\n\n看你这几天的日记，好像在为工作的事情感到烦心。我记得你去年冬天也经历过类似的心境，那时候你通过每天在公园散步半小时慢慢找回了节奏。\n\n生活有时候就像我爬树一样，慢慢来，反而能看清每一片叶子的纹理。\n\n— 永远支持你的小慢", time: "14:20" },
    { id: "m2", role: "user", content: "谢谢你的来信。那家店确实很棒，但我发现独自享受美食后，总希望能有人分享这种快乐。", time: "15:30" },
    { id: "m3", role: "assistant", content: "分享的渴望恰恰说明你心里装着温暖。能感受到孤独，正是因为你珍惜陪伴。下次去好吃的店，记得拍给我看呀 🍜", time: "21:45" },
  ],
  shanshan: [
    { id: "m4", role: "assistant", content: "嗨！看你最近日记里提到好几次美食呢，是不是在探索新餐厅呀？有什么好吃的一定要分享给我～ 🍣🐿️", time: "10:05" },
  ],
  moshu: [
    { id: "m5", role: "assistant", content: "夜深了，读到一段话想与你分享：\n\n\"人生就像一本书，有些章节很无聊，有些章节很精彩，但如果你不翻页，你永远不会知道下一章有什么。\"\n\n愿你在每一个深夜都能找到属于自己的光。\n\n— 墨叔", time: "23:50" },
  ],
};

const MailboxView = () => {
  const [selectedChat, setSelectedChat] = useState<Companion | null>(null);
  const [chatList, setChatList] = useState<ChatItem[]>(
    companions.map((c, i) => ({ companion: c, pinned: false, lastTime: i === 0 ? "14:20" : i === 1 ? "10:05" : "昨天", unread: i === 0 }))
  );
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ id, x: clientX, y: clientY });
    }, 600);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handlePin = (id: string) => {
    setChatList((prev) => {
      const updated = prev.map((c) => c.companion.id === id ? { ...c, pinned: !c.pinned } : c);
      return [...updated.filter((c) => c.pinned), ...updated.filter((c) => !c.pinned)];
    });
    setContextMenu(null);
    toast.success("已更新");
  };

  const handleDelete = (id: string) => {
    setChatList((prev) => prev.filter((c) => c.companion.id !== id));
    setContextMenu(null);
    toast.success("已删除对话");
  };

  useEffect(() => {
    const dismiss = () => setContextMenu(null);
    if (contextMenu) window.addEventListener("click", dismiss);
    return () => window.removeEventListener("click", dismiss);
  }, [contextMenu]);

  const [showNewChat, setShowNewChat] = useState(false);

  // All companions not already in chatList
  const availableCompanions: Companion[] = [
    ...companions,
    ...squareAgents.map((a) => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      colorClass: "bg-secondary",
      textColorClass: "text-foreground",
      role: a.role,
      bio: "",
      intimacy: 0,
      level: 1,
      lastMsg: "还没有对话",
      delay: "随机",
    })),
  ].filter((c) => !chatList.some((item) => item.companion.id === c.id));

  const handleStartNewChat = (comp: Companion) => {
    setChatList((prev) => [{ companion: comp, pinned: false, lastTime: "刚刚", unread: false }, ...prev]);
    setShowNewChat(false);
    setSelectedChat(comp);
  };

  if (selectedChat) {
    return <ChatDetail companion={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <h1 className="text-2xl font-black text-foreground">信箱</h1>
        <button onClick={() => setShowNewChat(true)} className="bg-primary text-primary-foreground px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
          <PenLine size={14} /><span className="text-xs font-bold">写信</span>
        </button>
      </div>
      <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {chatList.map((item, idx) => (
          <div
            key={item.companion.id}
            onClick={() => { if (!contextMenu) setSelectedChat(item.companion); }}
            onTouchStart={(e) => handleTouchStart(item.companion.id, e)}
            onTouchEnd={handleTouchEnd}
            onMouseDown={(e) => handleTouchStart(item.companion.id, e)}
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
                {item.unread && (
                  <span className="flex-shrink-0 ml-2 text-sm relative">
                    🌰
                    <span className="absolute inset-0 animate-ping opacity-40">🌰</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          className="fixed z-[200] bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 140), top: contextMenu.y - 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => handlePin(contextMenu.id)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-secondary w-full text-left">
            <Pin size={14} />
            {chatList.find((c) => c.companion.id === contextMenu.id)?.pinned ? "取消置顶" : "置顶"}
          </button>
          <div className="border-t border-border" />
          <button onClick={() => handleDelete(contextMenu.id)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-secondary w-full text-left">
            <Trash2 size={14} />
            删除
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

const ChatDetail = ({ companion, onBack }: { companion: Companion; onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages[companion.id] || []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input.trim(), time: now };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("companion-chat", {
        body: {
          companionId: companion.id,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const replyTime = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.reply || "...", time: replyTime },
      ]);
    } catch (e: any) {
      console.error("Chat error:", e);
      toast.error(e?.message || "回复失败，请稍后再试");
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
        <div className="text-center text-[10px] text-muted-foreground/30 tracking-widest uppercase mb-4">2024年5月18日</div>

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
