import { useState } from "react";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import DiaryView from "@/components/DiaryView";
import MailboxView from "@/components/MailboxView";
import InsightsView from "@/components/InsightsView";
import CompanionsView from "@/components/CompanionsView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("diary");

  const renderView = () => {
    switch (activeTab) {
      case "diary":
        return <DiaryView />;
      case "mailbox":
        return <MailboxView />;
      case "insights":
        return <InsightsView />;
      case "companions":
        return <CompanionsView />;
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
