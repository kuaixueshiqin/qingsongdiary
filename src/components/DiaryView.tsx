import { useState } from "react";
import { Plus, ChevronLeft, Reply, Trash2, Wallet, X, Send, Check } from "lucide-react";
import { diaryEntries as initialEntries, companions, type DiaryEntry, type DiaryComment } from "@/lib/data";
import { toast } from "sonner";

const DiaryView = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingBilling, setEditingBilling] = useState(false);
  const [billingAmount, setBillingAmount] = useState("");
  const [billingCategory, setBillingCategory] = useState("");

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  const handleDeleteComment = (entryId: number, commentId: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, comments: e.comments.filter((c) => c.id !== commentId) }
          : e
      )
    );
    setActiveCommentId(null);
    toast.success("评论已删除");
  };

  const handleReply = (entryId: number, comment: DiaryComment) => {
    if (!replyText.trim()) return;
    const comp = companions.find((c) => c.id === comment.companionId);
    toast.success(`已回复${comp?.name ?? "AI伙伴"}：${replyText}`);
    setReplyText("");
    setReplyingTo(null);
  };

  const handleSaveDiary = () => {
    if (!newContent.trim()) return;
    const newEntry: DiaryEntry = {
      id: Date.now(),
      date: "5月21日",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      content: newContent,
      comments: [],
    };
    setEntries((prev) => [newEntry, ...prev]);
    setNewContent("");
    setIsWriting(false);
    toast.success("日记已保存！AI伙伴稍后会来评论哦~");
  };

  const handleEditBilling = (entryId: number) => {
    const amount = parseFloat(billingAmount);
    if (isNaN(amount) || !billingCategory.trim()) {
      toast.error("请输入有效的金额和分类");
      return;
    }
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, billing: { amount, category: billingCategory, verified: true } }
          : e
      )
    );
    setEditingBilling(false);
    toast.success("账单已更新");
  };

  const handleConfirmBilling = (entryId: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId && e.billing
          ? { ...e, billing: { ...e.billing, verified: true } }
          : e
      )
    );
    toast.success("账单已确认");
  };

  if (selectedEntry) {
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => { setSelectedEntryId(null); setActiveCommentId(null); setReplyingTo(null); setEditingBilling(false); }} className="text-muted-foreground">
            <ChevronLeft size={24} />
          </button>
          <div>
            <span className="text-sm font-bold text-foreground">{selectedEntry.date}</span>
            <span className="text-xs text-muted-foreground ml-2">{selectedEntry.time}</span>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {selectedEntry.content.split("\n").filter(Boolean).map((para, pIdx) => {
            const lineComments = selectedEntry.comments.filter((c) => c.lineIndex === pIdx);

            const renderParagraph = () => {
              if (lineComments.length === 0) return para;
              const highlights = lineComments
                .filter((c) => c.highlightText && para.includes(c.highlightText))
                .sort((a, b) => para.indexOf(a.highlightText) - para.indexOf(b.highlightText));
              if (highlights.length === 0) return para;

              const parts: React.ReactNode[] = [];
              let lastIndex = 0;
              highlights.forEach((comment) => {
                const idx = para.indexOf(comment.highlightText, lastIndex);
                if (idx === -1) return;
                if (idx > lastIndex) parts.push(para.slice(lastIndex, idx));
                parts.push(
                  <span key={comment.id} className="underline decoration-accent decoration-2 underline-offset-4 cursor-pointer" onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}>
                    {comment.highlightText}
                  </span>
                );
                lastIndex = idx + comment.highlightText.length;
              });
              if (lastIndex < para.length) parts.push(para.slice(lastIndex));
              return parts;
            };

            return (
              <div key={pIdx}>
                <p className="text-foreground/85 text-[15px] leading-[1.8]">{renderParagraph()}</p>
                {lineComments.length > 0 && (
                  <div className="mt-2 space-y-1.5 pl-2">
                    {lineComments.map((comment) => {
                      const comp = companions.find((c) => c.id === comment.companionId);
                      if (!comp) return null;
                      const isActive = activeCommentId === comment.id;
                      const isReplying = replyingTo === comment.id;
                      return (
                        <div key={comment.id} className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setActiveCommentId(isActive ? null : comment.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all max-w-[75%] ${isActive ? "bg-foreground text-primary-foreground" : `${comp.colorClass} ${comp.textColorClass}`}`}
                            >
                              <span className="flex-shrink-0">{comp.avatar}</span>
                              <span className="font-medium flex-shrink-0">{comp.name}</span>
                              <span className={`truncate ${isActive ? "text-primary-foreground/80" : "opacity-70"}`}>{comment.text}</span>
                            </button>
                            {isActive && (
                              <div className="flex gap-1 animate-in slide-in-from-left-2 duration-200">
                                <button onClick={() => { setReplyingTo(isReplying ? null : comment.id); setReplyText(""); }} className={`p-1.5 rounded-lg ${isReplying ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                                  <Reply size={14} />
                                </button>
                                <button onClick={() => handleDeleteComment(selectedEntry.id, comment.id)} className="p-1.5 bg-secondary rounded-lg text-destructive/60 hover:text-destructive">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Reply input */}
                          {isReplying && (
                            <div className="flex gap-2 pl-4 animate-in slide-in-from-top-2 duration-200">
                              <input
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleReply(selectedEntry.id, comment)}
                                placeholder={`回复 ${comp.name}...`}
                                className="flex-1 bg-secondary border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-muted-foreground/40 text-foreground placeholder:text-muted-foreground/30"
                              />
                              <button onClick={() => handleReply(selectedEntry.id, comment)} disabled={!replyText.trim()} className="p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-30">
                                <Send size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Billing card */}
          {selectedEntry.billing && !editingBilling && (
            <div className="bg-secondary/50 border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <Wallet size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">已自动识别账单</p>
                <p className="text-sm font-bold text-foreground">¥{selectedEntry.billing.amount} · {selectedEntry.billing.category}</p>
              </div>
              {selectedEntry.billing.verified ? (
                <span className="text-[10px] text-companion-green-text bg-companion-green px-2 py-1 rounded-lg font-bold flex items-center gap-1"><Check size={10} />已确认</span>
              ) : (
                <div className="flex gap-1.5">
                  <button onClick={() => handleConfirmBilling(selectedEntry.id)} className="text-[10px] bg-companion-green text-companion-green-text px-2.5 py-1.5 rounded-lg font-bold">确认</button>
                  <button onClick={() => { setEditingBilling(true); setBillingAmount(String(selectedEntry.billing!.amount)); setBillingCategory(selectedEntry.billing!.category); }} className="text-[10px] bg-card border border-border px-2.5 py-1.5 rounded-lg font-medium text-muted-foreground">修改</button>
                </div>
              )}
            </div>
          )}

          {/* Billing edit form */}
          {editingBilling && selectedEntry.billing && (
            <div className="bg-secondary/50 border border-border rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-accent" />
                <span className="text-xs font-bold text-foreground">修改账单</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">金额</label>
                  <input type="number" value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="w-full bg-card border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">分类</label>
                  <select value={billingCategory} onChange={(e) => setBillingCategory(e.target.value)} className="w-full bg-card border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground">
                    <option>餐饮</option><option>交通</option><option>娱乐</option><option>购物</option><option>生活</option><option>其他</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingBilling(false)} className="text-xs bg-card border border-border px-3 py-1.5 rounded-lg text-muted-foreground">取消</button>
                <button onClick={() => handleEditBilling(selectedEntry.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold">保存</button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground/30 italic">点击此处追加记录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-foreground">日记</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">Diary Logs</p>
        </div>
        <button onClick={() => setIsWriting(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
          <Plus size={16} strokeWidth={3} /><span className="text-sm font-bold">记一篇</span>
        </button>
      </div>
      <div className="px-4 space-y-3">
        {entries.map((entry) => {
          const entryCompanions = entry.comments.map((c) => companions.find((comp) => comp.id === c.companionId));
          return (
            <div key={entry.id} onClick={() => setSelectedEntryId(entry.id)} className="bg-card border border-border rounded-2xl p-4 flex gap-3 active:bg-secondary transition-colors shadow-sm cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <span>{entry.date}</span><span className="text-muted-foreground/40">·</span><span>{entry.time}</span>
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed line-clamp-3">{entry.content}</p>
                {entry.billing && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold">
                    <Wallet size={12} className="text-accent" />
                    <span className="text-accent">¥{entry.billing.amount} · {entry.billing.category}</span>
                    {entry.billing.verified && <Check size={10} className="text-companion-green-text" />}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 items-center justify-start pt-1">
                {entryCompanions.map((comp, idx) => comp ? (
                  <div key={idx} className={`w-8 h-8 ${comp.colorClass} rounded-lg flex items-center justify-center text-base`}>{comp.avatar}</div>
                ) : null)}
              </div>
            </div>
          );
        })}
      </div>

      {isWriting && (
        <div className="absolute inset-0 bg-card z-[100] p-6 pt-16 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-muted-foreground">新日志 · 5月21日</span>
            <button onClick={() => { setIsWriting(false); setNewContent(""); }} className="text-muted-foreground"><X size={20} /></button>
          </div>
          <textarea autoFocus value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="今天发生了什么..." className="flex-1 text-lg leading-relaxed focus:outline-none resize-none bg-transparent text-foreground placeholder:text-muted-foreground/30" />
          <button onClick={handleSaveDiary} disabled={!newContent.trim()} className="mt-4 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold self-end disabled:opacity-30">保存记录</button>
        </div>
      )}
    </div>
  );
};

export default DiaryView;
