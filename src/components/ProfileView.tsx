import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronRight, Edit2, Check, BookOpen, Mail, Users, Camera, LogOut, Upload, Loader2, Shield, Lock, Bell, MessageCircle, Mailbox, KeyRound, Eye, EyeOff } from "lucide-react";
import { companions as builtInCompanions } from "@/lib/data";
import { useDiaryEntries, useCustomCompanions } from "@/hooks/useUserData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import PineconeShop from "@/components/PineconeShop";
import PineconeTransactionsView from "@/components/PineconeTransactionsView";

const AVATAR_OPTIONS = ["😊", "🧑‍💻", "🌻", "🐼", "🦁", "🌊", "🎨", "🚀"];

const isImageUrl = (s: string) => !!s && (s.startsWith("http") || s.startsWith("blob:"));

type NotifPrefs = {
  enabled: boolean;
  comments: Record<string, boolean>;
  mailbox: Record<string, boolean>;
};
const DEFAULT_PREFS: NotifPrefs = { enabled: true, comments: {}, mailbox: {} };

const ProfileView = () => {
  const { user, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("记录生活，温柔前行 🌿");
  const [avatar, setAvatar] = useState("🌿");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [aiConsent, setAiConsent] = useState(true);
  const [savingConsent, setSavingConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "密码至少 6 位", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "两次输入不一致", variant: "destructive" });
      return;
    }
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPwd(false);
    if (error) {
      toast({ title: "修改失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "密码已更新" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const saveAvatar = async (newAvatar: string) => {
    if (!user) return;
    setAvatar(newAvatar);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: newAvatar })
      .eq("id", user.id);
    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "头像已更新" });
    }
  };

  const handleUploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "图片过大", description: "请选择 5MB 以内的图片", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      await saveAvatar(pub.publicUrl);
      setShowAvatarPicker(false);
    } catch (e: any) {
      toast({ title: "上传失败", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  const [pinecones, setPinecones] = useState(0);
  const [shopOpen, setShopOpen] = useState(false);
  const [showTxs, setShowTxs] = useState(false);

  const loadProfile = () => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nickname, avatar_url, pinecones, ai_data_consent")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.nickname) setName(data.nickname);
          if (data.avatar_url) setAvatar(data.avatar_url);
          setPinecones(data.pinecones ?? 0);
          setAiConsent(data.ai_data_consent ?? true);
        }
      });
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleToggleConsent = async (checked: boolean) => {
    if (!user) return;
    const prev = aiConsent;
    setAiConsent(checked);
    setSavingConsent(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ai_data_consent: checked })
      .eq("id", user.id);
    setSavingConsent(false);
    if (error) {
      setAiConsent(prev);
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: checked ? "已开启 AI 数据授权" : "已关闭，AI 将停止读取你的内容" });
    }
  };

  const handleToggleEdit = async () => {
    if (editing && user) {
      const { error } = await supabase
        .from("profiles")
        .update({ nickname: name.trim() || null })
        .eq("id", user.id);
      if (error) {
        toast({ title: "保存失败", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "已保存" });
    }
    setEditing(!editing);
  };

  const { entries } = useDiaryEntries();
  const { customCompanions } = useCustomCompanions();
  const allCompanions = useMemo(() => [...builtInCompanions, ...customCompanions], [customCompanions]);
  const notesCount = entries.length;
  const lettersCount = 7;

  const recentVisitors = allCompanions.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    colorClass: c.colorClass,
    lastTime: c.delay,
  }));

  // Notification preferences (per-user, persisted to localStorage)
  const [showNotif, setShowNotif] = useState(false);
  const prefsKey = user ? `notif_prefs_${user.id}` : null;
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (!prefsKey) return;
    try {
      const raw = localStorage.getItem(prefsKey);
      if (raw) setNotifPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, [prefsKey]);

  const persistPrefs = (next: NotifPrefs) => {
    setNotifPrefs(next);
    if (prefsKey) localStorage.setItem(prefsKey, JSON.stringify(next));
  };

  const isOn = (kind: "comments" | "mailbox", id: string) => notifPrefs[kind][id] !== false;
  const togglePerCompanion = (kind: "comments" | "mailbox", id: string) => {
    persistPrefs({ ...notifPrefs, [kind]: { ...notifPrefs[kind], [id]: !isOn(kind, id) } });
  };
  const allOn = (kind: "comments" | "mailbox") => allCompanions.every((c) => isOn(kind, c.id));
  const toggleAll = (kind: "comments" | "mailbox") => {
    const target = !allOn(kind);
    const map: Record<string, boolean> = {};
    allCompanions.forEach((c) => { map[c.id] = target; });
    persistPrefs({ ...notifPrefs, [kind]: map });
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <h1 className="text-2xl font-black text-foreground">我的</h1>
        
      </div>

      <div className="px-4 space-y-3">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-18 h-18 rounded-2xl flex items-center justify-center text-5xl bg-secondary shrink-0 overflow-hidden"
              style={{ width: 72, height: 72 }}
            >
              {isImageUrl(avatar) ? (
                <img src={avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                avatar
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                <Camera size={12} className="text-primary-foreground" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-secondary rounded-xl py-1.5 px-3 text-lg font-black text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <h2 className="text-lg font-black text-foreground truncate">{name}</h2>
              )}
              {editing ? (
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 w-full bg-secondary rounded-xl py-1 px-3 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{bio}</p>
              )}
            </div>
            <button
              onClick={handleToggleEdit}
              className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {editing ? <Check size={14} /> : <Edit2 size={14} />}
            </button>
          </div>

          {/* Avatar picker */}
          {showAvatarPicker && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center animate-in fade-in duration-200">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => { saveAvatar(a); setShowAvatarPicker(false); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${avatar === a ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary"}`}
                >
                  {a}
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-dashed border-primary/40 text-primary hover:bg-primary/10 ${isImageUrl(avatar) ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary"}`}
                title="上传本地图片"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<BookOpen size={16} />} label="笔记" value={notesCount} color="text-companion-green-text" bg="bg-companion-green" />
          <StatCard icon={<Mail size={16} />} label="书信" value={lettersCount} color="text-companion-indigo-text" bg="bg-companion-indigo" />
          <button onClick={() => setShopOpen(true)} className="text-left active:scale-[0.98] transition-transform">
            <StatCard icon={<span className="text-sm">🌰</span>} label="松果" value={pinecones} color="text-companion-amber-text" bg="bg-companion-amber" />
          </button>
        </div>

        {/* Recent visitors */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users size={14} className="text-muted-foreground" />
              历史访客
            </h3>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">最近与你互动的伙伴</p>
          </div>
          {recentVisitors.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0">
              <div className={`w-10 h-10 ${v.colorClass} rounded-xl flex items-center justify-center text-xl`}>{v.avatar}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{v.name}</p>
                <p className="text-[10px] text-muted-foreground/40">上次互动: {v.lastTime}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/20" />
            </div>
          ))}
        </div>

        {/* Settings links */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border hover:bg-secondary/30 transition-colors"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Shield size={14} className="text-muted-foreground" />
              隐私设置
            </span>
            <ChevronRight size={14} className={`text-muted-foreground/40 transition-transform ${showPrivacy ? "rotate-90" : ""}`} />
          </button>

          {showPrivacy && (
            <div className="px-5 py-4 bg-secondary/20 border-b border-border animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">允许 AI 读取我的内容</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">
                    开启后，伙伴们才能阅读你的日记并写下评论与回信。关闭后将停止所有 AI 互动。
                  </p>
                </div>
                <Switch
                  checked={aiConsent}
                  onCheckedChange={handleToggleConsent}
                  disabled={savingConsent}
                />
              </div>

              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-card rounded-xl border border-border">
                <Lock size={12} className="text-companion-green-text mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                  你的数据通过 HTTPS 加密传输，存储于私有数据库中，仅你本人可访问。我们承诺<span className="text-foreground font-medium">绝不会向任何第三方泄露</span>，也不会用于训练模型。
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowNotif(!showNotif)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border hover:bg-secondary/30 transition-colors"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Bell size={14} className="text-muted-foreground" />
              通知偏好
            </span>
            <ChevronRight size={14} className={`text-muted-foreground/40 transition-transform ${showNotif ? "rotate-90" : ""}`} />
          </button>

          {showNotif && (
            <div className="bg-secondary/20 border-b border-border animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">允许通知</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">关闭后将不再收到任何提醒</p>
                </div>
                <Switch
                  checked={notifPrefs.enabled}
                  onCheckedChange={(c) => persistPrefs({ ...notifPrefs, enabled: c })}
                />
              </div>

              {notifPrefs.enabled && (
                <div className="px-5 pb-4 space-y-3 animate-in fade-in duration-200">
                  <NotifGroup
                    icon={<MessageCircle size={12} className="text-companion-indigo-text" />}
                    title="评论回复通知"
                    subtitle="伙伴在你的日记下留言时提醒你"
                    companions={allCompanions}
                    isOn={(id) => isOn("comments", id)}
                    onToggle={(id) => togglePerCompanion("comments", id)}
                    allOn={allOn("comments")}
                    onToggleAll={() => toggleAll("comments")}
                  />
                  <NotifGroup
                    icon={<Mailbox size={12} className="text-companion-amber-text" />}
                    title="信箱来信通知"
                    subtitle="伙伴主动写信给你时提醒你"
                    companions={allCompanions}
                    isOn={(id) => isOn("mailbox", id)}
                    onToggle={(id) => togglePerCompanion("mailbox", id)}
                    allOn={allOn("mailbox")}
                    onToggleAll={() => toggleAll("mailbox")}
                  />
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setShowAccount(!showAccount)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border hover:bg-secondary/30 transition-colors"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <KeyRound size={14} className="text-muted-foreground" />
              账号设置
            </span>
            <ChevronRight size={14} className={`text-muted-foreground/40 transition-transform ${showAccount ? "rotate-90" : ""}`} />
          </button>

          {showAccount && (
            <div className="px-5 py-4 bg-secondary/20 border-b border-border space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div>
                <p className="text-[11px] text-muted-foreground/60 mb-1">登录邮箱</p>
                <p className="text-sm text-foreground font-medium break-all">{user?.email ?? "—"}</p>
              </div>

              <div className="space-y-2.5">
                <p className="text-sm font-bold text-foreground">修改密码</p>

                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密码（至少 6 位）"
                    maxLength={72}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                    aria-label={showPwd ? "隐藏密码" : "显示密码"}
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <input
                  type={showPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  maxLength={72}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                />

                <button
                  onClick={handleChangePassword}
                  disabled={changingPwd || !newPassword || !confirmPassword}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {changingPwd ? <><Loader2 size={14} className="animate-spin" />更新中...</> : "更新密码"}
                </button>

                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                  修改成功后，其他设备上的登录状态仍会保留，下次登录时使用新密码即可。
                </p>
              </div>
            </div>
          )}

          <SettingLink label="关于我们" />
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full bg-card border border-border rounded-2xl shadow-sm py-3.5 px-5 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={14} />
          退出登录
        </button>

        {user?.email && (
          <p className="text-center text-[10px] text-muted-foreground/50 pt-2">{user.email}</p>
        )}
      </div>
      <PineconeShop open={shopOpen} onClose={() => { setShopOpen(false); loadProfile(); }} />
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) => (
  <div className={`${bg} rounded-2xl p-4 text-center`}>
    <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>{icon}</div>
    <p className={`text-xl font-black ${color}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground/60 font-medium">{label}</p>
  </div>
);

const SettingLink = ({ label }: { label: string }) => (
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-b-0">
    <span className="text-sm text-foreground">{label}</span>
    <ChevronRight size={14} className="text-muted-foreground/20" />
  </div>
);

type NotifGroupProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  companions: { id: string; name: string; avatar: string; colorClass: string }[];
  isOn: (id: string) => boolean;
  onToggle: (id: string) => void;
  allOn: boolean;
  onToggleAll: () => void;
};

const NotifGroup = ({ icon, title, subtitle, companions, isOn, onToggle, allOn, onToggleAll }: NotifGroupProps) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">{icon}{title}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={onToggleAll}
        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${allOn ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
      >
        {allOn ? "全部关闭" : "全部开启"}
      </button>
    </div>
    {companions.length === 0 ? (
      <p className="text-[11px] text-muted-foreground/50 text-center py-4">暂无伙伴</p>
    ) : (
      companions.map((c) => (
        <div key={c.id} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border last:border-b-0">
          <div className={`w-7 h-7 ${c.colorClass} rounded-lg flex items-center justify-center text-base shrink-0`}>{c.avatar}</div>
          <span className="flex-1 text-xs text-foreground truncate">{c.name}</span>
          <Switch checked={isOn(c.id)} onCheckedChange={() => onToggle(c.id)} />
        </div>
      ))
    )}
  </div>
);

export default ProfileView;
