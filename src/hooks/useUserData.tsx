import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEED_DIARY, type DiaryEntry, type DiaryComment, type CommentReply, type Companion } from "@/lib/data";

const SEED_FLAG_KEY = (uid: string) => `seeded_${uid}`;

function timeFromIso(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
function dateFromIso(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** Hook: load + manage diary entries (with comments + replies) for the signed-in user. */
export function useDiaryEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const ids = (rows || []).map((r) => r.id);
    let comments: any[] = [];
    let replies: any[] = [];
    if (ids.length > 0) {
      const { data: cRows } = await supabase
        .from("diary_comments")
        .select("*")
        .in("diary_id", ids)
        .order("created_at", { ascending: true });
      comments = cRows || [];
      const cIds = comments.map((c) => c.id);
      if (cIds.length > 0) {
        const { data: rRows } = await supabase
          .from("comment_replies")
          .select("*")
          .in("comment_id", cIds)
          .order("created_at", { ascending: true });
        replies = rRows || [];
      }
    }
    const mapped: DiaryEntry[] = (rows || []).map((r: any) => {
      const eComments = comments
        .filter((c) => c.diary_id === r.id)
        .map<DiaryComment>((c) => ({
          id: c.id,
          companionId: c.companion_id,
          text: c.text,
          lineIndex: c.line_index ?? 0,
          highlightText: c.highlight_text || "",
          replies: replies
            .filter((rep) => rep.comment_id === c.id)
            .map<CommentReply>((rep) => ({
              id: rep.id,
              role: rep.role,
              companionId: rep.companion_id || c.companion_id,
              text: rep.text,
              time: timeFromIso(rep.created_at),
            })),
        }));
      return {
        id: r.id,
        date: r.display_date || dateFromIso(r.created_at),
        time: r.entry_time || timeFromIso(r.created_at),
        content: r.content || "",
        comments: eComments,
        tags: r.tags || [],
        moodScore: r.mood_score ?? undefined,
        moodLabel: r.mood_label ?? undefined,
        billing: r.billing_amount != null
          ? { amount: Number(r.billing_amount), category: r.billing_category || "其他", verified: !!r.billing_verified }
          : undefined,
      };
    });
    setEntries(mapped);
    setLoading(false);
  }, [user]);

  // Seed on first login
  useEffect(() => {
    if (!user) return;
    const flagKey = SEED_FLAG_KEY(user.id);
    (async () => {
      const { count } = await supabase
        .from("diary_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) === 0 && !localStorage.getItem(flagKey)) {
        // Insert seed
        const { data: seedRow } = await supabase
          .from("diary_entries")
          .insert({
            user_id: user.id,
            content: SEED_DIARY.content,
            tags: SEED_DIARY.tags,
            mood_score: SEED_DIARY.mood_score,
            mood_label: SEED_DIARY.mood_label,
            display_date: SEED_DIARY.display_date,
            entry_time: SEED_DIARY.entry_time,
            billing_amount: SEED_DIARY.billing_amount,
            billing_category: SEED_DIARY.billing_category,
            billing_verified: SEED_DIARY.billing_verified,
          })
          .select()
          .maybeSingle();
        if (seedRow) {
          await supabase.from("diary_comments").insert(
            SEED_DIARY.comments.map((c) => ({
              user_id: user.id,
              diary_id: seedRow.id,
              companion_id: c.companion_id,
              text: c.text,
              line_index: c.line_index,
              highlight_text: c.highlight_text,
            }))
          );
        }
        localStorage.setItem(flagKey, "1");
      }
      await reload();
    })();
  }, [user, reload]);

  // ---- Operations ----
  const createEntry = useCallback(
    async (content: string): Promise<DiaryEntry | null> => {
      if (!user) return null;
      const now = new Date();
      const display_date = `${now.getMonth() + 1}月${now.getDate()}日`;
      const entry_time = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      const { data, error } = await supabase
        .from("diary_entries")
        .insert({ user_id: user.id, content, display_date, entry_time })
        .select()
        .maybeSingle();
      if (error || !data) {
        console.error(error);
        return null;
      }
      const newEntry: DiaryEntry = {
        id: data.id,
        date: display_date,
        time: entry_time,
        content,
        comments: [],
      };
      setEntries((p) => [newEntry, ...p]);
      return newEntry;
    },
    [user]
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<DiaryEntry>) => {
      const dbPatch: any = {};
      if (patch.content !== undefined) dbPatch.content = patch.content;
      if (patch.tags !== undefined) dbPatch.tags = patch.tags;
      if (patch.moodScore !== undefined) dbPatch.mood_score = patch.moodScore;
      if (patch.moodLabel !== undefined) dbPatch.mood_label = patch.moodLabel;
      if (patch.billing !== undefined) {
        dbPatch.billing_amount = patch.billing?.amount ?? null;
        dbPatch.billing_category = patch.billing?.category ?? null;
        dbPatch.billing_verified = !!patch.billing?.verified;
      }
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      if (Object.keys(dbPatch).length > 0) {
        await supabase.from("diary_entries").update(dbPatch).eq("id", id);
      }
    },
    []
  );

  const addComment = useCallback(
    async (entryId: string, comment: Omit<DiaryComment, "id" | "replies">): Promise<DiaryComment | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("diary_comments")
        .insert({
          user_id: user.id,
          diary_id: entryId,
          companion_id: comment.companionId,
          text: comment.text,
          line_index: comment.lineIndex,
          highlight_text: comment.highlightText,
        })
        .select()
        .maybeSingle();
      if (error || !data) return null;
      const newC: DiaryComment = { id: data.id, ...comment, replies: [] };
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, comments: [...e.comments, newC] } : e)));
      return newC;
    },
    [user]
  );

  const deleteComment = useCallback(async (entryId: string, commentId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, comments: e.comments.filter((c) => c.id !== commentId) } : e))
    );
    await supabase.from("diary_comments").delete().eq("id", commentId);
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    await supabase.from("diary_entries").delete().eq("id", entryId);
  }, []);

  const addReply = useCallback(
    async (entryId: string, commentId: string, role: "user" | "assistant", companionId: string, text: string): Promise<CommentReply | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("comment_replies")
        .insert({ user_id: user.id, comment_id: commentId, role, companion_id: companionId, text })
        .select()
        .maybeSingle();
      if (error || !data) return null;
      const newReply: CommentReply = { id: data.id, role, companionId, text, time: timeFromIso(data.created_at) };
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                comments: e.comments.map((c) =>
                  c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
                ),
              }
            : e
        )
      );
      return newReply;
    },
    [user]
  );

  return { entries, loading, createEntry, updateEntry, addComment, deleteComment, addReply, reload };
}

