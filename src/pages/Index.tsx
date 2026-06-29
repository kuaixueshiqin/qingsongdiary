import { useState } from "react";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import DiaryView from "@/components/DiaryView";
import MailboxView from "@/components/MailboxView";
import InsightsView from "@/components/InsightsView";
import CompanionsView from "@/components/CompanionsView";
import ProfileView from "@/components/ProfileView";

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("diary");
  const [targetDiaryId, setTargetDiaryId] = useState<string | null>(null);

  // Guest placeholder: prompt login before accessing features
  if (!user) {
    return (
      <MobileShell>
        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-5xl mb-4">🌲</div>
          <h2 className="text-xl font-black text-foreground mb-2">欢迎来到松果林</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
            登录后即可记录日记、接收伙伴来信，<br />开启你的温柔陪伴之旅。
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("guest_mode");
              window.location.href = "/auth";
            }}
            className="w-full max-w-xs h-12 rounded-2xl bg-foreground text-background text-sm font-bold active:scale-[0.98] transition-transform"
          >
            去登录
          </button>
        </main>
      </MobileShell>
    );
  }

  const handleNavigateToDiary = (entryId: string) => {
    setTargetDiaryId(entryId);
    setActiveTab("diary");
  };

  const renderView = () => {
    switch (activeTab) {
      case "diary":
        return <DiaryView initialEntryId={targetDiaryId} onEntryViewed={() => setTargetDiaryId(null)} />;
      case "mailbox":
        return <MailboxView />;
      case "insights":
        return <InsightsView onNavigateToDiary={handleNavigateToDiary} />;
      case "companions":
        return <CompanionsView />;
      case "profile":
        return <ProfileView />;
      default:
        return <DiaryView />;
    }
  };

  return (
    <MobileShell>
      <main className="flex-1 overflow-y-auto scrollbar-hide relative">
        {renderView()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </MobileShell>
  );
};

export default Index;
