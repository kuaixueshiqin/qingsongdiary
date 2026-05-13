import { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
}

/**
 * 在窄屏(真实手机)上:全屏铺满,无外框,自适应任何尺寸
 * 在宽屏(桌面预览)上:显示居中的手机模型框,方便设计
 */
const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div className="md:flex md:justify-center md:items-center md:min-h-screen md:bg-muted">
      {/* 真机:全屏;桌面:固定 360x800 模型框 */}
      <div
        className="
          relative flex flex-col bg-background paper-texture overflow-hidden
          w-screen min-h-screen
          md:w-[360px] md:h-[800px] md:min-h-0
          md:rounded-[40px] md:shadow-2xl md:border-[6px] md:border-foreground
        "
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Notch — 仅桌面预览显示 */}
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-foreground rounded-b-3xl z-50 items-center justify-center gap-2">
          <div className="w-10 h-1 bg-foreground/80 rounded-full" />
          <div className="w-2 h-2 bg-foreground/80 rounded-full" />
        </div>

        {children}

        {/* Home Indicator — 仅桌面预览显示 */}
        <div className="hidden md:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-border rounded-full z-50" />
      </div>
    </div>
  );
};

export default MobileShell;
