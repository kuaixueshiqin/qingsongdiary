import { useState } from "react";
import { ChevronLeft, Send, MoreHorizontal } from "lucide-react";
import { companions, type Companion } from "@/lib/data";

const MailboxView = () => {
  const [selectedChat, setSelectedChat] = useState<Companion | null>(null);

  if (selectedChat) {
    return <ChatDetail companion={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-black text-foreground">信箱</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">
          Messages
        </p>
      </div>
      <div className="px-4 space-y-2">
        {companions.map((comp) => (
          <div
            key={comp.id}
            onClick={() => setSelectedChat(comp)}
            className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3 shadow-sm active:bg-secondary transition-colors cursor-pointer"
          >
            <div className={`w-12 h-12 ${comp.colorClass} rounded-2xl flex items-center justify-center text-2xl`}>
              {comp.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-foreground text-sm">{comp.name}</span>
                <span className="text-[10px] text-muted-foreground/40">14:20</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{comp.lastMsg}</p>
            </div>
            {comp.id === "xiaoman" && (
              <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ChatDetailProps {
  companion: Companion;
  onBack: () => void;
}

const ChatDetail = ({ companion, onBack }: ChatDetailProps) => {
  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-4 pt-14 pb-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground">
            <ChevronLeft size={22} />
          </button>
          <div className={`w-8 h-8 ${companion.colorClass} rounded-lg flex items-center justify-center text-lg`}>
            {companion.avatar}
          </div>
          <div>
            <span className="font-bold text-foreground text-sm">{companion.name}</span>
            <span className={`text-[10px] ml-2 ${companion.textColorClass} bg-secondary px-1.5 py-0.5 rounded-full`}>
              {companion.role}
            </span>
          </div>
        </div>
        <MoreHorizontal size={18} className="text-muted-foreground" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
        <div className="text-center text-[10px] text-muted-foreground/30 tracking-widest uppercase mb-6">
          2024年5月18日
        </div>

        {/* AI letter */}
        <div className="flex gap-3">
          <div className={`w-8 h-8 ${companion.colorClass} rounded-lg flex-shrink-0 flex items-center justify-center text-lg`}>
            {companion.avatar}
          </div>
          <div className="bg-secondary/60 border border-border p-5 rounded-2xl rounded-tl-md text-foreground/80 text-sm leading-relaxed max-w-[85%]">
            <p className="mb-3 font-bold text-base text-foreground">亲爱的用户：</p>
            <p className="mb-3">
              看你这几天的日记，好像在为工作的事情感到烦心。我记得你去年冬天也经历过类似的心境，那时候你通过每天在公园散步半小时慢慢找回了节奏。
            </p>
            <p className="mb-3">
              生活有时候就像我爬树一样，慢慢来，反而能看清每一片叶子的纹理。
            </p>
            <p className="text-right text-muted-foreground text-xs italic">
              — 永远支持你的{companion.name}
            </p>
          </div>
        </div>

        {/* User reply */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-md text-sm leading-relaxed max-w-[80%]">
            谢谢你的来信。那家店确实很棒，但我发现独自享受美食后，总希望能有人分享这种快乐。
          </div>
        </div>

        {/* AI follow-up */}
        <div className="flex gap-3">
          <div className={`w-8 h-8 ${companion.colorClass} rounded-lg flex-shrink-0 flex items-center justify-center text-lg`}>
            {companion.avatar}
          </div>
          <div className="bg-secondary/60 border border-border p-4 rounded-2xl rounded-tl-md text-foreground/80 text-sm leading-relaxed max-w-[85%]">
            <p>分享的渴望恰恰说明你心里装着温暖。能感受到孤独，正是因为你珍惜陪伴。下次去好吃的店，记得拍给我看呀 🍜</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 pb-2 border-t border-border">
        <div className="relative">
          <input
            type="text"
            placeholder={`给 ${companion.name} 回信...`}
            className="w-full bg-secondary border border-border rounded-full py-2.5 px-5 pr-12 focus:outline-none focus:border-muted-foreground/40 text-sm text-foreground placeholder:text-muted-foreground/30"
          />
          <button className="absolute right-2 top-1.5 p-1.5 text-muted-foreground/40 hover:text-foreground">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MailboxView;
