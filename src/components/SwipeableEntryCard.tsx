import { useRef, useState, useEffect, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
  onOpen: () => void;
  onDelete: () => void | Promise<void>;
}

const ACTION_WIDTH = 72;
const OPEN_THRESHOLD = 36;

/**
 * Swipe a diary card left to reveal a delete action.
 * - Tap (no significant horizontal movement) triggers onOpen.
 * - Swipe left past threshold latches the delete button visible.
 * - Tapping outside or starting a new swipe re-closes.
 */
export default function SwipeableEntryCard({ children, onOpen, onDelete }: Props) {
  const [offset, setOffset] = useState(0); // current translateX (negative)
  const [opened, setOpened] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close when tapping outside
  useEffect(() => {
    if (!opened) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpened(false);
        setOffset(0);
      }
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [opened]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragging.current = true;
    moved.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > 6) moved.current = true;
    // ignore vertical scrolls
    if (Math.abs(dy) > Math.abs(dx) && !opened) return;
    const base = opened ? -ACTION_WIDTH : 0;
    let next = base + dx;
    if (next > 0) next = 0;
    if (next < -ACTION_WIDTH - 20) next = -ACTION_WIDTH - 20;
    setOffset(next);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (offset <= -OPEN_THRESHOLD) {
      setOpened(true);
      setOffset(-ACTION_WIDTH);
    } else {
      setOpened(false);
      setOffset(0);
    }
    // small delay so click handler can read moved.current
    setTimeout(() => { moved.current = false; }, 50);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (opened) {
      e.preventDefault();
      e.stopPropagation();
      setOpened(false);
      setOffset(0);
      return;
    }
    onOpen();
  };

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-2xl">
      {/* Delete action (revealed underneath) */}
      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          await onDelete();
          setOpened(false);
          setOffset(0);
        }}
        className="absolute right-0 top-0 bottom-0 w-[72px] flex flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground active:bg-destructive/90 transition-colors"
        aria-label="删除"
      >
        <Trash2 size={18} strokeWidth={2.4} />
        <span className="text-[11px] font-bold">删除</span>
      </button>

      {/* Swipeable foreground */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
