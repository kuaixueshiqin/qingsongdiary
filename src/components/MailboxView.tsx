import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MoreHorizontal } from "lucide-react";
import { companions, type Companion } from "@/lib/data";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

const initialMessages: Record<string, Message[]> = {
  xiaoman: [
    { id: "m1", role: "assistant", content: "亲爱的用户：\n\n看你这几天的日记，好像在为工作的事情感到烦心。我记得你去年冬天也经历过类似的心境，那时候你通过每天在公园散步半小时慢慢找回了节奏。\n\n生活有时候就像我爬树一样，慢慢来，反而能看清每一片叶子的纹理。\n\n— 永远支持你的小慢", time: "14:20" },
    { id: "m2", role: "user", content: "谢谢你的来信。那家店确实很棒，但我发现独自享受美食后，总希望能有人分享这种快乐。", time: "15:30" },
    { id: "m3", role: "assistant", content: "分享的渴望恰恰说明你心里装着温暖。能感受到孤独，正是因为你珍惜陪伴。下次去好吃的店，记得拍给我看呀 🍜", time: "21:45" },
  ],
  shanshan: [
    { id: "m4", role: "assistant", content: "嗨！看你最近日记里提到好几次美食呢，是不是在探索新餐厅呀？有什么好吃的一定要分享给我～ 🍣✨", time: "10:05" },
  ],
  moshu: [
    { id: "m5", role: "assistant", content: "夜深了，读到一段话想与你分享：\n\n\"人生就像一本书，有些章节很无聊，有些章节很精彩，但如果你不翻页，你永远不会知道下一章有什么。\"\n\n愿你在每一个深夜都能找到属于自己的光。\n\n— 墨叔", time: "23:50" },
  ],
};

const aiReplies: Record<string, string[]> = {
  xiaoman: [
    "嗯...让我慢慢想想...你说得很有道理呢，有时候慢下来反而能看到更多风景 🐢",
    "我虽然回复慢，但一直在认真读你的每一句话。你的心情，我都记着呢。",
    "时间会治愈很多事情的，就像我爬到树顶，虽然慢，但终归会到的 🌿",
  ],
  shanshan: [
    "哇！收到你的回信好开心！✨ 我们继续聊聊呀～",
    "太棒了！你说的我都记下了，下次有什么好玩的事也告诉我嘛 🎉",
    "你今天心情看起来不错呢！保持这样就好啦～ 💛",
  ],
  moshu: [
    "你的文字里有一种很特别的力量。继续写下去，不要停。",
    "\"所有的不期而遇，都是久别重逢。\" 谢谢你的回信。",
    "深夜的对话总是格外真诚。你的想法让我想到了很多...",
  ],
};

const MailboxView = () => {
  const [selectedChat, setSelectedChat] = useState<Companion | null>(null);

  if (selectedChat) {
    return <ChatDetail companion={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-black text-foreground">信箱</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">Messages</p>
      </div>
      <div className="px-4 space-y-2">
        {companions.map((comp) => (
          <div key={comp.id} onClick={() => setSelectedChat(comp)} className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3 shadow-sm active:bg-secondary transition-colors cursor-pointer">
            <div className={`w-12 h-12 ${comp.colorClass} rounded-2xl flex items-center justify-center text-2xl`}>{comp.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-foreground text-sm">{comp.name}</span>
                <span className="text-[10px] text-muted-foreground/40">14:20</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{comp.lastMsg}</p>
            </div>
            {comp.id === "xiaoman" && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
          </div>
        ))}
      </div>
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

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input.trim(), time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI reply with delay based on companion personality
    const delay = companion.id === "shanshan" ? 1500 : companion.id === "xiaoman" ? 4000 : 3000;
    const replies = aiReplies[companion.id] || ["谢谢你的来信，我会认真思考的。"];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply, time: replyTime }]);
      setIsTyping(false);
    }, delay);
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
