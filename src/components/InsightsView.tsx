import { Wallet, Smile, Film, MapPin, BookOpen } from "lucide-react";

const InsightsView = () => {
  const moodData = [40, 60, 30, 80, 45, 90, 70, 50, 65, 85, 55, 75];
  const moodLabels = ["好奇", "开心", "低落", "愉快", "平静", "兴奋", "满足", "空虚", "温暖", "期待", "疲惫", "释然"];

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-black text-foreground">看板</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">
          Life Insights
        </p>
      </div>

      <div className="px-4 space-y-4">
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
    </div>
  );
};

export default InsightsView;
