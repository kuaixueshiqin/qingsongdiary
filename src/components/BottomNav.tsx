import { BookOpen, Mail, BarChart3, User } from "lucide-react";
import SquirrelIcon from "./icons/SquirrelIcon";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "diary", icon: BookOpen, label: "日记" },
  { id: "mailbox", icon: Mail, label: "信箱" },
  { id: "insights", icon: BarChart3, label: "看板" },
  { id: "companions", icon: SquirrelIcon, label: "伙伴" },
  { id: "profile", icon: User, label: "我的" },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="h-20 bg-card/95 backdrop-blur-md border-t border-border px-6 flex items-center justify-around pb-5 z-40">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? "text-brand-brown scale-110" : "text-muted-foreground/40"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
