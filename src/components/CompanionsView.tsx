import { useState } from "react";
import { Compass, Users, Heart, Search, Settings, X, ChevronLeft, Check, Plus, Sparkles, Pencil, Wand2, Loader2, Upload, Send } from "lucide-react";
import { companions as builtInCompanions, squareAgents, type Companion } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCustomCompanions } from "@/hooks/useUserData";
import { usePinecones } from "@/hooks/usePinecones";
import PineconeShop from "@/components/PineconeShop";
import IntimacyLogView from "@/components/IntimacyLogView";

const AVATAR_OPTIONS = ["🤖", "🦊", "🐱", "🐶", "🦉", "🌸", "🔥", "💎", "🎭", "🌈", "🍀"];

const isImageAvatar = (avatar: string) => avatar.startsWith("data:image");
const COLOR_OPTIONS = [
  { colorClass: "bg-companion-green", label: "绿" },
  { colorClass: "bg-companion-indigo", label: "靛" },
  { colorClass: "bg-companion-pink", label: "粉" },
  { colorClass: "bg-accent", label: "橙" },
  { colorClass: "bg-secondary", label: "灰" },
];

const CompanionsView = () => {
  const { customCompanions, createCompanion, updateCompanion, deleteCompanion } = useCustomCompanions();
  const [view, setView] = useState<"my" | "square" | "publish">("my");
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("companion_favorites") || "[]"); } catch { return []; }
  });
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      localStorage.setItem("companion_favorites", JSON.stringify(next));
      toast.success(prev.includes(id) ? "已取消特别关注" : "已加入特别关注");
      return next;
    });
  };
  const allCompanions: Companion[] = [...builtInCompanions, ...customCompanions];
  const myCompanions: Companion[] = [
    ...allCompanions.filter((c) => favorites.includes(c.id)),
    ...allCompanions.filter((c) => !favorites.includes(c.id)),
  ];
  const [settingsFor, setSettingsFor] = useState<Companion | null>(null);
  const [intimacyFor, setIntimacyFor] = useState<Companion | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Companion | null>(null);
  const [addedAgents, setAddedAgents] = useState<string[]>([]);
  // Agent is considered owned if matched by id (this session) OR if a companion
  // with the same name already exists in the user's list (persisted purchase).
  const ownedNames = new Set(myCompanions.map((c) => c.name));
  const isAgentOwned = (agent: typeof squareAgents[0]) =>
    addedAgents.includes(agent.id) || ownedNames.has(agent.name);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAvatar, setNewAvatar] = useState("🤖");
  const [newColor, setNewColor] = useState("bg-companion-green");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");
  const [likedAgents, setLikedAgents] = useState<string[]>([]);
  const [viewingAgent, setViewingAgent] = useState<typeof squareAgents[0] | null>(null);
  const [confirmAgent, setConfirmAgent] = useState<typeof squareAgents[0] | null>(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const { balance: pineconeBalance, spend } = usePinecones();
  const [shopOpen, setShopOpen] = useState(false);
  const [shopReason, setShopReason] = useState<string | undefined>();

  const openShop = (reason?: string) => {
    setShopReason(reason);
    setShopOpen(true);
  };

  const handleGenerateAvatar = async () => {
    if (!newRole.trim()) {
      toast.error("请先填写角色定位，AI 才能生成匹配的头像");
      return;
    }
    setGeneratingAvatar(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-avatar", {
        body: { role: newRole.trim() },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setNewAvatar(data.imageUrl);
        toast.success("头像已生成！");
      } else {
        throw new Error("未获取到图片");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("头像生成失败，请重试");
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleToggleLike = (agentId: string) => {
    setLikedAgents((prev) => prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]);
  };

  const handleCreateCompanion = async () => {
    if (!newName.trim()) { toast.error("请输入伙伴名称"); return; }
    if (!newRole.trim()) { toast.error("请输入伙伴角色"); return; }
    const created = await createCompanion({
      name: newName.trim(),
      role: newRole.trim(),
      bio: newBio.trim() || "自定义伙伴",
      avatar: newAvatar,
      colorClass: newColor,
    });
    if (!created) { toast.error("创建失败"); return; }
    setShowCreate(false);
    setNewName(""); setNewRole(""); setNewBio(""); setNewAvatar("🤖"); setNewColor("bg-companion-green");
    toast.success(`${newName.trim()} 已创建并加入伙伴列表！`);
  };

  const handleToggleCompanion = (id: string, enabled: boolean) => {
    toast.success(enabled ? "已启用该伙伴的互动" : "已暂停该伙伴的互动");
  };

  const handleAddAgent = async (agent: typeof squareAgents[0]) => {
    if (isAgentOwned(agent)) {
      toast("已经添加过了哦");
      return;
    }
    setAddedAgents((prev) => [...prev, agent.id]);
    await createCompanion({
      name: agent.name,
      role: agent.role,
      bio: `来自广场 · by ${agent.creator}`,
      avatar: agent.avatar,
      colorClass: "bg-secondary",
    });
    toast.success(`${agent.name} 已加入你的伙伴列表！`);
  };

  const requestAddAgent = (agent: typeof squareAgents[0]) => {
    if (isAgentOwned(agent)) {
      toast("已经添加过了哦");
      return;
    }
    setConfirmAgent(agent);
  };

  const confirmAddAgent = async () => {
    if (!confirmAgent) return;
    const agent = confirmAgent;
    // Re-check funds atomically and deduct
    const result = await spend(agent.pinecones, "companion_unlock", `解锁伙伴 ${agent.name}`);
    if (!result.ok) {
      setConfirmAgent(null);
      if (result.insufficient) {
        openShop(`差一点～购买 ${agent.name} 需要 ${agent.pinecones} 松果，去补充一下吧`);
      }
      return;
    }
    setConfirmAgent(null);
    await handleAddAgent(agent);
  };

  // Agent detail view
  if (viewingAgent) {
    const isAdded = isAgentOwned(viewingAgent);
    const isLiked = likedAgents.includes(viewingAgent.id);
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => setViewingAgent(null)} className="text-muted-foreground"><ChevronLeft size={24} /></button>
          <span className="text-sm font-bold text-foreground">伙伴详情</span>
        </div>
        <div className="px-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center text-5xl mx-auto mb-3">{viewingAgent.avatar}</div>
            <h3 className="text-lg font-black text-foreground">{viewingAgent.name}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-companion-indigo text-companion-indigo-text">{viewingAgent.role}</span>
            <p className="text-[10px] text-muted-foreground/40 mt-1">by {viewingAgent.creator}</p>
            <div className="flex justify-center gap-6 mt-4 text-[10px]">
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => handleToggleLike(viewingAgent.id)} className="flex items-center gap-1 transition-transform active:scale-90">
                  <Heart size={16} className={isLiked ? "text-intimacy" : "text-muted-foreground/30"} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-muted-foreground/40 font-medium">{viewingAgent.likes}</span>
                </button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-base">🌰</span>
                  <span className="text-muted-foreground/40 font-medium">{viewingAgent.pinecones} 松果</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-foreground mb-2">人设介绍</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{viewingAgent.bio}</p>
          </div>
          <button
            onClick={() => { requestAddAgent(viewingAgent); }}
            disabled={isAdded}
            className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isAdded ? "bg-companion-green text-companion-green-text" : "bg-primary text-primary-foreground"}`}
          >
            {isAdded ? <><Check size={16} />已添加</> : <>🌰 花 {viewingAgent.pinecones} 松果带TA回家</>}
          </button>
        </div>
        {confirmAgent && <ConfirmPurchaseModal agent={confirmAgent} balance={pineconeBalance} onCancel={() => setConfirmAgent(null)} onConfirm={confirmAddAgent} onTopUp={() => { const a = confirmAgent; setConfirmAgent(null); openShop(`差一点～购买 ${a.name} 需要 ${a.pinecones} 松果`); }} />}
        <PineconeShop open={shopOpen} onClose={() => setShopOpen(false)} reason={shopReason} />
      </div>
    );
  }

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
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center relative">
            <div className={`w-20 h-20 ${settingsFor.colorClass} rounded-2xl flex items-center justify-center text-5xl mx-auto mb-3 overflow-hidden`}>
              {isImageAvatar(settingsFor.avatar) ? <img src={settingsFor.avatar} alt="" className="w-full h-full object-cover" /> : settingsFor.avatar}
            </div>
            {editingProfile ? (
              <div className="space-y-3 text-left">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">名称</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-secondary rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">角色</label>
                  <input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-secondary rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">人设描述</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className="w-full bg-secondary rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                </div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setEditingProfile(false)} className="text-xs bg-secondary px-4 py-1.5 rounded-lg text-muted-foreground">取消</button>
                  <button onClick={async () => {
                    if (!editName.trim()) { toast.error("名称不能为空"); return; }
                    const updated = { ...settingsFor, name: editName.trim(), role: editRole.trim(), bio: editBio.trim() };
                    const isBuiltIn = builtInCompanions.some((c) => c.id === settingsFor.id);
                    if (!isBuiltIn) {
                      await updateCompanion(settingsFor.id, { name: updated.name, role: updated.role, bio: updated.bio });
                    }
                    setSettingsFor(updated);
                    setEditingProfile(false);
                    toast.success(isBuiltIn ? "内置伙伴的人设暂不可保存" : "人设已保存");
                  }} className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-bold">保存</button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-black text-foreground">{settingsFor.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{settingsFor.role}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">{settingsFor.bio}</p>
                <button onClick={() => { setEditingProfile(true); setEditName(settingsFor.name); setEditRole(settingsFor.role); setEditBio(settingsFor.bio); }} className="absolute top-4 right-4 text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                  <Pencil size={14} />
                </button>
              </>
            )}
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
            const isBuiltIn = builtInCompanions.some((c) => c.id === settingsFor.id);
            if (isBuiltIn) {
              toast.error("内置伙伴无法移除");
              return;
            }
            setConfirmRemove(settingsFor);
          }} className="w-full text-center text-xs text-destructive/60 py-3">
            移除该伙伴
          </button>
        </div>

        {confirmRemove && (
          <ConfirmRemoveModal
            agent={confirmRemove}
            onCancel={() => setConfirmRemove(null)}
            onConfirm={async () => {
              const target = confirmRemove;
              setConfirmRemove(null);
              await deleteCompanion(target.id);
              setSettingsFor(null);
              toast.success(`已移除 ${target.name}`);
            }}
          />
        )}
      </div>
    );
  }

  // Create companion panel
  if (showCreate) {
    return (
      <div className="pb-4 animate-in slide-in-from-right duration-300">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => setShowCreate(false)} className="text-muted-foreground"><ChevronLeft size={24} /></button>
          <span className="text-sm font-bold text-foreground">自定义伙伴</span>
        </div>
        <div className="px-4 space-y-4">
          {/* Avatar picker */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center">
            <div className={`w-20 h-20 ${newColor} rounded-2xl flex items-center justify-center text-5xl mx-auto mb-3 overflow-hidden`}>
              {isImageAvatar(newAvatar) ? (
                <img src={newAvatar} alt="AI头像" className="w-full h-full object-cover" />
              ) : newAvatar}
            </div>
            <p className="text-[10px] text-muted-foreground/40 mb-2">选择头像</p>
            <div className="flex flex-wrap justify-center gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button key={a} onClick={() => setNewAvatar(a)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newAvatar === a ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary"}`}
                >{a}</button>
              ))}
              <button
                onClick={handleGenerateAvatar}
                disabled={generatingAvatar}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isImageAvatar(newAvatar) ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary"} ${generatingAvatar ? "opacity-60" : "hover:bg-primary/10"}`}
              >
                {generatingAvatar ? <Loader2 size={18} className="animate-spin text-primary" /> : <Wand2 size={18} className="text-primary" />}
                <span className="absolute -top-1 -right-1 text-[7px] font-black bg-primary text-primary-foreground px-1 rounded leading-tight">AI</span>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-4 mb-2">选择颜色</p>
            <div className="flex justify-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c.colorClass} onClick={() => setNewColor(c.colorClass)}
                  className={`w-8 h-8 ${c.colorClass} rounded-full transition-all ${newColor === c.colorClass ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground">名称 *</label>
              <textarea value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="给TA起个名字" rows={1}
                onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                className="mt-1 w-full bg-secondary rounded-xl py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden leading-snug" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">角色定位 *</label>
              <textarea value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="如：健身教练、读书伙伴、理财顾问" rows={1}
                onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                className="mt-1 w-full bg-secondary rounded-xl py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden leading-snug" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">个性签名</label>
              <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="描述TA的性格或口头禅" rows={1}
                onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                className="mt-1 w-full bg-secondary rounded-xl py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden leading-snug" />
            </div>
          </div>

          <button onClick={handleCreateCompanion}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Sparkles size={16} /> 创建伙伴
          </button>
        </div>
      </div>
    );
  }

  // Publish to square (only user-created custom companions are eligible)
  if (view === "publish") {
    const eligible = customCompanions.filter(
      (c) => !c.bio?.startsWith("来自广场")
    );
    return (
      <div className="pb-4">
        <div className="px-6 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => setView("square")} className="text-muted-foreground active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-foreground">发布到广场</h1>
        </div>
        <div className="px-4">
          <p className="text-[11px] text-muted-foreground/60 mb-3 px-1 leading-relaxed">
            选择一位你自定义的伙伴分享到广场。被其他用户领养时，你将获得松果分成。
          </p>
          <div className="space-y-3">
            {eligible.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  你还没有自定义的伙伴<br />先去创建一个吧
                </p>
              </div>
            ) : (
              eligible.map((comp) => {
                const published = publishedIds.includes(comp.id);
                return (
                  <div key={comp.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className={`w-12 h-12 ${comp.colorClass} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden`}>
                      {isImageAvatar(comp.avatar) ? <img src={comp.avatar} alt="" className="w-full h-full object-cover" /> : comp.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{comp.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${comp.colorClass} ${comp.textColorClass} flex-shrink-0`}>{comp.role}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 truncate">{comp.bio}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (published) return;
                        setPublishedIds((prev) => [...prev, comp.id]);
                        toast.success(`${comp.name} 已发布到广场！`);
                      }}
                      disabled={published}
                      className={`flex-shrink-0 text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${published ? "bg-companion-green text-companion-green-text" : "bg-primary text-primary-foreground active:scale-95"}`}
                    >
                      {published ? <><Check size={11} />已发布</> : <><Send size={11} />发布</>}
                    </button>
                  </div>
                );
              })
            )}

            {/* Custom companion entry — same as on companions list */}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-muted-foreground hover:border-muted-foreground/40 active:scale-[0.98] transition-all"
            >
              <Plus size={24} />
              <span className="text-xs font-bold">自定义伙伴</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Square as a secondary page
  if (view === "square") {
    return (
      <div className="pb-4">
        <div className="px-6 pt-14 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("my")} className="text-muted-foreground active:scale-90 transition-transform">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-black text-foreground">发现广场</h1>
          </div>
          <button
            onClick={() => setView("publish")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground active:scale-95 transition-all"
          >
            <Upload size={13} />
            发布
          </button>
        </div>
        <div className="px-4 space-y-3">
          <div className="relative mb-1">
            <input placeholder="搜索全球智能体..." className="w-full bg-secondary border-none rounded-2xl py-3 px-10 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            <Search className="absolute left-3 top-3 text-muted-foreground/30" size={18} />
          </div>
          {squareAgents.map((agent) => {
            const isAdded = isAgentOwned(agent);
            const isLiked = likedAgents.includes(agent.id);
            return (
              <div key={agent.id} onClick={() => setViewingAgent(agent)} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-2xl">{agent.avatar}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{agent.name}</h4>
                      <p className="text-[10px] text-muted-foreground/40">by {agent.creator}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleLike(agent.id); }} className="flex items-center gap-1 transition-transform active:scale-90">
                        <Heart size={12} className={isLiked ? "text-intimacy" : "text-muted-foreground/30"} fill={isLiked ? "currentColor" : "none"} />
                        <span className="text-[10px] text-muted-foreground/40 font-medium">{agent.likes}</span>
                      </button>
                      <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5">🌰 {agent.pinecones}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] bg-companion-indigo text-companion-indigo-text px-2 py-0.5 rounded-full font-bold">{agent.role}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); requestAddAgent(agent); }}
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
        </div>
        {confirmAgent && <ConfirmPurchaseModal agent={confirmAgent} balance={pineconeBalance} onCancel={() => setConfirmAgent(null)} onConfirm={confirmAddAgent} onTopUp={() => { const a = confirmAgent; setConfirmAgent(null); openShop(`差一点～购买 ${a.name} 需要 ${a.pinecones} 松果`); }} />}
        <PineconeShop open={shopOpen} onClose={() => setShopOpen(false)} reason={shopReason} />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">伙伴</h1>
        </div>
        <button
          onClick={() => setView("square")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all bg-secondary text-muted-foreground active:scale-95"
        >
          <Compass size={14} />
          发现广场
        </button>
      </div>

      <div className="px-4 space-y-3">
        {myCompanions.map((comp) => (
          <div key={comp.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-14 h-14 ${comp.colorClass} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden`}>
                {isImageAvatar(comp.avatar) ? <img src={comp.avatar} alt="" className="w-full h-full object-cover" /> : comp.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{comp.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${comp.colorClass} ${comp.textColorClass}`}>{comp.role}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/30 mr-14">Lv.{comp.level}</span>
                </div>
                <p className="text-xs text-muted-foreground/50 mt-1">{comp.bio}</p>
                <p className="text-[10px] text-muted-foreground/30 mt-0.5">回复时长: {comp.delay}</p>
              </div>
            </div>
            <button
              onClick={() => setIntimacyFor(comp)}
              className="w-full text-left space-y-1 active:opacity-70 transition-opacity"
              aria-label="查看亲密度记录"
            >
              <div className="flex justify-between items-center text-[10px] font-bold">
                <div className="flex items-center gap-1 text-intimacy"><Heart size={10} fill="currentColor" /> 亲密度</div>
                <span className="text-muted-foreground/40">{comp.intimacy}/100 ›</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-intimacy rounded-full transition-all duration-1000" style={{ width: `${comp.intimacy}%` }} />
              </div>
            </button>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(comp.id)}
                className={`active:scale-90 transition-all ${favorites.includes(comp.id) ? "text-intimacy" : "text-muted-foreground/20 hover:text-muted-foreground"}`}
                aria-label="特别关注"
              >
                <Heart size={14} fill={favorites.includes(comp.id) ? "currentColor" : "none"} />
              </button>
              <button onClick={() => setSettingsFor(comp)} className="text-muted-foreground/20 hover:text-muted-foreground active:scale-90 transition-all">
                <Settings size={14} />
              </button>
            </div>
          </div>
        ))}
        {/* Create custom companion card */}
        <button onClick={() => setShowCreate(true)}
          className="w-full border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-muted-foreground hover:border-muted-foreground/40 active:scale-[0.98] transition-all">
          <Plus size={24} />
          <span className="text-xs font-bold">自定义伙伴</span>
        </button>
      </div>
      {confirmAgent && <ConfirmPurchaseModal agent={confirmAgent} balance={pineconeBalance} onCancel={() => setConfirmAgent(null)} onConfirm={confirmAddAgent} onTopUp={() => { const a = confirmAgent; setConfirmAgent(null); openShop(`差一点～购买 ${a.name} 需要 ${a.pinecones} 松果`); }} />}
      <PineconeShop open={shopOpen} onClose={() => setShopOpen(false)} reason={shopReason} />
    </div>
  );
};

