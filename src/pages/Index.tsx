import { useState } from "react";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import DiaryView from "@/components/DiaryView";
import MailboxView from "@/components/MailboxView";
import InsightsView from "@/components/InsightsView";
import CompanionsView from "@/components/CompanionsView";
import ProfileView from "@/components/ProfileView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("diary");
  const [targetDiaryId, setTargetDiaryId] = useState<string | null>(null);

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
