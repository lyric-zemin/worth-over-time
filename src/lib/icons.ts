export interface IconDefinition {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
  keywords: string[];
}

/** 离线关键词规则表：越具体的词越靠前，匹配时按关键词长度优先 */
export const ICON_LIBRARY: IconDefinition[] = [
  { key: "coffee", label: "咖啡", emoji: "☕", gradient: "linear-gradient(135deg,#FFD8A8,#C98A5E)", keywords: ["咖啡", "拿铁", "美式", "latte", "coffee", "espresso", "星巴克"] },
  { key: "milktea", label: "奶茶", emoji: "🧋", gradient: "linear-gradient(135deg,#FFE0B2,#E9A97B)", keywords: ["奶茶", "波霸", "珍珠", "果茶", "喜茶", "蜜雪", "bubble tea"] },
  { key: "drink", label: "饮品", emoji: "🥤", gradient: "linear-gradient(135deg,#FFC7D9,#FF7A9E)", keywords: ["可乐", "汽水", "饮料", "果汁", "矿泉水", "苏打", "drink", "soda"] },
  { key: "meal", label: "饭菜", emoji: "🍜", gradient: "linear-gradient(135deg,#FFD38A,#FF8A5B)", keywords: ["外卖", "午饭", "晚饭", "早餐", "饭", "面", "粉", "餐", "火锅", "烧烤", "麻辣烫", "汉堡", "披萨", "meal", "lunch", "dinner"] },
  { key: "fruit", label: "水果", emoji: "🍓", gradient: "linear-gradient(135deg,#FFB3C1,#FF5F7E)", keywords: ["水果", "苹果", "草莓", "西瓜", "香蕉", "车厘子", "蓝莓", "榴莲", "fruit"] },
  { key: "snack", label: "零食", emoji: "🍪", gradient: "linear-gradient(135deg,#FFE8A3,#F0A93B)", keywords: ["零食", "饼干", "薯片", "巧克力", "坚果", "辣条", "糖果", "snack"] },
  { key: "cake", label: "甜点", emoji: "🎂", gradient: "linear-gradient(135deg,#FFD6E8,#F78FB3)", keywords: ["蛋糕", "面包", "甜点", "甜品", "冰淇淋", "慕斯", "cake", "bread"] },
  { key: "clothes", label: "衣服", emoji: "👕", gradient: "linear-gradient(135deg,#A8D8FF,#6C8CFF)", keywords: ["衣服", "T恤", "衬衫", "卫衣", "外套", "羽绒服", "裙子", "裤子", "毛衣", "shirt", "clothes"] },
  { key: "shoes", label: "鞋", emoji: "👟", gradient: "linear-gradient(135deg,#C8E7FF,#7AA5FF)", keywords: ["鞋", "球鞋", "跑鞋", "靴", "拖鞋", "sneaker", "shoes"] },
  { key: "bag", label: "包袋", emoji: "👜", gradient: "linear-gradient(135deg,#FFD9B8,#D8946C)", keywords: ["包", "背包", "手提包", "钱包", "书包", "行李箱", "bag"] },
  { key: "beauty", label: "美妆", emoji: "💄", gradient: "linear-gradient(135deg,#FFC2D4,#F0729E)", keywords: ["口红", "化妆", "护肤", "面膜", "香水", "粉底", "精华", "美妆", "cosmetic"] },
  { key: "phone", label: "手机", emoji: "📱", gradient: "linear-gradient(135deg,#C9D6FF,#8C7BFF)", keywords: ["手机", "iPhone", "安卓", "充电宝", "手机壳", "phone"] },
  { key: "laptop", label: "电脑", emoji: "💻", gradient: "linear-gradient(135deg,#C3C9E8,#7E86C9)", keywords: ["电脑", "笔记本", "MacBook", "平板", "显示器", "键盘", "鼠标", "laptop", "ipad"] },
  { key: "headphone", label: "耳机", emoji: "🎧", gradient: "linear-gradient(135deg,#C6B9FF,#8C6CF5)", keywords: ["耳机", "音响", "音箱", "麦克风", "AirPods", "headphone"] },
  { key: "camera", label: "相机", emoji: "📷", gradient: "linear-gradient(135deg,#D7DCE8,#8A94B8)", keywords: ["相机", "镜头", "拍立得", "三脚架", "camera"] },
  { key: "book", label: "书", emoji: "📚", gradient: "linear-gradient(135deg,#FFE1A8,#E9A23B)", keywords: ["书", "小说", "教材", "杂志", "电子书", "book"] },
  { key: "stationery", label: "文具", emoji: "✏️", gradient: "linear-gradient(135deg,#FFF0A8,#F5C545)", keywords: ["笔", "本子", "笔记本纸", "文具", "便利贴", "尺子", "pen"] },
  { key: "furniture", label: "家具", emoji: "🛋️", gradient: "linear-gradient(135deg,#D9E8C8,#92B77C)", keywords: ["沙发", "桌子", "椅子", "书桌", "柜子", "书架", "家具", "chair"] },
  { key: "appliance", label: "家电", emoji: "🧺", gradient: "linear-gradient(135deg,#BFE8F5,#6AB4D8)", keywords: ["洗衣机", "冰箱", "空调", "吸尘器", "电饭煲", "微波炉", "台灯", "风扇", "家电"] },
  { key: "kitchen", label: "厨房", emoji: "🍳", gradient: "linear-gradient(135deg,#FFD9A8,#F09A5A)", keywords: ["锅", "碗", "杯子", "水壶", "刀具", "餐具", "厨具", "kitchen"] },
  { key: "bed", label: "寝具", emoji: "🛏️", gradient: "linear-gradient(135deg,#D9D2FF,#9C8BE8)", keywords: ["床", "被子", "枕头", "床垫", "四件套", "睡衣"] },
  { key: "sport", label: "运动", emoji: "🏀", gradient: "linear-gradient(135deg,#FFC48A,#F07A3D)", keywords: ["篮球", "足球", "羽毛球", "瑜伽垫", "运动", "健身卡", "哑铃", "sport", "gym"] },
  { key: "bike", label: "骑行", emoji: "🚲", gradient: "linear-gradient(135deg,#B8E8D0,#4FB58C)", keywords: ["自行车", "单车", "骑行", "头盔", "bike"] },
  { key: "pet", label: "宠物", emoji: "🐱", gradient: "linear-gradient(135deg,#FFD9B0,#E9A46A)", keywords: ["猫", "狗", "宠物", "猫粮", "狗粮", "猫砂", "宠物", "pet"] },
  { key: "plant", label: "植物", emoji: "🌿", gradient: "linear-gradient(135deg,#C8EBC0,#66B87A)", keywords: ["花", "绿植", "盆栽", "多肉", "鲜花", "植物", "plant"] },
  { key: "car", label: "车", emoji: "🚗", gradient: "linear-gradient(135deg,#BFD4FF,#6B8FE0)", keywords: ["汽车", "车险", "加油", "洗车", "停车", "car"] },
  { key: "transit", label: "出行", emoji: "🚇", gradient: "linear-gradient(135deg,#C4DCF5,#7099CC)", keywords: ["地铁", "公交", "高铁", "火车", "打车", "机票", "车票", "交通"] },
  { key: "travel", label: "旅行", emoji: "✈️", gradient: "linear-gradient(135deg,#BFE4FF,#5BA8E8)", keywords: ["旅行", "旅游", "酒店", "民宿", "门票", "度假", "travel"] },
  { key: "medicine", label: "健康", emoji: "💊", gradient: "linear-gradient(135deg,#C8F0E4,#5FC0A3)", keywords: ["药", "感冒", "体检", "看牙", "口罩", "维生素", "医院"] },
  { key: "game", label: "游戏", emoji: "🎮", gradient: "linear-gradient(135deg,#CFC0FF,#8A66E8)", keywords: ["游戏", "手柄", "Switch", "Steam", "点卡", "game"] },
  { key: "music", label: "音乐", emoji: "🎵", gradient: "linear-gradient(135deg,#FFC8E8,#D86FB5)", keywords: ["音乐", "演唱会", "乐器", "吉他", "唱片", "music"] },
  { key: "subscription", label: "订阅", emoji: "🎫", gradient: "linear-gradient(135deg,#D6C8FF,#9A7BF0)", keywords: ["会员", "订阅", "年费", "月费", "视频会员", "云盘", "软件", "subscription"] },
  { key: "toy", label: "玩具", emoji: "🧸", gradient: "linear-gradient(135deg,#FFDCC0,#EFA06F)", keywords: ["玩具", "手办", "乐高", "娃娃", "积木", "拼图"] },
  { key: "watch", label: "手表", emoji: "⌚", gradient: "linear-gradient(135deg,#CFD8E8,#8895B5)", keywords: ["手表", "手环", "watch"] },
  { key: "glasses", label: "眼镜", emoji: "👓", gradient: "linear-gradient(135deg,#D5E4F0,#86A6C8)", keywords: ["眼镜", "隐形", "墨镜", "镜片"] },
  { key: "jewelry", label: "饰品", emoji: "💍", gradient: "linear-gradient(135deg,#FFE6A8,#E6B54B)", keywords: ["戒指", "项链", "耳环", "手链", "首饰", "黄金"] },
  { key: "haircut", label: "理发", emoji: "✂️", gradient: "linear-gradient(135deg,#D8D2FF,#9487D8)", keywords: ["理发", "剪头发", "烫发", "美甲", "染发"] },
  { key: "wine", label: "酒", emoji: "🍷", gradient: "linear-gradient(135deg,#F5B8C8,#C45F80)", keywords: ["酒", "啤酒", "红酒", "威士忌", "wine"] },
  { key: "gift", label: "礼物", emoji: "🎁", gradient: "linear-gradient(135deg,#FFC9D4,#F07E9B)", keywords: ["礼物", "送礼", "红包", "伴手礼"] },
  { key: "general", label: "购物", emoji: "🛍️", gradient: "linear-gradient(135deg,#D9D2FF,#FFC7B2)", keywords: [] },
];

