import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Pinecone economy helpers.
 * - randomDrop: write/reply/letter actions trigger a 1~3 award (惊喜感)
 * - claimDailyCheckIn: streak-based daily check-in (day N => N pinecones)
 */
export function usePinecones() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [todayClaimed, setTodayClaimed] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("pinecones")
      .eq("id", user.id)
      .maybeSingle();
    if (prof) setBalance(prof.pinecones ?? 0);

    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const { data: ci } = await supabase
      .from("check_ins")
      .select("check_date, streak")
      .eq("user_id", user.id)
      .order("check_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ci) {
      setStreak(ci.streak);
      setTodayClaimed(ci.check_date === ymd);
    } else {
      setStreak(0);
      setTodayClaimed(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Award a random 1~3 pinecones for an action. Returns the awarded amount, or 0 on failure. */
  const randomDrop = useCallback(
    async (source: "diary" | "reply" | "letter", note?: string): Promise<number> => {
      if (!user) return 0;
      const amount = 1 + Math.floor(Math.random() * 3); // 1..3
      const { data, error } = await supabase.rpc("award_pinecones", {
        _amount: amount,
        _source: source,
        _note: note ?? null,
      });
      if (error) {
        console.error("award_pinecones failed", error);
        return 0;
      }
      if (typeof data === "number") setBalance(data);
      const labels: Record<string, string> = {
        diary: "日记",
        reply: "评论",
        letter: "书信",
      };
      toast.success(`🌰 +${amount} 松果`, { description: `${labels[source] || source}奖励` });
      return amount;
    },
    [user]
  );

  /** Claim today's check-in. Returns reward amount; 0 if already claimed. */
  const claimDailyCheckIn = useCallback(async (): Promise<{ reward: number; streak: number; already: boolean }> => {
    if (!user) return { reward: 0, streak: 0, already: false };
    const { data, error } = await supabase.rpc("claim_daily_checkin");
    if (error) {
      console.error(error);
      toast.error("签到失败，请稍后再试");
      return { reward: 0, streak: 0, already: false };
    }
    const result = data as { claimed: boolean; already: boolean; reward?: number; streak: number; balance?: number };
    if (result.already) {
      setTodayClaimed(true);
      setStreak(result.streak);
      toast("今天已经签到啦", { description: `连续签到 ${result.streak} 天` });
      return { reward: 0, streak: result.streak, already: true };
    }
    if (typeof result.balance === "number") setBalance(result.balance);
    setStreak(result.streak);
    setTodayClaimed(true);
    toast.success(`🌰 +${result.reward} 松果`, { description: `连续签到第 ${result.streak} 天` });
    return { reward: result.reward ?? 0, streak: result.streak, already: false };
  }, [user]);

  return { balance, streak, todayClaimed, randomDrop, claimDailyCheckIn, refresh };
}
