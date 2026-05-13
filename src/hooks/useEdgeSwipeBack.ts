import { useEffect } from "react";

/**
 * 手机端从屏幕左边缘右滑返回手势。
 * - 必须从左侧 24px 内开始
 * - 水平位移 > 60px 且 > 垂直位移 1.5 倍时触发
 */
export function useEdgeSwipeBack(onBack: (() => void) | undefined | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !onBack) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX <= 24) {
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 60 && dx > dy * 1.5) {
        onBack();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onBack, enabled]);
}
