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

export interface DiaryComment {
  id: string;
  companionId: string;
  text: string;
  lineIndex: number;
  /** The exact sentence/phrase the AI highlights */
  highlightText: string;
}

export interface DiaryEntry {
  id: number;
  date: string;
  time: string;
  content: string;
  comments: DiaryComment[];
  billing?: { amount: number; category: string; verified: boolean };
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
    name: "闪闪",
    avatar: "✨",
    colorClass: "bg-companion-amber",
    textColorClass: "text-companion-amber-text",
    role: "生活助手",
    bio: "让每天都闪闪发光！",
    intimacy: 42,
    level: 2,
    lastMsg: "记账提醒：晚饭花了多少呀？",
    delay: "5-15分钟",
  },
  {
    id: "moshu",
    name: "墨叔",
    avatar: "📜",
    colorClass: "bg-companion-indigo",
    textColorClass: "text-companion-indigo-text",
    role: "文学向导",
    bio: "文字是灵魂的避风港",
    intimacy: 15,
    level: 1,
    lastMsg: "读到一段话，想与你分享。",
    delay: "深夜触发",
  },
];

export const diaryEntries: DiaryEntry[] = [
  {
    id: 1,
    date: "5月20日",
    time: "20:45",
    content:
      "今天去吃了那家想了很久的日料店，虽然有点贵（花了280元），但味道真的很惊艳。尤其是那道手握，入口即化的感觉...\n\n不过，吃完后突然觉得有点空虚，可能是因为一个人吧。明明是很开心的事情，却忍不住想，如果有人一起分享就更好了。",
    comments: [
      { id: "c1", companionId: "shanshan", text: "看起来超好吃！下次我陪你呀～ 🍣", lineIndex: 0 },
      { id: "c2", companionId: "xiaoman", text: "偶尔慢下来享受美食，也是种修行呢。", lineIndex: 1 },
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
      { id: "c3", companionId: "moshu", text: "夜晚的孤独是月亮留给人类的礼物，别怕。", lineIndex: 0 },
    ],
  },
  {
    id: 3,
    date: "5月17日",
    time: "15:20",
    content: "今天终于鼓起勇气出了门，天气意外地好，阳光暖暖的洒在脸上。打车去了公园，花了25块，有点心疼但还是值得的。\n\n沿着湖边跑了三圈，耳机里放着最近单曲循环的那首歌，跑到第二圈的时候突然觉得心里那团堵着的东西散开了一点。出了一身汗，坐在长椅上看夕阳，觉得生活好像也没那么糟。果然运动才是最好的解药。",
    comments: [
      { id: "c4", companionId: "shanshan", text: "运动达人上线啦！💪", lineIndex: 0 },
    ],
    billing: { amount: 25, category: "交通", verified: true },
  },
];

export const squareAgents = [
  { id: "coffee", name: "咖咖", avatar: "☕", creator: "用户9527", likes: "1.2k", role: "职场导师" },
  { id: "nana", name: "那那", avatar: "🐱", creator: "猫奴小王", likes: "3.5k", role: "傲娇萌宠" },
  { id: "pixel", name: "像素", avatar: "👾", creator: "极客阿强", likes: "890", role: "复古游戏迷" },
  { id: "starry", name: "星星", avatar: "🌟", creator: "文艺小青", likes: "2.1k", role: "占星师" },
];
