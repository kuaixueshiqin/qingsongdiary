import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { usePinecones } from "@/hooks/usePinecones";

interface PineconeShopProps {
  open: boolean;
  onClose: () => void;
  /** Optional message shown above the bundles, e.g. "松果不足，先充值一下吧" */
  reason?: string;
}

const BUNDLES = [
  { id: "starter", amount: 30, price: "¥6", label: "新手包", tag: "" },
  { id: "regular", amount: 100, price: "¥18", label: "常用包", tag: "推荐" },
  { id: "value", amount: 300, price: "¥45", label: "超值包", tag: "省 17%" },
  { id: "mega", amount: 800, price: "¥98", label: "丰收包", tag: "省 27%" },
];

const PineconeShop = ({ open, onClose, reason }: PineconeShopProps) => {
  const { balance, mockTopUp } = usePinecones();
  const [buying, setBuying] = useState<string | null>(null);

  if (!open) return null;

  const handleBuy = async (b: typeof BUNDLES[number]) => {
    setBuying(b.id);
    const ok = await mockTopUp(b.amount, `${b.label} ${b.price}`);
    setBuying(null);
    if (ok) onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full bg-card rounded-t-3xl p-5 pb-8 shadow-xl animate-in slide-in-from-bottom-8 duration-200 max-h-[80vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-black text-foreground">松果商店</h3>
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
          <span>当前余额</span>
          <span className="font-black text-foreground">🌰 {balance}</span>
        </div>
        {reason && (
          <p className="text-[11px] text-companion-amber-text bg-companion-amber rounded-xl px-3 py-2 mt-2">
            {reason}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {BUNDLES.map((b) => (
            <button
              key={b.id}
              onClick={() => handleBuy(b)}
              disabled={buying !== null}
              className="relative flex flex-col items-center justify-center bg-secondary rounded-2xl p-4 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {b.tag && (
                <span className="absolute top-2 right-2 text-[9px] font-black text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
                  {b.tag}
                </span>
              )}
              <div className="text-2xl mb-1">🌰</div>
              <div className="text-base font-black text-foreground">{b.amount}</div>
              <div className="text-[10px] text-muted-foreground/60 mb-2">{b.label}</div>
              <div className="w-full py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center gap-1">
                {buying === b.id ? <Loader2 size={12} className="animate-spin" /> : b.price}
              </div>
            </button>
          ))}
        </div>

        <p className="text-[9px] text-muted-foreground/40 text-center mt-4 leading-relaxed">
          当前为体验版充值，付款流程接入正式支付后将自动启用
        </p>
      </div>
    </div>
  );
};

export default PineconeShop;