export const DEFAULT_ICON_KEY = "general";

const MATCH_RULES = ICON_LIBRARY.flatMap((icon) =>
  icon.keywords.map((keyword) => ({ keyword: keyword.toLowerCase(), icon })),
).sort((a, b) => b.keyword.length - a.keyword.length);

export function getIcon(key: string): IconDefinition {
  return ICON_LIBRARY.find((icon) => icon.key === key) ?? ICON_LIBRARY[ICON_LIBRARY.length - 1];
}

/** 名称里出现最长关键词的规则先命中；未命中给通用购物图标 */
export function matchIconByName(name: string): IconDefinition {
  const normalized = name.toLowerCase().replace(/[\s\-_·、,，/]/g, "");
  if (!normalized) return getIcon(DEFAULT_ICON_KEY);
  const hit = MATCH_RULES.find((rule) => normalized.includes(rule.keyword));
  return hit?.icon ?? getIcon(DEFAULT_ICON_KEY);
}

/** 图标选择面板里的常用候选：物品/耐用品靠前，消耗品靠后 */
export const QUICK_ICON_KEYS = [
  "phone", "laptop", "headphone", "game", "car", "watch", "toy",
  "clothes", "shoes", "bag",
  "sport", "book", "plant", "pet",
  "coffee", "cake",
  "snack", "drink", "fruit", "wine", "beauty", "medicine", "gift",
  "general",
];
