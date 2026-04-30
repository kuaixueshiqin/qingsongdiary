import { useState, useEffect, useRef } from "react";
import { ChevronRight, Edit2, Check, BookOpen, Mail, Users, Camera, LogOut, Upload, Loader2, Shield, Lock } from "lucide-react";
import { companions } from "@/lib/data";
import { useDiaryEntries } from "@/hooks/useUserData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const AVATAR_OPTIONS = ["😊", "🧑‍💻", "🌻", "🐼", "🦁", "🌊", "🎨", "🚀"];

const isImageUrl = (s: string) => !!s && (s.startsWith("http") || s.startsWith("blob:"));

const ProfileView = () => {
  const { user, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("记录生活，温柔前行 🌿");
  const [avatar, setAvatar] = useState("🌿");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [aiConsent, setAiConsent] = useState(true);
  const [savingConsent, setSavingConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nickname, avatar_url, pinecones")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.nickname) setName(data.nickname);
          if (data.avatar_url) setAvatar(data.avatar_url);
          setPinecones(data.pinecones ?? 0);
        }
      });
  }, [user]);

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
  const notesCount = entries.length;
  const lettersCount = 7;

  const recentVisitors = companions.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    colorClass: c.colorClass,
    lastTime: c.delay,
  }));

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
          <StatCard icon={<span className="text-sm">🌰</span>} label="松果" value={pinecones} color="text-companion-amber-text" bg="bg-companion-amber" />
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
          <SettingLink label="隐私设置" />
          <SettingLink label="通知偏好" />
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

export default ProfileView;
