import { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
}

const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <div className="w-[360px] h-[800px] bg-background rounded-[40px] shadow-2xl relative overflow-hidden border-[6px] border-foreground flex flex-col paper-texture">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-foreground rounded-b-3xl z-50 flex items-center justify-center gap-2">
          <div className="w-10 h-1 bg-foreground/80 rounded-full" />
          <div className="w-2 h-2 bg-foreground/80 rounded-full" />
        </div>

        {children}

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-border rounded-full z-50" />
      </div>
    </div>
  );
};

export default MobileShell;
