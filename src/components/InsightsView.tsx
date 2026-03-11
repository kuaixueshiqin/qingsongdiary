import { useState, useRef } from "react";
import { Wallet, Smile, Film, Sparkles, Loader2, Trash2, ChevronLeft, X, Pencil } from "lucide-react";
import { diaryEntries } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import movieDune2 from "@/assets/movie-dune2.jpg";
import movieZhouchuchusanhai from "@/assets/movie-zhouchuchusanhai.jpg";
import movieGhibli from "@/assets/movie-ghibli.jpg";
import BillingDetailView, { type BillingItem } from "@/components/BillingDetailView";

interface CustomBoard {
  id: string;
  title: string;
  emoji: string;
  items: { text: string }[];
  summary: string;
}

interface InsightsViewProps {
  onNavigateToDiary?: (entryId: number) => void;
}

const InsightsView = ({ onNavigateToDiary }: InsightsViewProps) => {
  const moodData = [40, 60, 30, 80, 45, 90, 70, 50, 65, 85, 55, 75];
  const moodLabels = ["好奇", "开心", "低落", "愉快", "平静", "兴奋", "满足", "空虚", "温暖", "期待", "疲惫", "释然"];

  const [isCreating, setIsCreating] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customBoards, setCustomBoards] = useState<CustomBoard[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    { id: 9, date: "5月21日", amount: 0, category: "娱乐", source: "沙丘2·电影", status: "toFill" },
    { id: 10, date: "5月16日", amount: 0, category: "娱乐", source: "周处除三害·电影", status: "toFill" },
    { id: 11, date: "5月11日", amount: 0, category: "娱乐", source: "你想活出怎样的人生·电影", status: "toFill" },
    { id: 1, date: "5月20日", amount: 280, category: "餐饮", source: "日料店", status: "toConfirm" },
    { id: 4, date: "5月14日", amount: 35, category: "餐饮", source: "咖啡", status: "toConfirm" },
    { id: 8, date: "5月5日", amount: 200, category: "餐饮", source: "朋友聚餐", status: "toConfirm" },
    { id: 2, date: "5月17日", amount: 25, category: "交通", source: "打车去公园", status: "confirmed" },
    { id: 3, date: "5月15日", amount: 89, category: "购物", source: "超市采购", status: "confirmed" },
    { id: 5, date: "5月12日", amount: 560, category: "娱乐", source: "演唱会门票", status: "confirmed" },
    { id: 6, date: "5月10日", amount: 150, category: "交通", source: "高铁票", status: "confirmed" },
    { id: 7, date: "5月8日", amount: 300, category: "生活", source: "日用品", status: "confirmed" },
  ]);

  const handleGenerate = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    try {
      const diaryContents = diaryEntries.map((e) => `[${e.date} ${e.time}] ${e.content}`).join("\n\n");
      const { data, error } = await supabase.functions.invoke("generate-board", {
        body: { topic: topicInput.trim(), diaryContents },
      });
      if (error) { toast.error("生成失败，请稍后重试"); return; }
      if (data?.error) { toast.error(data.error); return; }
      setCustomBoards((prev) => [{ id: Date.now().toString(), ...data }, ...prev]);
      setTopicInput("");
      setIsCreating(false);
      toast.success(`「${data.title}」看板已生成！`);
    } catch { toast.error("网络错误，请重试"); } finally { setIsGenerating(false); }
  };

  const handleEditSave = (itemId: number) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) { toast.error("请输入有效金额"); return; }
    setBillingItems((prev) => prev.map((i) => i.id === itemId ? { ...i, amount, category: editCategory, verified: true } : i));
    setEditingItemId(null);
    toast.success("账单已更新");
  };

  const handleDeleteItem = (itemId: number) => {
    setBillingItems((prev) => prev.filter((i) => i.id !== itemId));
    toast.success("已删除");
  };

  const sortedBillingItems = [...billingItems].sort((a, b) => {
    if (a.verified === b.verified) return 0;
    return a.verified ? 1 : -1;
  });

  const totalAmount = billingItems.reduce((sum, i) => sum + i.amount, 0);

  // Detail view
  if (showDetail) {
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => { setShowDetail(false); setEditingItemId(null); }} className="text-muted-foreground"><ChevronLeft size={24} /></button>
          <div>
            <span className="text-sm font-bold text-foreground">账单明细</span>
            <span className="text-xs text-muted-foreground ml-2">共 {billingItems.length} 笔</span>
          </div>
        </div>
        <div className="px-4 space-y-2">
          {sortedBillingItems.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              {editingItemId === item.id ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground block mb-1">金额</label>
                      <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground block mb-1">分类</label>
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground">
                        <option>餐饮</option><option>交通</option><option>娱乐</option><option>购物</option><option>生活</option><option>其他</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingItemId(null)} className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground">取消</button>
                    <button onClick={() => handleEditSave(item.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold">保存</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.amount > 0 ? (
                        <span className="text-sm font-bold text-foreground">¥{item.amount}</span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground/40">待填写</span>
                      )}
                      <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{item.category}</span>
                      {!item.verified && <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold">AI待确认</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.date} · {item.source}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItemId(item.id); setEditAmount(item.amount > 0 ? String(item.amount) : ""); setEditCategory(item.category); }} className="p-1.5 bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                    {!item.verified && (
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 bg-destructive/10 rounded-lg text-destructive"><X size={14} /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-foreground">看板</h1>
          
        </div>
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
        {customBoards.map((board) => (
          <div key={board.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative group">
            <button onClick={() => { setCustomBoards((p) => p.filter((b) => b.id !== board.id)); }} className="absolute top-3 right-3 text-muted-foreground/20 group-hover:text-muted-foreground transition-colors"><Trash2 size={14} /></button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{board.emoji}</span>
              <span className="text-sm font-bold text-foreground">{board.title}</span>
              <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold ml-1">AI生成</span>
            </div>
            <ul className="space-y-1.5 mb-3">
              {board.items.map((item, i) => (<li key={i} className="text-xs text-foreground/70 flex items-center gap-2"><div className="w-1 h-1 bg-muted-foreground/20 rounded-full flex-shrink-0" />{item.text}</li>))}
            </ul>
            <p className="text-[10px] text-muted-foreground/40 italic border-t border-border pt-2">{board.summary}</p>
          </div>
        ))}

        {/* Monthly expense */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-accent" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">本月支出</span>
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">¥{totalAmount.toLocaleString()}</h2>
          <div className="space-y-3">
            {["餐饮", "交通", "娱乐", "生活", "购物"].map((cat) => {
              const catTotal = billingItems.filter((i) => i.category === cat).reduce((s, i) => s + i.amount, 0);
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
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground/40 italic">来自 {billingItems.length} 条日记自动提取</span>
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

        {/* 电影看板 */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Film size={16} className="text-accent" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">电影</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
            {[
              { id: 4, title: "沙丘 2", image: movieDune2, excerpt: "视觉效果真的太震撼了，沙虫出场那一幕直接起鸡皮疙瘩…" },
              { id: 5, title: "周处除三害", image: movieZhouchuchusanhai, excerpt: "被阮经天的演技惊到了，邪教戏份拍得太好了…" },
              { id: 6, title: "你想活出怎样的人生", image: movieGhibli, excerpt: "宫崎骏最后的作品，画面美得像梦境…" },
            ].map((movie) => (
              <div
                key={movie.id}
                onClick={() => onNavigateToDiary?.(movie.id)}
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
