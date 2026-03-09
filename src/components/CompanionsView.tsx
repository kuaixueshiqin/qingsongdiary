import { useState } from "react";
import { Compass, Users, Heart, Search, Settings, X, ChevronLeft, Check } from "lucide-react";
import { companions as initialCompanions, squareAgents, type Companion } from "@/lib/data";
import { toast } from "sonner";

const CompanionsView = () => {
  const [view, setView] = useState<"my" | "square">("my");
  const [myCompanions, setMyCompanions] = useState<Companion[]>(initialCompanions);
  const [settingsFor, setSettingsFor] = useState<Companion | null>(null);
  const [addedAgents, setAddedAgents] = useState<string[]>([]);

  const handleToggleCompanion = (id: string, enabled: boolean) => {
    toast.success(enabled ? "已启用该伙伴的互动" : "已暂停该伙伴的互动");
  };

  const handleAddAgent = (agent: typeof squareAgents[0]) => {
    if (addedAgents.includes(agent.id)) {
      toast("已经添加过了哦");
      return;
    }
    setAddedAgents((prev) => [...prev, agent.id]);
    const newComp: Companion = {
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      colorClass: "bg-secondary",
      textColorClass: "text-foreground",
      role: agent.role,
      bio: `来自广场 · by ${agent.creator}`,
      intimacy: 0,
      level: 1,
      lastMsg: "你好呀，我是新来的！",
      delay: "随机",
    };
    setMyCompanions((prev) => [...prev, newComp]);
    toast.success(`${agent.name} 已加入你的密友列表！`);
  };

  // Settings panel
  if (settingsFor) {
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => setSettingsFor(null)} className="text-muted-foreground"><ChevronLeft size={24} /></button>
          <span className="text-sm font-bold text-foreground">{settingsFor.name} · 设置</span>
        </div>
        <div className="px-4 space-y-4">
          {/* Profile card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <div className={`w-20 h-20 ${settingsFor.colorClass} rounded-2xl flex items-center justify-center text-5xl mx-auto mb-3`}>{settingsFor.avatar}</div>
            <h3 className="text-lg font-black text-foreground">{settingsFor.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{settingsFor.role}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">{settingsFor.bio}</p>
            <div className="mt-4 flex justify-center gap-4 text-[10px]">
              <div className="text-center">
                <span className="font-black text-foreground text-lg">Lv.{settingsFor.level}</span>
                <p className="text-muted-foreground/40">等级</p>
              </div>
              <div className="text-center">
                <span className="font-black text-intimacy text-lg">{settingsFor.intimacy}</span>
                <p className="text-muted-foreground/40">亲密度</p>
              </div>
            </div>
          </div>

          {/* Settings options */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <SettingRow label="互动开关" description="暂停后该伙伴不会在日记中评论" defaultOn onToggle={(v) => handleToggleCompanion(settingsFor.id, v)} />
            <SettingRow label="关注情感" description="更多关注你的情绪状态" defaultOn onToggle={() => toast.success("偏好已更新")} />
            <SettingRow label="关注财务" description="更多关注消费和理财" defaultOn={false} onToggle={() => toast.success("偏好已更新")} />
            <SettingRow label="关注工作" description="更多关注职场和事业" defaultOn={false} onToggle={() => toast.success("偏好已更新")} />
          </div>

          {/* Remove */}
          <button onClick={() => {
            setMyCompanions((prev) => prev.filter((c) => c.id !== settingsFor.id));
            setSettingsFor(null);
            toast.success(`已移除 ${settingsFor.name}`);
          }} className="w-full text-center text-xs text-destructive/60 py-3">
            移除该伙伴
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">密友</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">
            {view === "my" ? "My Companions" : "Agents Square"}
          </p>
        </div>
        <button
          onClick={() => setView(view === "my" ? "square" : "my")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${view === "square" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          {view === "my" ? <Compass size={14} /> : <Users size={14} />}
          {view === "my" ? "发现广场" : "我的伙伴"}
        </button>
      </div>

      <div className="px-4 space-y-3">
        {view === "my" ? (
          myCompanions.map((comp) => (
            <div key={comp.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 ${comp.colorClass} rounded-2xl flex items-center justify-center text-3xl`}>{comp.avatar}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{comp.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/30">Lv.{comp.level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{comp.role}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">回复时延: {comp.delay}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-1 text-intimacy"><Heart size={10} fill="currentColor" /> 亲密度</div>
                  <span className="text-muted-foreground/40">{comp.intimacy}/100</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-intimacy rounded-full transition-all duration-1000" style={{ width: `${comp.intimacy}%` }} />
                </div>
              </div>
              <button onClick={() => setSettingsFor(comp)} className="absolute top-4 right-4 text-muted-foreground/20 hover:text-muted-foreground active:scale-90 transition-all">
                <Settings size={14} />
              </button>
            </div>
          ))
        ) : (
          <>
            <div className="relative mb-1">
              <input placeholder="搜索全球智能体..." className="w-full bg-secondary border-none rounded-2xl py-3 px-10 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
              <Search className="absolute left-3 top-3 text-muted-foreground/30" size={18} />
            </div>
            {squareAgents.map((agent) => {
              const isAdded = addedAgents.includes(agent.id);
              return (
                <div key={agent.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-2xl">{agent.avatar}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{agent.name}</h4>
                        <p className="text-[10px] text-muted-foreground/40">by {agent.creator}</p>
                      </div>
                      <div className="flex items-center gap-1 text-intimacy font-bold text-[10px]"><Heart size={10} fill="currentColor" />{agent.likes}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] bg-companion-indigo text-companion-indigo-text px-2 py-0.5 rounded-full font-bold">{agent.role}</span>
                      <button
                        onClick={() => handleAddAgent(agent)}
                        disabled={isAdded}
                        className={`ml-auto text-[10px] px-3 py-1 rounded-lg font-bold transition-all ${isAdded ? "bg-companion-green text-companion-green-text" : "bg-primary text-primary-foreground active:scale-95"}`}
                      >
                        {isAdded ? <span className="flex items-center gap-1"><Check size={10} />已添加</span> : "带TA回家"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

// Toggle setting row
const SettingRow = ({ label, description, defaultOn, onToggle }: { label: string; description: string; defaultOn: boolean; onToggle: (v: boolean) => void }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-b-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground/40">{description}</p>
      </div>
      <button
        onClick={() => { setOn(!on); onToggle(!on); }}
        className={`w-10 h-6 rounded-full transition-colors relative ${on ? "bg-companion-green-text" : "bg-border"}`}
      >
        <div className={`w-4 h-4 bg-card rounded-full absolute top-1 transition-all shadow-sm ${on ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );
};

export default CompanionsView;