/** Hook: custom companions stored in DB; merged with built-in. */
export function useCustomCompanions() {
  const { user } = useAuth();
  const [items, setItems] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("custom_companions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(
      (data || []).map<Companion>((r: any) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar || "🤖",
        colorClass: r.color_class || "bg-secondary",
        textColorClass: r.text_color_class || "text-foreground",
        role: r.role || "自定义伙伴",
        bio: r.bio || "",
        intimacy: r.intimacy ?? 0,
        level: r.level ?? 1,
        lastMsg: "你好呀，很高兴认识你！",
        delay: "随机",
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createCompanion = useCallback(
    async (input: { name: string; role: string; bio: string; avatar: string; colorClass: string }) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("custom_companions")
        .insert({
          user_id: user.id,
          name: input.name,
          role: input.role,
          bio: input.bio,
          avatar: input.avatar,
          color_class: input.colorClass,
          text_color_class: "text-foreground",
        })
        .select()
        .maybeSingle();
      if (error || !data) return null;
      await reload();
      return data;
    },
    [user, reload]
  );

  const updateCompanion = useCallback(
    async (id: string, patch: Partial<{ name: string; role: string; bio: string }>) => {
      await supabase.from("custom_companions").update(patch).eq("id", id);
      await reload();
    },
    [reload]
  );

  const deleteCompanion = useCallback(
    async (id: string) => {
      await supabase.from("custom_companions").delete().eq("id", id);
      await reload();
    },
    [reload]
  );

  return { customCompanions: items, loading, createCompanion, updateCompanion, deleteCompanion };
}

/** Hook: custom AI-generated boards. */
export function useCustomBoards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<any[]>([]);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("custom_boards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBoards(
      (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        ...(r.config || {}),
      }))
    );
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addBoard = useCallback(
    async (board: { title: string; emoji: string; items: { text: string }[]; summary: string }) => {
      if (!user) return;
      const { title, ...rest } = board;
      await supabase.from("custom_boards").insert({
        user_id: user.id,
        title,
        config: rest,
      });
      await reload();
    },
    [user, reload]
  );

  const removeBoard = useCallback(
    async (id: string) => {
      await supabase.from("custom_boards").delete().eq("id", id);
      await reload();
    },
    [reload]
  );

  return { boards, addBoard, removeBoard };
}
