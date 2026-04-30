import { useState, useRef } from "react";
import { ChevronLeft, Plus, Pencil, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type BillingStatus = "toFill" | "toConfirm" | "confirmed";

export interface BillingItem {
  id: number;
  diaryId?: string;
  date: string;
  amount: number;
  category: string;
  source: string;
  status: BillingStatus;
}

interface BillingDetailViewProps {
  billingItems: BillingItem[];
  setBillingItems: React.Dispatch<React.SetStateAction<BillingItem[]>>;
  onBack: () => void;
  onNavigateToDiary?: (entryId: string) => void;
}

const SWIPE_THRESHOLD = 80;

const SwipeableItem = ({
  item,
  onDelete,
  onConfirm,
  onEdit,
  onOpen,
  hasShownDeleteHint,
  hasShownConfirmHint,
  setDeleteHintShown,
  setConfirmHintShown,
}: {
  item: BillingItem;
  onDelete: (id: number) => void;
  onConfirm: (id: number) => void;
  onEdit: (item: BillingItem) => void;
  onOpen?: (item: BillingItem) => void;
  hasShownDeleteHint: boolean;
  hasShownConfirmHint: boolean;
  setDeleteHintShown: () => void;
  setConfirmHintShown: () => void;
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontal.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;

    // Only allow right swipe for toConfirm items
    if (dx > 0 && item.status !== "toConfirm") {
      setOffsetX(0);
      return;
    }

    setOffsetX(dx);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (offsetX < -SWIPE_THRESHOLD) {
      if (!hasShownDeleteHint) {
        toast("向左滑动可删除消费项", { icon: "👈" });
        setDeleteHintShown();
      }
      onDelete(item.id);
    } else if (offsetX > SWIPE_THRESHOLD && item.status === "toConfirm") {
      if (!hasShownConfirmHint) {
        toast("向右滑动可快速确认", { icon: "👉" });
        setConfirmHintShown();
      }
      onConfirm(item.id);
    }
    setOffsetX(0);
  };

  const bgColor = offsetX < -40 ? "bg-destructive" : offsetX > 40 ? "bg-companion-green-text" : "bg-transparent";
  const label = offsetX < -40 ? "删除" : offsetX > 40 ? "确认" : "";

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background action indicator */}
      <div className={`absolute inset-0 ${bgColor} rounded-2xl flex items-center transition-colors`}>
        {offsetX < -40 && <span className="absolute right-4 text-xs font-bold text-primary-foreground">删除</span>}
        {offsetX > 40 && <span className="absolute left-4 text-xs font-bold text-primary-foreground">确认</span>}
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-4 shadow-sm relative transition-transform"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen?.(item)}
            disabled={!item.diaryId}
            className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity disabled:cursor-default"
          >
            <div className="flex items-center gap-2 mb-0.5">
              {item.amount > 0 ? (
                <span className="text-sm font-bold text-foreground">¥{item.amount}</span>
              ) : (
                <span className="text-sm font-bold text-muted-foreground/40">待填写</span>
              )}
              <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{item.category}</span>
              {item.diaryId && (
                <ChevronRight size={12} className="text-muted-foreground/40 ml-auto" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{item.date} · {item.source}</p>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-1.5 bg-secondary rounded-lg text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label="编辑"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const BillingDetailView = ({ billingItems, setBillingItems, onBack, onNavigateToDiary }: BillingDetailViewProps) => {
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("餐饮");
  const [newSource, setNewSource] = useState("");
  const [newDate, setNewDate] = useState("");
  const [deleteHintShown, setDeleteHintShown] = useState(false);
  const [confirmHintShown, setConfirmHintShown] = useState(false);

  const toFillItems = billingItems.filter((i) => i.status === "toFill");
  const toConfirmItems = billingItems.filter((i) => i.status === "toConfirm");
  const confirmedItems = billingItems.filter((i) => i.status === "confirmed");

  const handleDelete = (id: number) => {
    setBillingItems((prev) => prev.filter((i) => i.id !== id));
    if (!deleteHintShown) {
      toast("向左滑动可删除消费项", { icon: "👈" });
      setDeleteHintShown(true);
    } else {
      toast.success("已删除");
    }
  };

  const handleConfirm = (id: number) => {
    setBillingItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "confirmed" as BillingStatus } : i));
    if (!confirmHintShown) {
      toast("向右滑动可快速确认", { icon: "👉" });
      setConfirmHintShown(true);
    } else {
      toast.success("已确认");
    }
  };

  const handleEdit = (item: BillingItem) => {
    setEditingItemId(item.id);
    setEditAmount(item.amount > 0 ? String(item.amount) : "");
    setEditCategory(item.category);
  };

  const handleEditSave = (itemId: number) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("请输入有效金额"); return; }
    setBillingItems((prev) => prev.map((i) => {
      if (i.id !== itemId) return i;
      const nextStatus: BillingStatus = i.status === "confirmed" ? "confirmed" : "confirmed";
      return { ...i, amount, category: editCategory, status: nextStatus };
    }));
    setEditingItemId(null);
    toast.success("账单已更新");
  };

  const handleOpen = (item: BillingItem) => {
    if (item.diaryId && onNavigateToDiary) {
      onNavigateToDiary(item.diaryId);
    }
  };

  const handleAddManual = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("请输入有效金额"); return; }
    if (!newSource.trim()) { toast.error("请输入来源"); return; }
    setBillingItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: newDate || "今天",
        amount,
        category: newCategory,
        source: newSource.trim(),
        status: "confirmed" as BillingStatus,
      },
    ]);
    setShowAddForm(false);
    setNewAmount("");
    setNewSource("");
    setNewDate("");
    toast.success("已添加");
  };

  const renderSection = (title: string, items: BillingItem[], tagColor: string, tagText: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className={`text-[10px] ${tagColor} px-2 py-0.5 rounded-full font-bold`}>{tagText}</span>
          <span className="text-[10px] text-muted-foreground">{items.length} 笔</span>
        </div>
        <div className="space-y-2">
          {items.map((item) =>
            editingItemId === item.id ? (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground block mb-1">金额</label>
                    <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground" autoFocus />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground block mb-1">分类</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground">
                      <option>餐饮</option><option>交通</option><option>娱乐</option><option>购物</option><option>生活</option><option>其他</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingItemId(null)} className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground">取消</button>
                  <button onClick={() => handleEditSave(item.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold">保存</button>
                </div>
              </div>
            ) : (
              <SwipeableItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
                hasShownDeleteHint={deleteHintShown}
                hasShownConfirmHint={confirmHintShown}
                setDeleteHintShown={() => setDeleteHintShown(true)}
                setConfirmHintShown={() => setConfirmHintShown(true)}
              />
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-4 animate-in slide-in-from-right duration-300">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground"><ChevronLeft size={24} /></button>
          <div>
            <span className="text-sm font-bold text-foreground">账单明细</span>
            <span className="text-xs text-muted-foreground ml-2">共 {billingItems.length} 笔</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-primary text-primary-foreground rounded-xl active:scale-95 transition-transform"
        >
          <Plus size={16} />
        </button>
      </div>

      {showAddForm && (
        <div className="px-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-foreground">手动添加</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">金额</label>
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground" autoFocus />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">分类</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground">
                  <option>餐饮</option><option>交通</option><option>娱乐</option><option>购物</option><option>生活</option><option>其他</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">来源</label>
                <input type="text" value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="如：咖啡" className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">日期</label>
                <input type="text" value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="如：5月22日" className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-sm focus:outline-none text-foreground" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddForm(false)} className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground">取消</button>
              <button onClick={handleAddManual} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold">添加</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        {renderSection("待填写", toFillItems, "bg-accent/15 text-accent", "待填写")}
        {renderSection("待确认", toConfirmItems, "bg-companion-amber-text/15 text-companion-amber-text", "待确认")}
        {renderSection("已确认", confirmedItems, "bg-companion-green-text/15 text-companion-green-text", "已确认")}
      </div>
    </div>
  );
};

export default BillingDetailView;
