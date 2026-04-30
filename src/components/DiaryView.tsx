import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronLeft, Trash2, Wallet, Send, Check, ChevronDown, ChevronUp, RefreshCw, Sun, Cloud, CloudRain, CloudLightning, CloudSun, Settings2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import MentionInput, { type MentionTag } from "@/components/MentionInput";
import { companions, type DiaryEntry, type DiaryComment, type CommentReply } from "@/lib/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PineconeTracker from "@/components/PineconeTracker";
import { useDiaryEntries, useCustomCompanions } from "@/hooks/useUserData";

interface DiaryViewProps {
  initialEntryId?: string | null;
  onEntryViewed?: () => void;
}

const inspirationQuestions = [
  "今天喝到最好喝的一杯水是什么？",
  "今天最想感谢谁？",
  "发现了一个什么生活小确幸？",
  "今天学到了什么新东西？",
  "如果用一首歌形容今天，会是哪首？",
  "今天最让你微笑的瞬间是？",
  "有没有一个画面，让你想按下暂停键？",
  "今天的天气让你想起了什么？",
  "如果给今天打个分，你会打几分？",
  "此刻最想对自己说的一句话是什么？",
];

const getMoodIcon = (score?: number) => {
  switch (score) {
    case 1: return <CloudLightning size={16} className="text-muted-foreground" />;
    case 2: return <CloudRain size={16} className="text-companion-indigo-text" />;
    case 3: return <Cloud size={16} className="text-muted-foreground" />;
    case 4: return <CloudSun size={16} className="text-companion-amber-text" />;
    case 5: return <Sun size={16} className="text-accent" />;
    default: return null;
  }
};

const tagColors: Record<string, string> = {
  "电影": "bg-companion-indigo text-companion-indigo-text",
  "美食": "bg-companion-amber text-companion-amber-text",
  "运动": "bg-companion-green text-companion-green-text",
  "心情": "bg-companion-red text-companion-red-text",
  "感悟": "bg-[hsl(270,40%,93%)] text-[hsl(270,40%,40%)]",
  "社交": "bg-companion-amber text-companion-amber-text",
  "职场": "bg-companion-indigo text-companion-indigo-text",
  "旅行": "bg-companion-green text-companion-green-text",
  "阅读": "bg-[hsl(270,40%,93%)] text-[hsl(270,40%,40%)]",
  "音乐": "bg-companion-red text-companion-red-text",
};

