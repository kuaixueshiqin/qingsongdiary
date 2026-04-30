import { useState, useRef, useEffect, useCallback } from "react";
import { companions as defaultCompanions, type Companion } from "@/lib/data";

export interface MentionTag {
  id: string;
  name: string;
  avatar: string;
}

type MentionCompanion = Pick<Companion, "id" | "name" | "avatar"> & { role?: string };

interface MentionInputProps {
  value: string;
  mentions: MentionTag[];
  onChange: (text: string, mentions: MentionTag[]) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
  companions?: MentionCompanion[];
}

const MentionInput = ({ value, mentions, onChange, placeholder, onSubmit, autoFocus, className, companions: companionsProp }: MentionInputProps) => {
  const companions = companionsProp ?? defaultCompanions;
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState("");
  const [atStartIndex, setAtStartIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync contentEditable with external value changes (only on mount or clear)
  const lastSyncedValue = useRef(value);
  useEffect(() => {
    if (value === "" && inputRef.current && inputRef.current.innerHTML !== "") {
      inputRef.current.innerHTML = "";
      lastSyncedValue.current = "";
    }
  }, [value]);

  const getTextContent = useCallback(() => {
    if (!inputRef.current) return "";
    let text = "";
    const walk = (node: Node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += (child.textContent || "").replace(/\u200B/g, "");
        } else if (child instanceof HTMLElement) {
          if (child.dataset.mentionId) {
            text += `@${child.dataset.mentionName}`;
          } else if (child.tagName === "BR") {
            text += "\n";
          } else if (child.tagName === "DIV") {
            // Some browsers wrap new lines in <div>
            if (text && !text.endsWith("\n")) text += "\n";
            walk(child);
          } else {
            walk(child);
          }
        }
      });
    };
    walk(inputRef.current);
    return text;
  }, []);

  const getMentionsFromDom = useCallback((): MentionTag[] => {
    if (!inputRef.current) return [];
    const tags: MentionTag[] = [];
    inputRef.current.querySelectorAll("[data-mention-id]").forEach((el) => {
      const htmlEl = el as HTMLElement;
      tags.push({
        id: htmlEl.dataset.mentionId!,
        name: htmlEl.dataset.mentionName!,
        avatar: htmlEl.dataset.mentionAvatar!,
      });
    });
    return tags;
  }, []);

  const handleInput = () => {
    const text = getTextContent();
    const currentMentions = getMentionsFromDom();
    onChange(text, currentMentions);

    // Check if we're in an @-trigger state
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (range.startContainer.nodeType !== Node.TEXT_NODE) {
      setShowDropdown(false);
      return;
    }

    const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || "";
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx !== -1) {
      const afterAt = textBefore.slice(atIdx + 1);
      // Only show if no space after @
      if (!/\s/.test(afterAt)) {
        setShowDropdown(true);
        setDropdownFilter(afterAt);
        setAtStartIndex(atIdx);
        return;
      }
    }
    setShowDropdown(false);
  };

  const insertMention = (companion: typeof companions[0]) => {
    if (!inputRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE || atStartIndex === null) return;

    const fullText = textNode.textContent || "";
    const beforeAt = fullText.slice(0, atStartIndex);
    const afterCursor = fullText.slice(range.startOffset);

    // Create mention chip
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.mentionId = companion.id;
    chip.dataset.mentionName = companion.name;
    chip.dataset.mentionAvatar = companion.avatar;
    chip.className = "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium mx-0.5 cursor-pointer select-none";
    chip.innerHTML = `<span>${companion.avatar}</span><span>@${companion.name}</span>`;
    chip.onclick = () => {
      // Re-open dropdown on click
      setShowDropdown(true);
      setDropdownFilter("");
    };

    // Replace text node content
    const beforeNode = document.createTextNode(beforeAt);
    const afterNode = document.createTextNode(afterCursor || "\u00A0");
    const parent = textNode.parentNode!;
    parent.insertBefore(beforeNode, textNode);
    parent.insertBefore(chip, textNode);
    parent.insertBefore(afterNode, textNode);
    parent.removeChild(textNode);

    // Move cursor after the chip
    const newRange = document.createRange();
    newRange.setStart(afterNode, afterNode.textContent === "\u00A0" ? 1 : 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    setShowDropdown(false);
    setDropdownFilter("");
    setAtStartIndex(null);

    const text = getTextContent();
    const currentMentions = getMentionsFromDom();
    onChange(text, currentMentions);
    inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showDropdown) {
      if (e.shiftKey) {
        // Shift+Enter: insert a line break manually for consistent behavior
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement("br");
        range.insertNode(br);
        // Ensure caret can sit after the <br> by adding a zero-width text node if needed
        const trailing = document.createTextNode("\u200B");
        br.parentNode?.insertBefore(trailing, br.nextSibling);
        const newRange = document.createRange();
        newRange.setStart(trailing, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        handleInput();
      } else {
        e.preventDefault();
        onSubmit?.();
      }
    }
    if (e.key === "Escape" && showDropdown) {
      setShowDropdown(false);
    }
  };

  const filtered = companions.filter((c) =>
    dropdownFilter === "" || c.name.includes(dropdownFilter) || c.id.includes(dropdownFilter)
  );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative flex-1">
      <div
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={`min-h-[28px] max-h-[120px] overflow-y-auto bg-secondary border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-muted-foreground/40 text-foreground whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30 ${className || ""}`}
      />
      {showDropdown && filtered.length > 0 && (
        <div ref={dropdownRef} className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-lg py-1 z-50 min-w-[140px] animate-in fade-in slide-in-from-bottom-2 duration-150">
          {filtered.map((c) => (
            <button
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(c); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors text-left"
            >
              <span className="text-base">{c.avatar}</span>
              <span className="font-medium text-foreground">{c.name}</span>
              <span className="text-muted-foreground/60 text-[10px]">{c.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
