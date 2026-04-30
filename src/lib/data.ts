// ============= Built-in companions (常驻，不入库) =============
export interface Companion {
  id: string;
  name: string;
  avatar: string;
  colorClass: string;
  textColorClass: string;
  role: string;
  bio: string;
  intimacy: number;
  level: number;
  lastMsg: string;
  delay: string;
}

export interface CommentReply {
  id: string;
  role: "user" | "assistant";
  companionId: string;
  text: string;
  time: string;
}

export interface DiaryComment {
  id: string;
  companionId: string;
  text: string;
  lineIndex: number;
  highlightText: string;
  replies: CommentReply[];
}

export interface DiaryEntry {
  /** UUID from Supabase (string). For unsynced entries we use a temporary string id. */
  id: string;
  date: string;
  time: string;
  content: string;
  comments: DiaryComment[];
  billing?: { amount: number; category: string; verified: boolean };
  tags?: string[];
  moodScore?: number;
  moodLabel?: string;
}

/** Built-in companions available to every user. NOT stored in DB. */
export const companions: Companion[] = [
  {
    id: "xiaoman",
    name: "小慢",
    avatar: "🐢",
    colorClass: "bg-companion-green",
    textColorClass: "text-companion-green-text",
    role: "情绪听众",
    bio: "慢下来，听听内心的声音",
    intimacy: 85,
    level: 4,
    lastMsg: "今天的心情好些了吗？",
    delay: "4-12小时",
  },
  {
    id: "shanshan",
    name: "松鼠",
    avatar: "🐿️",
    colorClass: "bg-companion-amber",
    textColorClass: "text-companion-amber-text",
    role: "生活助手",
    bio: "囤好每一颗生活的坚果！",
    intimacy: 42,
    level: 2,
    lastMsg: "记账提醒：晚饭花了多少呀？",
    delay: "5-15分钟",
  },
  {
    id: "moshu",
    name: "墨墨",
    avatar: "🐙",
    colorClass: "bg-companion-red",
    textColorClass: "text-companion-red-text",
    role: "海洋伙伴",
    bio: "肚子里很有墨的小章鱼～",
    intimacy: 15,
    level: 1,
    lastMsg: "读到一段话，想与你分享。",
    delay: "深夜触发",
  },
];

export const squareAgents = [
  { id: "coffee", name: "咖咖", avatar: "☕", creator: "用户9527", likes: "1.2k", role: "职场导师", bio: "在职场摸爬滚打十年，最擅长帮你理清思路、化解焦虑。无论是升职加薪还是人际关系，都可以聊聊。", pinecones: 6 },
  { id: "nana", name: "那那", avatar: "🐱", creator: "猫奴小王", likes: "3.5k", role: "傲娇萌宠", bio: "哼，才不是因为喜欢你才来陪你的呢！只是...偶尔听你说说话也不是不可以啦。", pinecones: 4 },
  { id: "pixel", name: "像素", avatar: "👾", creator: "极客阿强", likes: "890", role: "复古游戏迷", bio: "8-bit 是永恒的浪漫！从红白机到街机，从马里奥到魂斗罗，和我一起重温像素时代的感动吧。", pinecones: 8 },
  { id: "starry", name: "星星", avatar: "🌟", creator: "文艺小青", likes: "2.1k", role: "占星师", bio: "星辰大海里藏着你的命运密码。让我用星座和塔罗，帮你看清前方的路。", pinecones: 5 },
];

/** Seed example diary written into a new user's account on first login. */
export const SEED_DIARY = {
  display_date: "示例 · 今天",
  entry_time: "20:45",
  content:
    "欢迎来到轻松书 ✨\n\n这是一篇示例日记。你可以点击下方文字里的下划线，看看伙伴留下的评论；也可以右上角的「记一篇」开始你自己的第一篇记录。\n\n今天去吃了那家想了很久的日料店，虽然有点贵（花了280元），但味道真的很惊艳。",
  tags: ["美食", "心情"],
  mood_score: 4,
  mood_label: "惊喜",
  billing_amount: 280,
  billing_category: "餐饮",
  billing_verified: false,
  comments: [
    { companion_id: "shanshan", text: "看起来超好吃！下次我陪你呀～ 🍣🐿️", line_index: 2, highlight_text: "味道真的很惊艳" },
    { companion_id: "xiaoman", text: "记得把心情也囤起来呀，这是松果林最珍贵的果子。", line_index: 0, highlight_text: "欢迎来到轻松书" },
  ],
};