const DiaryView = ({ initialEntryId, onEntryViewed }: DiaryViewProps) => {
  const { entries, loading, createEntry, updateEntry, addComment, deleteComment, addReply } = useDiaryEntries();
  const { customCompanions } = useCustomCompanions();
  const allCompanions = [...companions, ...customCompanions];

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(initialEntryId ?? null);

  useEffect(() => {
    if (initialEntryId != null) {
      setSelectedEntryId(initialEntryId);
      onEntryViewed?.();
    }
  }, [initialEntryId]);

  const [inspirationQ, setInspirationQ] = useState(() => inspirationQuestions[Math.floor(Math.random() * inspirationQuestions.length)]);
  const shuffleQuestion = useCallback(() => {
    setInspirationQ(inspirationQuestions[Math.floor(Math.random() * inspirationQuestions.length)]);
  }, []);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newMentions, setNewMentions] = useState<MentionTag[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyMentions, setReplyMentions] = useState<MentionTag[]>([]);
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(new Set());
  const [editingBilling, setEditingBilling] = useState(false);
  const [billingAmount, setBillingAmount] = useState("");
  const [billingCategory, setBillingCategory] = useState("");
  const [loadingReply, setLoadingReply] = useState<string | null>(null);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  const handleDeleteComment = async (entryId: string, commentId: string) => {
    await deleteComment(entryId, commentId);
    setActiveCommentId(null);
    toast.success("评论已删除");
  };

  const handleReply = async (entryId: string, comment: DiaryComment) => {
    if (!replyText.trim() || loadingReply) return;
    const comp = allCompanions.find((c) => c.id === comment.companionId);
    if (!comp) return;

    const savedText = replyText.trim();
    const savedMentions = [...replyMentions];
    setReplyText("");
    setReplyMentions([]);
    setReplyingTo(null);
    setLoadingReply(comment.id);

    // Save user reply to cloud
    await addReply(entryId, comment.id, "user", comment.companionId, savedText);

    const respondingIds = new Set<string>();
    savedMentions.forEach((m) => respondingIds.add(m.id));

    const chatMessages = [
      { role: "assistant" as const, content: comment.text },
      ...comment.replies.map((r) => ({ role: r.role, content: r.text })),
      { role: "user" as const, content: savedText },
    ];

    if (respondingIds.size === 0) {
      setLoadingReply(null);
      return;
    }

    try {
      for (const compId of respondingIds) {
        const { data, error } = await supabase.functions.invoke("companion-chat", {
          body: { companionId: compId, messages: chatMessages },
        });
        if (error) throw error;
        await addReply(entryId, comment.id, "assistant", compId, data?.reply || "...");
      }
    } catch (e: any) {
      console.error("Reply error:", e);
      const msg = e?.message || "";
      if (msg.includes("429")) toast.error("AI 太忙啦，请稍后再试");
      else if (msg.includes("402")) toast.error("AI 额度已用完，请充值后再试");
      else toast.error(msg || "AI回复失败");
    } finally {
      setLoadingReply(null);
    }
  };

  const handleSaveDiary = async () => {
    if (!newContent.trim()) return;
    const created = await createEntry(newContent);
    if (!created) {
      toast.error("保存失败");
      return;
    }
    const mentionedIds = newMentions.map((m) => m.id);
    setNewContent("");
    setNewMentions([]);
    setIsWriting(false);

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
    toast("你的情绪已被世界温柔接收 ✨", { duration: 3000 });

    // AI tag/mood analysis
    try {
      const { data: analysis, error } = await supabase.functions.invoke("analyze-diary", {
        body: { content: created.content },
      });
      if (!error && analysis && !analysis.error) {
        await updateEntry(created.id, {
          tags: analysis.tags,
          moodScore: analysis.moodScore,
          moodLabel: analysis.moodLabel,
        });
      }
    } catch (e) {
      console.error("Analyze diary error:", e);
    }

    // @-mentioned companions reply
    for (const compId of mentionedIds) {
      try {
        const { data, error } = await supabase.functions.invoke("companion-chat", {
          body: { companionId: compId, messages: [{ role: "user", content: created.content }] },
        });
        if (error) throw error;
        await addComment(created.id, {
          companionId: compId,
          text: data?.reply || "...",
          lineIndex: 0,
          highlightText: "",
        });
      } catch (e: any) {
        console.error("Mention comment error:", e);
      }
    }
  };

  const handleContentBlur = (entryId: string, newContent: string) => {
    if (newContent.trim()) updateEntry(entryId, { content: newContent });
  };

  const handleEditBilling = (entryId: string) => {
    const amount = parseFloat(billingAmount);
    if (isNaN(amount) || !billingCategory.trim()) {
      toast.error("请输入有效的金额和分类");
      return;
    }
    updateEntry(entryId, { billing: { amount, category: billingCategory, verified: true } });
    setEditingBilling(false);
    toast.success("账单已更新");
  };

  const handleConfirmBilling = (entryId: string) => {
    const e = entries.find((x) => x.id === entryId);
    if (e?.billing) updateEntry(entryId, { billing: { ...e.billing, verified: true } });
    toast.success("账单已确认");
  };

  if (isWriting) {
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300 flex flex-col h-full">
        <div className="px-6 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => { setIsWriting(false); setNewContent(""); setNewMentions([]); }} className="text-muted-foreground">
            <ChevronLeft size={24} />
          </button>
          <span className="text-sm font-bold text-muted-foreground">新日志 · {new Date().toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }).replace(/(\d+)\/(\d+)/, "$1月$2日")}</span>
        </div>
        <div className="flex-1 px-6">
          <MentionInput
            autoFocus
            value={newContent}
            mentions={newMentions}
            onChange={(text, mentions) => { setNewContent(text); setNewMentions(mentions); }}
            onSubmit={handleSaveDiary}
            placeholder="今天发生了什么... 输入@可呼叫伙伴评论"
            className="flex-1 !min-h-0 !max-h-none text-lg leading-relaxed border-none !rounded-none !bg-transparent !py-0 !px-0"
          />
        </div>
        <div className="px-6 pb-4">
          <button onClick={handleSaveDiary} disabled={!newContent.trim()} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold float-right disabled:opacity-30">保存记录</button>
        </div>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => { setSelectedEntryId(null); setActiveCommentId(null); setReplyingTo(null); setEditingBilling(false); }} className="text-muted-foreground">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{selectedEntry.date}</span>
              <span className="text-xs text-muted-foreground">{selectedEntry.time}</span>
              {selectedEntry.moodScore && (
                <span className="flex items-center gap-1 ml-auto">
                  {getMoodIcon(selectedEntry.moodScore)}
                  {selectedEntry.moodLabel && <span className="text-[10px] text-muted-foreground">{selectedEntry.moodLabel}</span>}
                </span>
              )}
            </div>
            {selectedEntry.tags && selectedEntry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {selectedEntry.tags.map((tag) => (
                  <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColors[tag] || "bg-secondary text-muted-foreground"}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
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
                <p
                  className="text-foreground/85 text-[15px] leading-[1.8] rounded-lg px-1 -mx-1 focus:outline-none focus:bg-secondary/30 transition-colors"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const allParas = selectedEntry.content.split("\n").filter(Boolean);
                    allParas[pIdx] = e.currentTarget.textContent || "";
                    handleContentBlur(selectedEntry.id, allParas.join("\n"));
                  }}
                >{renderParagraph()}</p>
                {lineComments.length > 0 && (
                  <div className="mt-2 pl-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground/50">{lineComments.length} 条评论</span>
                      <button
                        onClick={() => setCollapsedComments(prev => {
                          const next = new Set(prev);
                          if (next.has(pIdx)) next.delete(pIdx);
                          else next.add(pIdx);
                          return next;
                        })}
                        className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        {collapsedComments.has(pIdx) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>
                    {!collapsedComments.has(pIdx) && (
                    <div className="space-y-1.5">
                    {lineComments.map((comment) => {
                      const comp = allCompanions.find((c) => c.id === comment.companionId);
                      if (!comp) return null;
                      const isReplying = replyingTo === comment.id;
                      const isLoading = loadingReply === comment.id;
                      return (
                        <div key={comment.id} className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setExpandedComments(prev => { const next = new Set(prev); if (next.has(comment.id)) next.delete(comment.id); else next.add(comment.id); return next; });
                                if (isReplying) {
                                  setReplyingTo(null);
                                  setReplyText("");
                                  setReplyMentions([]);
                                  setActiveCommentId(null);
                                } else {
                                  setActiveCommentId(comment.id);
                                  setReplyingTo(comment.id);
                                  setReplyText("");
                                  setReplyMentions([]);
                                }
                              }}
                              className={`flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${isReplying ? "bg-foreground text-primary-foreground" : `${comp.colorClass} ${comp.textColorClass}`} ${expandedComments.has(comment.id) ? "max-w-[90%]" : "max-w-[75%]"}`}
                            >
                              <span className="flex-shrink-0 mt-0.5">{comp.avatar}</span>
                              <span className="font-medium flex-shrink-0 mt-0.5">{comp.name}</span>
                              <span className={`${expandedComments.has(comment.id) ? "whitespace-pre-wrap text-left" : "truncate"} ${isReplying ? "text-primary-foreground/80" : "opacity-70"}`}>{comment.text}</span>
                            </button>
                            {isReplying && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteComment(selectedEntry.id, comment.id); }} className="p-1.5 bg-secondary rounded-lg text-destructive/60 hover:text-destructive animate-in fade-in duration-200">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {comment.replies.length > 0 && (
                            <div className="relative">
                              <div className="flex items-center justify-between pl-5 ml-3">
                                <span className="text-[9px] text-muted-foreground/40">{comment.replies.length} 条回复</span>
                                <button
                                  onClick={() => setCollapsedReplies(prev => {
                                    const next = new Set(prev);
                                    if (next.has(comment.id)) next.delete(comment.id);
                                    else next.add(comment.id);
                                    return next;
                                  })}
                                  className="p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary transition-colors"
                                >
                                  {collapsedReplies.has(comment.id) ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                </button>
                              </div>
                              {!collapsedReplies.has(comment.id) && (
                              <div className="pl-5 border-l-2 border-border ml-3 space-y-1.5">
                                {comment.replies.map((reply) => {
                                  const replyComp = allCompanions.find((c) => c.id === reply.companionId);
                                  return (
                                    <div key={reply.id} className="flex items-start gap-2 animate-in fade-in duration-300">
                                      {reply.role === "user" ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-primary/10 text-foreground max-w-[80%]">
                                          <span className="flex-shrink-0">🧑</span>
                                          <span className="font-medium flex-shrink-0">我</span>
                                          <span className="opacity-70">{reply.text}</span>
                                          <span className="text-[9px] text-muted-foreground/40 ml-1 flex-shrink-0">{reply.time}</span>
                                        </div>
                                      ) : (
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${replyComp?.colorClass ?? "bg-secondary"} ${replyComp?.textColorClass ?? "text-foreground"} max-w-[80%]`}>
                                          <span className="flex-shrink-0">{replyComp?.avatar ?? "🤖"}</span>
                                          <span className="font-medium flex-shrink-0">{replyComp?.name ?? "AI"}</span>
                                          <span className="opacity-70">{reply.text}</span>
                                          <span className="text-[9px] opacity-40 ml-1 flex-shrink-0">{reply.time}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              )}
                            </div>
                          )}

                          {isLoading && (
                            <div className="pl-5 border-l-2 border-border ml-3">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${comp.colorClass}`}>
                                <span>{comp.avatar}</span>
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              </div>
                            </div>
                          )}

                          {isReplying && (
                            <div className="flex gap-2 pl-5 ml-3 animate-in slide-in-from-top-2 duration-200">
                              <MentionInput
                                autoFocus
                                value={replyText}
                                mentions={replyMentions}
                                onChange={(text, mentions) => { setReplyText(text); setReplyMentions(mentions); }}
                                onSubmit={() => handleReply(selectedEntry.id, comment)}
                                placeholder={`回复 ${comp.name}... 输入@可呼叫伙伴`}
                              />
                              <button onClick={() => handleReply(selectedEntry.id, comment)} disabled={!replyText.trim() || !!loadingReply} className="p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-30 self-end">
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
                )}
              </div>
            );
          })}

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
      </div>
    );
  }

  return (
    <div className="pb-4">
      {showCelebration && (
        <>
          <div className="shooting-star" />
          <div className="shooting-star" style={{ animationDelay: '0.3s', top: '20px', left: '-10px' }} />
          <div className="ripple-circle" style={{ width: 60, height: 60, top: '50%', left: '50%', marginLeft: -30, marginTop: -30 }} />
          <div className="ripple-circle" style={{ width: 60, height: 60, top: '50%', left: '50%', marginLeft: -30, marginTop: -30, animationDelay: '0.3s' }} />
        </>
      )}
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-foreground">日记</h1>
        </div>
        <button onClick={() => setIsWriting(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
          <Plus size={16} strokeWidth={3} /><span className="text-sm font-bold">记一篇</span>
        </button>
      </div>

      <PineconeTracker streak={4} />

      <div className="px-4 mb-4">
        <div className="bg-[hsl(48,100%,95%/0.7)] border border-[hsl(48,80%,85%)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">✨ 灵感瞬间</span>
            <button onClick={shuffleQuestion} className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
              <RefreshCw size={10} />换一个
            </button>
          </div>
          <button
            onClick={async () => {
              const created = await createEntry(inspirationQ + "\n");
              if (created) setSelectedEntryId(created.id);
            }}
            className="text-sm text-foreground/80 leading-relaxed text-left w-full hover:text-foreground transition-colors"
          >
            {inspirationQ}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading && entries.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">载入日记...</div>
        )}
        {entries.map((entry) => {
          const entryCompanions = entry.comments.map((c) => allCompanions.find((comp) => comp.id === c.companionId));
          return (
            <div key={entry.id} onClick={() => setSelectedEntryId(entry.id)} className="bg-card border border-border rounded-2xl p-4 flex gap-3 active:bg-secondary transition-colors shadow-sm cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <span>{entry.date}</span><span className="text-muted-foreground/40">·</span><span>{entry.time}</span>
                  {entry.moodScore && <span className="ml-auto">{getMoodIcon(entry.moodScore)}</span>}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed line-clamp-3">{entry.content}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColors[tag] || "bg-secondary text-muted-foreground"}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
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
    </div>
  );
};

export default DiaryView;