// Confirm purchase modal
const ConfirmPurchaseModal = ({ agent, balance, onCancel, onConfirm, onTopUp }: { agent: typeof squareAgents[0]; balance: number; onCancel: () => void; onConfirm: () => void; onTopUp: () => void }) => {
  const insufficient = balance < agent.pinecones;
  return (
    <div className="absolute inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center px-6 animate-in fade-in duration-200" onClick={onCancel}>
      <div className="w-full bg-card rounded-3xl p-6 shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-3xl mb-3">{agent.avatar}</div>
          <h3 className="text-base font-black text-foreground">带 {agent.name} 回家？</h3>
          <p className="text-xs text-muted-foreground/60 mt-1">{agent.role}</p>
          <div className="mt-4 px-4 py-2.5 bg-companion-amber rounded-2xl flex items-center gap-1.5">
            <span className="text-base">🌰</span>
            <span className="text-sm font-black text-companion-amber-text">花费 {agent.pinecones} 松果</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2">当前余额：🌰 {balance}</p>
          {insufficient ? (
            <p className="text-[11px] text-destructive font-bold mt-2">松果不足，去补充一下吧</p>
          ) : (
            <p className="text-[10px] text-muted-foreground/50 mt-1 leading-relaxed">确认后将从你的松果余额中扣除，无法撤销</p>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-secondary text-muted-foreground font-bold text-sm active:scale-[0.98] transition-transform">
            再想想
          </button>
          {insufficient ? (
            <button onClick={onTopUp} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform">
              去充值
            </button>
          ) : (
            <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform">
              确认带回家
            </button>
          )}
        </div>
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

const ConfirmRemoveModal = ({ agent, onCancel, onConfirm }: { agent: Companion; onCancel: () => void; onConfirm: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-in fade-in duration-200" onClick={onCancel}>
      <div className="w-full max-w-[360px] mx-auto bg-card rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 ${agent.colorClass} rounded-2xl flex items-center justify-center text-4xl mb-3 overflow-hidden`}>
            {typeof agent.avatar === "string" && (agent.avatar.startsWith("http") || agent.avatar.startsWith("blob:"))
              ? <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
              : agent.avatar}
          </div>
          <h3 className="text-base font-black text-foreground">确定要移除 {agent.name} 吗？</h3>
          <p className="text-[12px] text-muted-foreground/70 mt-2 leading-relaxed px-2">
            移除后 TA 将不再陪伴你，相关的对话记录与好感度会被清空，且<span className="text-destructive font-bold">无法恢复</span>。
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-2">已花费的松果不会退回</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-secondary text-foreground text-sm font-bold active:scale-[0.98] transition-transform">
            再想想
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground text-sm font-bold active:scale-[0.98] transition-transform">
            确认移除
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanionsView;
