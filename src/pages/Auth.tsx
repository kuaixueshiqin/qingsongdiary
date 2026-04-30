import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileShell from "@/components/MobileShell";
import { toast } from "@/hooks/use-toast";

const credSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址").max(255),
  password: z.string().min(6, "密码至少 6 位").max(72, "密码过长"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: "请检查输入",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({ title: "欢迎加入", description: "账号已创建，正在为你打开松果林..." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      const msg = err?.message ?? "";
      let friendly = msg;
      if (msg.includes("Invalid login")) friendly = "邮箱或密码不正确";
      else if (msg.includes("already registered")) friendly = "该邮箱已被注册，请直接登录";
      else if (msg.includes("Password should")) friendly = "密码强度不足";
      toast({ title: "出了点小问题", description: friendly, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col px-7 pt-20 pb-8 relative z-10">
        {/* Brand */}
        <div className="mb-12">
          <div className="text-5xl mb-4">🌲</div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight">
            欢迎来到<br />轻松书
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            囤下每一个温柔的瞬间，<br />在冬天收获一大筐松果。
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/70 px-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full h-12 px-4 rounded-2xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 focus:bg-card transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/70 px-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full h-12 px-4 rounded-2xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 focus:bg-card transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-foreground text-background text-sm font-bold mt-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {submitting ? "请稍候..." : mode === "signup" ? "创建账号" : "登 录"}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-xs text-muted-foreground"
          >
            {mode === "signin" ? (
              <>还没有账号？<span className="text-foreground font-bold ml-1">去注册</span></>
            ) : (
              <>已经有账号？<span className="text-foreground font-bold ml-1">去登录</span></>
            )}
          </button>
        </div>

        {/* Footer hint */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            登录即表示你认可与松果林的<br />温柔约定 · 数据仅你可见
          </p>
        </div>
      </div>
    </MobileShell>
  );
};

export default Auth;
