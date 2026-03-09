import { useState } from "react";
import { Wallet, Smile, Film, MapPin, BookOpen, Sparkles, X, Plus, Loader2, Trash2 } from "lucide-react";
import { diaryEntries } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomBoard {
  id: string;
  title: string;
  emoji: string;
  items: { text: string }[];
  summary: string;
}

const InsightsView = () => {
  const moodData = [40, 60, 30, 80, 45, 90, 70, 50, 65, 85, 55, 75];
  const moodLabels = ["好奇", "开心", "低落", "愉快", "平静", "兴奋", "满足", "空虚", "温暖", "期待", "疲惫", "释然"];

  const [isCreating, setIsCreating] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customBoards, setCustomBoards] = useState<CustomBoard[]>([]);

  const handleGenerate = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);

    try {
      const diaryContents = diaryEntries
        .map((e) => `[${e.date} ${e.time}] ${e.content}`)
        .join("\n\n");

      const { data, error } = await supabase.functions.invoke("generate-board", {
        body: { topic: topicInput.trim(), diaryContents },
      });

      if (error) {
        console.error("Function error:", error);
        toast.error("生成失败，请稍后重试");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const newBoard: CustomBoard = {
        id: Date.now().toString(),
        title: data.title,
        emoji: data.emoji,
        items: data.items,
        summary: data.summary,
      };

      setCustomBoards((prev) => [newBoard, ...prev]);
      setTopicInput("");
      setIsCreating(false);
      toast.success(`「${data.title}」看板已生成！`);
    } catch (err) {
      console.error(err);
      toast.error("网络错误，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeBoard = (id: string) => {
    setCustomBoards((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-foreground">看板</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">
            Life Insights
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary text-primary-foreground px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Sparkles size={14} />
          <span className="text-xs font-bold">AI看板</span>
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* AI Custom Boards */}
        {customBoards.map((board) => (
          <div key={board.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative group">
            <button
              onClick={() => removeBoard(board.id)}
              className="absolute top-3 right-3 text-muted-foreground/20 group-hover:text-muted-foreground transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{board.emoji}</span>
              <span className="text-sm font-bold text-foreground">{board.title}</span>
              <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold ml-1">
                AI生成
              </span>
            </div>
            <ul className="space-y-1.5 mb-3">
              {board.items.map((item, i) => (
                <li key={i} className="text-xs text-foreground/70 flex items-center gap-2">
                  <div className="w-1 h-1 bg-muted-foreground/20 rounded-full flex-shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground/40 italic border-t border-border pt-2">
              {board.summary}
            </p>
          </div>
        ))}

        {/* Monthly expense */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-accent" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">本月支出</span>
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">¥2,480</h2>
          <div className="space-y-3">
            {[
              { label: "餐饮美食", amount: 1280, pct: 75, color: "bg-accent" },
              { label: "交通出行", amount: 340, pct: 25, color: "bg-companion-indigo-text" },
              { label: "娱乐休闲", amount: 560, pct: 40, color: "bg-companion-green-text" },
              { label: "生活用品", amount: 300, pct: 22, color: "bg-companion-amber-text" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{item.label}</span>
                <div className="h-1.5 bg-secondary rounded-full flex-1 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-14 text-right">¥{item.amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground/40 italic">来自 12 条日记自动提取</span>
            <button className="text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
              查看明细
            </button>
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
                  <div
                    className="w-full bg-companion-green rounded-t transition-all group-hover:bg-companion-green-text"
                    style={{ height: `${val * 1.1}px` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-primary-foreground text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {moodLabels[idx]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-muted-foreground/30 uppercase tracking-widest font-bold">
            <span>月初</span>
            <span>今日</span>
          </div>
        </div>

        {/* Life footprints */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">生活足迹</span>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-bold mb-2">
                <Film size={10} /> 电影
              </div>
              <ul className="space-y-1 text-xs text-foreground/70">
                <li>《沙丘 2》</li>
                <li>《周处除三害》</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-bold mb-2">
                <MapPin size={10} /> 地点
              </div>
              <ul className="space-y-1 text-xs text-foreground/70">
                <li>静安公园</li>
                <li>日料 · �的山</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-bold mb-2">
                <BookOpen size={10} /> 关键词
              </div>
              <div className="flex flex-wrap gap-1">
                {["加班", "日料", "成长", "失眠"].map((w) => (
                  <span key={w} className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[9px] font-medium">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create board modal */}
      {isCreating && (
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm z-[110] flex items-end">
          <div className="bg-card w-full rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-black text-foreground">AI 自动生成看板</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">输入你关注的话题，AI 将从日记中提取生成</p>
              </div>
              <button onClick={() => { setIsCreating(false); setTopicInput(""); }} className="text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="输入话题，如：电影、游戏、美食、运动..."
              className="w-full bg-secondary border border-border rounded-2xl py-3.5 px-5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-muted-foreground/40 mb-3"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              maxLength={20}
              autoFocus
            />

            <div className="flex flex-wrap gap-2 mb-5">
              {["电影", "游戏", "运动", "美食", "阅读", "音乐"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTopicInput(tag)}
                  className="text-[11px] bg-secondary text-muted-foreground px-3 py-1.5 rounded-full font-medium hover:bg-muted-foreground/10 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topicInput.trim() || isGenerating}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI 正在分析日记...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  生成看板
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsView;
