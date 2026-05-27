import { useEffect, useState } from "react";
import { ChevronLeft, ShoppingBag, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";

interface Tx {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  created_at: string;
}

interface Props {
  balance: number;
  onBack: () => void;
  onOpenShop: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  checkin: "每日签到",
  diary_write: "记录日记",
  comment_reply: "回复",
  letter_write: "写信",
  companion_unlock: "解锁伙伴",
  shop_purchase: "充值",
  agent_share: "广场分成",
};

const labelOf = (s: string) => SOURCE_LABEL[s] ?? s;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
};

const PineconeTransactionsView = ({ balance, onBack, onOpenShop }: Props) => {
  useEdgeSwipeBack(onBack);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pinecone_transactions")
        .select("id, amount, source, note, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled) {
        setTxs(data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = txs.filter((t) =>
    filter === "all" ? true : filter === "income" ? t.amount > 0 : t.amount < 0,
  );

  const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="pb-4 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="text-muted-foreground active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-black text-foreground truncate">松果明细</h1>
        </div>
        <button
          onClick={onOpenShop}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground active:scale-95 transition-all"
        >
          <ShoppingBag size={13} />
          充值
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Balance */}
        <div className="bg-companion-amber rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-companion-amber-text/70 font-bold">当前余额</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-black text-companion-amber-text">🌰 {balance}</span>
          </div>
          <div className="mt-3 flex gap-4 text-[11px] text-companion-amber-text/80">
            <span>累计收入 +{income}</span>
            <span>累计支出 -{expense}</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {([
            { id: "all", label: "全部" },
            { id: "income", label: "收入" },
            { id: "expense", label: "支出" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                filter === t.id
                  ? "bg-brand-brown text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 size={18} className="animate-spin text-muted-foreground/50" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground/60">
              {filter === "income" ? "还没有收入记录" : filter === "expense" ? "还没有支出记录" : "还没有任何记录"}
            </div>
          ) : (
            filtered.map((t) => {
              const isIncome = t.amount > 0;
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isIncome ? "bg-companion-green text-companion-green-text" : "bg-companion-pink text-companion-pink-text"
                    }`}
                  >
                    {isIncome ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{labelOf(t.source)}</p>
                    {t.note && <p className="text-[10px] text-muted-foreground/60 truncate">{t.note}</p>}
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">{fmtDate(t.created_at)}</p>
                  </div>
                  <span
                    className={`text-sm font-black flex-shrink-0 ${
                      isIncome ? "text-companion-green-text" : "text-foreground/80"
                    }`}
                  >
                    {isIncome ? "+" : ""}
                    {t.amount} 🌰
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PineconeTransactionsView;
