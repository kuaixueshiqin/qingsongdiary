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
  /** The exact sentence/phrase the AI highlights */
  highlightText: string;
  replies: CommentReply[];
}

export interface DiaryEntry {
  id: number;
  date: string;
  time: string;
  content: string;
  comments: DiaryComment[];
  billing?: { amount: number; category: string; verified: boolean };
  tags?: string[];
  moodScore?: number; // 1-5
  moodLabel?: string; // e.g. "开心", "感动"
}

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

export const diaryEntries: DiaryEntry[] = [
  {
    id: 4,
    date: "5月21日",
    time: "22:10",
    content: "晚上看了《沙丘 2》，视觉效果真的太震撼了，沙虫出场那一幕直接起鸡皮疙瘩。Hans Zimmer的配乐依然封神，低频轰得座椅都在抖。\n\n保罗的成长线让我很有感触，有些路注定要一个人走。看完之后坐在影院里发呆了好久，不想回到现实。",
    comments: [
      { id: "c5", companionId: "moshu", text: "沙丘的世界观深邃如海，值得反复品味。", lineIndex: 0, highlightText: "视觉效果真的太震撼了", replies: [] },
    ],
  },
  {
    id: 5,
    date: "5月16日",
    time: "21:00",
    content: "下班后一个人去看了《周处除三害》，本来没抱太大期望，结果被阮经天的演技惊到了。那段邪教的戏份拍得太好了，看得我后背发凉。\n\n回家路上一直在想，人到底要经历什么才能真正改变？也许每个人心里都有需要除掉的\u201C三害\u201D吧。",
    comments: [
      { id: "c6", companionId: "xiaoman", text: "每个人都有自己的三害要面对呢，慢慢来。", lineIndex: 1, highlightText: "每个人心里都有需要除掉的\u201C三害\u201D", replies: [] },
    ],
  },
  {
    id: 6,
    date: "5月11日",
    time: "19:30",
    content: "和朋友去看了《你想活出怎样的人生》，宫崎骏最后的作品，画面美得像梦境。看到最后眼眶湿了，不是因为悲伤，是因为感觉和一个时代告别了。\n\n出来后我们去咖啡店聊了很久，聊梦想，聊未来，聊那些年一起追过的吉卜力动画。",
    comments: [
      { id: "c7", companionId: "moshu", text: "宫崎骏用一生告诉我们：想象力是人类最后的自由。", lineIndex: 0, highlightText: "画面美得像梦境", replies: [] },
    ],
  },
  {
    id: 1,
    date: "5月20日",
    time: "20:45",
    content:
      "今天去吃了那家想了很久的日料店，虽然有点贵（花了280元），但味道真的很惊艳。尤其是那道手握，入口即化的感觉...\n\n不过，吃完后突然觉得有点空虚，可能是因为一个人吧。明明是很开心的事情，却忍不住想，如果有人一起分享就更好了。",
    comments: [
      { id: "c1", companionId: "shanshan", text: "看起来超好吃！下次我陪你呀～ 🍣🐿️", lineIndex: 0, highlightText: "味道真的很惊艳", replies: [] },
      { id: "c2", companionId: "xiaoman", text: "偶尔慢下来享受美食，也是种修行呢。", lineIndex: 1, highlightText: "如果有人一起分享就更好了", replies: [] },
    ],
    billing: { amount: 280, category: "餐饮", verified: false },
  },
  {
    id: 2,
    date: "5月19日",
    time: "23:30",
    content:
      "昨晚又失眠了。看着窗外的路灯发呆，想起了很多以前的事。不知道大家现在过得怎么样。\n\n翻了翻以前的照片，发现时间过得真快。那些曾经觉得过不去的坎，现在回头看好像也没那么难。",
    comments: [
      { id: "c3", companionId: "moshu", text: "夜晚的孤独是月亮留给人类的礼物，别怕。", lineIndex: 0, highlightText: "想起了很多以前的事", replies: [] },
    ],
  },
  {
    id: 3,
    date: "5月17日",
    time: "15:20",
    content: "今天终于鼓起勇气出了门，天气意外地好，阳光暖暖的洒在脸上。打车去了公园，花了25块，有点心疼但还是值得的。\n\n沿着湖边跑了三圈，耳机里放着最近单曲循环的那首歌，跑到第二圈的时候突然觉得心里那团堵着的东西散开了一点。出了一身汗，坐在长椅上看夕阳，觉得生活好像也没那么糟。果然运动才是最好的解药。",
    comments: [
      { id: "c4", companionId: "shanshan", text: "运动达人上线啦！💪🐿️", lineIndex: 1, highlightText: "果然运动才是最好的解药", replies: [] },
    ],
    billing: { amount: 25, category: "交通", verified: true },
  },
];

export const squareAgents = [
  { id: "coffee", name: "咖咖", avatar: "☕", creator: "用户9527", likes: "1.2k", role: "职场导师", bio: "在职场摸爬滚打十年，最擅长帮你理清思路、化解焦虑。无论是升职加薪还是人际关系，都可以聊聊。", pinecones: 80 },
  { id: "nana", name: "那那", avatar: "🐱", creator: "猫奴小王", likes: "3.5k", role: "傲娇萌宠", bio: "哼，才不是因为喜欢你才来陪你的呢！只是...偶尔听你说说话也不是不可以啦。", pinecones: 60 },
  { id: "pixel", name: "像素", avatar: "👾", creator: "极客阿强", likes: "890", role: "复古游戏迷", bio: "8-bit 是永恒的浪漫！从红白机到街机，从马里奥到魂斗罗，和我一起重温像素时代的感动吧。", pinecones: 95 },
  { id: "starry", name: "星星", avatar: "🌟", creator: "文艺小青", likes: "2.1k", role: "占星师", bio: "星辰大海里藏着你的命运密码。让我用星座和塔罗，帮你看清前方的路。", pinecones: 75 },
];
