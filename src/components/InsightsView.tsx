import { useState } from "react";
import { Wallet, Smile, Film, Sparkles, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import movieDune2 from "@/assets/movie-dune2.jpg";
import movieZhouchuchusanhai from "@/assets/movie-zhouchuchusanhai.jpg";
import movieGhibli from "@/assets/movie-ghibli.jpg";
import BillingDetailView, { type BillingItem } from "@/components/BillingDetailView";
import { useDiaryEntries, useCustomBoards } from "@/hooks/useUserData";

interface InsightsViewProps {
  onNavigateToDiary?: (entryId: string) => void;
}

const InsightsView = ({ onNavigateToDiary }: InsightsViewProps) => {
  const { entries } = useDiaryEntries();
  const { boards, addBoard, removeBoard } = useCustomBoards();

  const moodData = [40, 60, 30, 80, 45, 90, 70, 50, 65, 85, 55, 75];
  const moodLabels = ["好奇", "开心", "低落", "愉快", "平静", "兴奋", "满足", "空虚", "温暖", "期待", "疲惫", "释然"];

  const [isCreating, setIsCreating] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Derive billing items from cloud diary entries
  const billingItems: BillingItem[] = entries
    .filter((e) => e.billing)
    .map((e, idx) => ({
      id: idx + 1,
      diaryId: e.id,
      date: e.date,
      amount: e.billing!.amount,
      category: e.billing!.category,
      source: e.content.split("\n")[0].slice(0, 20),
      status: e.billing!.verified ? "confirmed" : "toConfirm",
    }));
  const [extraBilling, setExtraBilling] = useState<BillingItem[]>([]);
  const allBilling = [...billingItems, ...extraBilling];

  const handleGenerate = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    try {
      const diaryContents = entries.map((e) => `[${e.date} ${e.time}] ${e.content}`).join("\n\n");
      const { data, error } = await supabase.functions.invoke("generate-board", {
        body: { topic: topicInput.trim(), diaryContents },
      });
      if (error) {
        const msg = (error as any).message || "";
        if (msg.includes("429")) toast.error("AI 太忙啦，稍后再试");
        else if (msg.includes("402")) toast.error("AI 额度已用完");
        else toast.error("生成失败，请稍后重试");
        return;
      }
      if (data?.error) { toast.error(data.error); return; }
      await addBoard(data);
      setTopicInput("");
      setIsCreating(false);
      toast.success(`「${data.title}」看板已生成！`);
    } catch { toast.error("网络错误，请重试"); } finally { setIsGenerating(false); }
  };

  const totalAmount = allBilling.reduce((sum, i) => sum + i.amount, 0);

  if (showDetail) {
    return (
      <BillingDetailView
        billingItems={allBilling}
        setBillingItems={setExtraBilling as any}
        onBack={() => setShowDetail(false)}
        onNavigateToDiary={onNavigateToDiary}
      />
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <div><h1 className="text-2xl font-black text-foreground font-cangpin">看板</h1></div>
        <button onClick={() => { setIsCreating(!isCreating); if (isCreating) setTopicInput(""); }} className={`px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform ${isCreating ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
          <Sparkles size={14} /><span className="text-xs font-bold">AI看板</span>
        </button>
      </div>

      {isCreating && (
        <div className="px-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-foreground">AI 自动生成看板</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">输入话题，AI 将从日记中提取生成</p>
              </div>
            </div>
            <input type="text" placeholder="输入话题，如：电影、游戏、美食..." className="w-full bg-secondary border border-border rounded-2xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-muted-foreground/40 mb-3" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()} maxLength={20} autoFocus />
            <div className="flex flex-wrap gap-2 mb-4">
              {["电影", "游戏", "运动", "美食", "阅读", "音乐"].map((tag) => (
                <button key={tag} onClick={() => setTopicInput(tag)} className="text-[11px] bg-secondary text-muted-foreground px-3 py-1.5 rounded-full font-medium hover:bg-muted-foreground/10 transition-colors">{tag}</button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={!topicInput.trim() || isGenerating} className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform text-sm">
              {isGenerating ? (<><Loader2 size={16} className="animate-spin" />AI 正在分析日记...</>) : (<><Sparkles size={16} />生成看板</>)}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 space-y-4">
        {boards.map((board) => (
          <div key={board.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative group">
            <button onClick={() => removeBoard(board.id)} className="absolute top-3 right-3 text-muted-foreground/20 group-hover:text-muted-foreground transition-colors"><Trash2 size={14} /></button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{board.emoji}</span>
              <span className="text-sm font-bold text-foreground">{board.title}</span>
              <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold ml-1">AI生成</span>
            </div>
            <ul className="space-y-1.5 mb-3">
              {(board.items || []).map((item: any, i: number) => (<li key={i} className="text-xs text-foreground/70 flex items-center gap-2"><div className="w-1 h-1 bg-muted-foreground/20 rounded-full flex-shrink-0" />{item.text}</li>))}
            </ul>
            {board.summary && <p className="text-[10px] text-muted-foreground/40 italic border-t border-border pt-2">{board.summary}</p>}
          </div>
        ))}

        {/* Monthly expense */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-accent" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">本月支出</span>
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">¥{totalAmount.toLocaleString()}</h2>
          {totalAmount > 0 ? (
            <div className="space-y-3">
              {["餐饮", "交通", "娱乐", "生活", "购物"].map((cat) => {
                const catTotal = allBilling.filter((i) => i.category === cat).reduce((s, i) => s + i.amount, 0);
                if (catTotal === 0) return null;
                const pct = Math.round((catTotal / totalAmount) * 100);
                const colors: Record<string, string> = { "餐饮": "bg-accent", "交通": "bg-companion-indigo-text", "娱乐": "bg-companion-green-text", "生活": "bg-companion-amber-text", "购物": "bg-intimacy" };
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{cat}</span>
                    <div className="h-1.5 bg-secondary rounded-full flex-1 overflow-hidden">
                      <div className={`h-full ${colors[cat] || "bg-muted-foreground"} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-14 text-right">¥{catTotal}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50">还没有账单，写日记时记录金额吧</p>
          )}
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground/40 italic">来自 {allBilling.length} 条日记自动提取</span>
            <button onClick={() => setShowDetail(true)} className="text-[10px] font-bold text-primary bg-secondary px-2.5 py-1 rounded-lg active:scale-95 transition-transform">查看明细</button>
          </div>
        </div>

        {/* Mood chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Smile size={16} className="text-companion-green-text" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">情绪气象站</span>
          </div>
          <div className="h-28 flex items-end justify-between gap-1">
            {moodData.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer">
                <div className="relative w-full">
                  <div className="w-full bg-companion-green rounded-t transition-all group-hover:bg-companion-green-text" style={{ height: `${val * 1.1}px` }} />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-primary-foreground text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{moodLabels[idx]}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-muted-foreground/30 uppercase tracking-widest font-bold">
            <span>月初</span><span>今日</span>
          </div>
        </div>

        {/* 电影看板 - keeps as static example until user has movie tagged entries */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Film size={16} className="text-accent" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">电影</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
            {[
              { title: "沙丘 2", image: movieDune2, excerpt: "视觉效果真的太震撼了，沙虫出场那一幕直接起鸡皮疙瘩…" },
              { title: "周处除三害", image: movieZhouchuchusanhai, excerpt: "被阮经天的演技惊到了，邪教戏份拍得太好了…" },
              { title: "你想活出怎样的人生", image: movieGhibli, excerpt: "宫崎骏最后的作品，画面美得像梦境…" },
            ].map((movie) => (
              <div
                key={movie.title}
                className="flex-shrink-0 w-36 cursor-pointer active:scale-95 transition-transform"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="rounded-xl overflow-hidden aspect-[3/4] mb-2">
                  <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xs font-bold text-foreground mb-0.5 truncate">《{movie.title}》</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{movie.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
