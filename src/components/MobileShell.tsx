import { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
}

/**
 * 全屏布局,无外框。底部 tab 栏自动贴屏幕底部(由 Index 中的 flex 列布局保证)。
 */
const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div
      className="flex flex-col bg-background paper-texture overflow-hidden w-screen"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {children}
    </div>
  );
};

export default MobileShell;
