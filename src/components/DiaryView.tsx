import { useState } from "react";
import { Plus, ChevronLeft, Reply, Trash2, Wallet, X } from "lucide-react";
import { diaryEntries, companions, type DiaryEntry } from "@/lib/data";

const DiaryView = () => {
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  if (selectedEntry) {
    return (
      <DiaryDetail
        entry={selectedEntry}
        onBack={() => { setSelectedEntry(null); setActiveCommentId(null); }}
        activeCommentId={activeCommentId}
        onCommentClick={setActiveCommentId}
      />
    );
  }

  return (
    <div className="pb-4">
      <div className="px-6 pt-14 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-foreground">日记</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-[0.2em] font-semibold">
            Diary Logs
          </p>
        </div>
        <button
          onClick={() => setIsWriting(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} />
          <span className="text-sm font-bold">记一篇</span>
        </button>
      </div>

      <div className="px-4 space-y-3">
        {diaryEntries.map((entry) => {
          const entryCompanions = entry.comments.map((c) =>
            companions.find((comp) => comp.id === c.companionId)
          );
          return (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="bg-card border border-border rounded-2xl p-4 flex gap-3 active:bg-secondary transition-colors shadow-sm cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <span>{entry.date}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{entry.time}</span>
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed line-clamp-3">
                  {entry.content}
                </p>
                {entry.billing && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-accent font-semibold">
                    <Wallet size={12} />
                    <span>¥{entry.billing.amount} · {entry.billing.category}</span>
                  </div>
                )}
              </div>
              {/* AI companion avatars on the right */}
              <div className="flex flex-col gap-1.5 items-center justify-start pt-1">
                {entryCompanions.map((comp, idx) =>
                  comp ? (
                    <div
                      key={idx}
                      className={`w-8 h-8 ${comp.colorClass} rounded-lg flex items-center justify-center text-base`}
                    >
                      {comp.avatar}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Writing drawer */}
      {isWriting && (
        <div className="absolute inset-0 bg-card z-[100] p-6 pt-16 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-muted-foreground">新日志 · 5月21日</span>
            <button onClick={() => setIsWriting(false)} className="text-muted-foreground">
              <X size={20} />
            </button>
          </div>
          <textarea
            autoFocus
            placeholder="今天发生了什么..."
            className="flex-1 text-lg leading-relaxed focus:outline-none resize-none bg-transparent text-foreground placeholder:text-muted-foreground/30"
          />
          <button
            onClick={() => setIsWriting(false)}
            className="mt-4 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold self-end"
          >
            保存记录
          </button>
        </div>
      )}
    </div>
  );
};

interface DiaryDetailProps {
  entry: DiaryEntry;
  onBack: () => void;
  activeCommentId: string | null;
  onCommentClick: (id: string | null) => void;
}

const DiaryDetail = ({ entry, onBack, activeCommentId, onCommentClick }: DiaryDetailProps) => {
  const paragraphs = entry.content.split("\n").filter(Boolean);

  return (
    <div className="pb-4 animate-in slide-in-from-right duration-300">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ChevronLeft size={24} />
        </button>
        <div>
          <span className="text-sm font-bold text-foreground">{entry.date}</span>
          <span className="text-xs text-muted-foreground ml-2">{entry.time}</span>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {paragraphs.map((para, pIdx) => {
          const lineComments = entry.comments.filter((c) => c.lineIndex === pIdx);
          
          // Build paragraph with inline underlines for highlighted phrases
          const renderParagraph = () => {
            if (lineComments.length === 0) return para;

            // Collect all highlight texts and their comment data
            const highlights = lineComments
              .filter((c) => c.highlightText && para.includes(c.highlightText))
              .sort((a, b) => para.indexOf(a.highlightText) - para.indexOf(b.highlightText));

            if (highlights.length === 0) return para;

            const parts: React.ReactNode[] = [];
            let lastIndex = 0;

            highlights.forEach((comment) => {
              const idx = para.indexOf(comment.highlightText, lastIndex);
              if (idx === -1) return;

              // Text before the highlight
              if (idx > lastIndex) {
                parts.push(para.slice(lastIndex, idx));
              }

              // Highlighted text with underline
              parts.push(
                <span
                  key={comment.id}
                  className="underline decoration-accent decoration-2 underline-offset-4 cursor-pointer"
                  onClick={() => onCommentClick(activeCommentId === comment.id ? null : comment.id)}
                >
                  {comment.highlightText}
                </span>
              );

              lastIndex = idx + comment.highlightText.length;
            });

            // Remaining text
            if (lastIndex < para.length) {
              parts.push(para.slice(lastIndex));
            }

            return parts;
          };

          return (
            <div key={pIdx} className="relative">
              {/* AI comments shown when active */}
              {lineComments.map((comment) => {
                const comp = companions.find((c) => c.id === comment.companionId);
                if (!comp || activeCommentId !== comment.id) return null;
                return (
                  <div key={comment.id} className="mb-2 flex items-center gap-2 animate-in fade-in duration-200">
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-foreground text-primary-foreground`}>
                      <span>{comp.avatar}</span>
                      <span className="font-medium">{comp.name}</span>
                      <span className="text-primary-foreground/80">{comment.text}</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
                        <Reply size={14} />
                      </button>
                      <button className="p-1.5 bg-secondary rounded-lg text-destructive/60 hover:text-destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <p className="text-foreground/85 text-[15px] leading-[1.8]">
                {renderParagraph()}
              </p>
            </div>
          );
        })}

        {/* Billing card */}
        {entry.billing && (
          <div className="bg-secondary/50 border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <Wallet size={18} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">已自动识别账单</p>
              <p className="text-sm font-bold text-foreground">
                ¥{entry.billing.amount} · {entry.billing.category}
              </p>
            </div>
            <button className="text-xs bg-card border border-border px-3 py-1.5 rounded-lg font-medium text-muted-foreground">
              {entry.billing.verified ? "已确认" : "修改"}
            </button>
          </div>
        )}
      </div>

      {/* Append input */}
      <div className="px-6 mt-8 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground/30 italic">点击此处追加记录...</p>
      </div>
    </div>
  );
};

export default DiaryView;
