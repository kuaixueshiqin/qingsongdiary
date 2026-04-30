import { useRef, useState, useEffect, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  children: ReactNode;
  onOpen: () => void;
  onDelete: () => void | Promise<void>;
}

const ACTION_WIDTH = 88;
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close when tapping outside (but not when confirm dialog is open)
  useEffect(() => {
    if (!opened || confirmOpen) return;
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
  }, [opened, confirmOpen]);

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

  const handleConfirmDelete = async () => {
    await onDelete();
    setConfirmOpen(false);
    setOpened(false);
    setOffset(0);
  };

  return (
    <>
      <div ref={wrapRef} className="relative overflow-hidden rounded-2xl">
        {/* Delete action area (revealed underneath) */}
        <div className="absolute right-0 top-0 bottom-0 w-[88px] flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: "hsl(0 70% 88%)", color: "hsl(0 60% 38%)" }}
            aria-label="删除"
          >
            <Trash2 size={18} strokeWidth={2.4} />
            <span className="text-[10px] font-bold">删除</span>
          </button>
        </div>

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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>删除这篇日记？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复，伙伴的相关评论也会一起消失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
