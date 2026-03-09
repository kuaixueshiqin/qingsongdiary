import { useState } from "react";
import { Compass, Users, Heart, Search, Settings } from "lucide-react";
import { companions, squareAgents } from "@/lib/data";

const CompanionsView = () => {
  const [view, setView] = useState<"my" | "square">("my");

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
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
            view === "square"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {view === "my" ? <Compass size={14} /> : <Users size={14} />}
          {view === "my" ? "发现广场" : "我的伙伴"}
        </button>
      </div>

      <div className="px-4 space-y-3">
        {view === "my" ? (
          companions.map((comp) => (
            <div
              key={comp.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 ${comp.colorClass} rounded-2xl flex items-center justify-center text-3xl`}>
                  {comp.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{comp.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/30">
                      Lv.{comp.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{comp.role}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                    回复时延: {comp.delay}
                  </p>
                </div>
              </div>

              {/* Intimacy bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-1 text-intimacy">
                    <Heart size={10} fill="currentColor" /> 亲密度
                  </div>
                  <span className="text-muted-foreground/40">{comp.intimacy}/100</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-intimacy rounded-full transition-all duration-1000"
                    style={{ width: `${comp.intimacy}%` }}
                  />
                </div>
              </div>

              <button className="absolute top-4 right-4 text-muted-foreground/20 hover:text-muted-foreground">
                <Settings size={14} />
              </button>
            </div>
          ))
        ) : (
          <>
            <div className="relative mb-1">
              <input
                placeholder="搜索全球智能体..."
                className="w-full bg-secondary border-none rounded-2xl py-3 px-10 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
              />
              <Search className="absolute left-3 top-3 text-muted-foreground/30" size={18} />
            </div>
            {squareAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm"
              >
                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-2xl">
                  {agent.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{agent.name}</h4>
                      <p className="text-[10px] text-muted-foreground/40">by {agent.creator}</p>
                    </div>
                    <div className="flex items-center gap-1 text-intimacy font-bold text-[10px]">
                      <Heart size={10} fill="currentColor" />
                      {agent.likes}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] bg-companion-indigo text-companion-indigo-text px-2 py-0.5 rounded-full font-bold">
                      {agent.role}
                    </span>
                    <button className="ml-auto text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-lg font-bold">
                      带TA回家
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanionsView;
