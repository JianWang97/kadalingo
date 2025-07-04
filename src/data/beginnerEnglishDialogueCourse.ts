import { Course } from "./types";

export const beginnerEnglishDialogueCourse: Course = {
  id: 1,
  name: "日常英语表达",
  description: "本课程涵盖日常英语表达，适合初学者快速掌握常用句型",
  difficulty: "beginner",
  category: "日常对话",
  tags: ["日常", "口语", "基础", "实用"],
  totalLessons: 10,
  estimatedHours: 2,
  createdAt: new Date("2024-06-01T00:00:00Z"),
  updatedAt: new Date("2024-06-21T00:00:00Z"),
  lessons: [
    {
      id: 1,
      title: "第1节：基础问候",
      description: "学习常见的问候语和日常寒暄表达",
      estimatedTime: 10,
      sentences: [
        { id: 1, english: "Good morning!", chinese: "早上好！", phonetic: "ˌɡʊd ˈmɔːrnɪŋ", difficulty: "easy" },
        { id: 2, english: "Good night.", chinese: "晚安", phonetic: "ˌɡʊd ˈnaɪt", difficulty: "easy" },
        { id: 3, english: "How's it going?", chinese: "怎么样？", phonetic: "haʊz ɪt ˈɡoʊɪŋ", difficulty: "easy" },
        { id: 4, english: "Long time no see.", chinese: "好久不见", phonetic: "lɔːŋ taɪm noʊ siː", difficulty: "easy" },
        { id: 5, english: "See you soon.", chinese: "回头见", phonetic: "siː juː suːn", difficulty: "easy" },
        { id: 6, english: "Take it easy.", chinese: "放轻松", phonetic: "teɪk ɪt ˈiːzi", difficulty: "easy" },
        { id: 7, english: "What's up?", chinese: "怎么了？", phonetic: "wʌts ʌp", difficulty: "easy" },
        { id: 8, english: "Not much.", chinese: "没什么", phonetic: "nɒt mʌtʃ", difficulty: "easy" },
        { id: 9, english: "Have a seat.", chinese: "请坐", phonetic: "hæv ə siːt", difficulty: "easy" },
        { id: 10, english: "Make yourself at home.", chinese: "请随意", phonetic: "meɪk jɔːr ˈself æt hoʊm", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 2,
      title: "第2节：购物交流",
      description: "掌握购物时常用的英语表达",
      estimatedTime: 10,
      sentences: [
        { id: 11, english: "Can I help you?", chinese: "我能帮你吗？", phonetic: "kæn aɪ help juː", difficulty: "easy" },
        { id: 12, english: "Just looking, thanks.", chinese: "随便看看，谢谢", phonetic: "dʒʌst ˈlʊkɪŋ θæŋks", difficulty: "easy" },
        { id: 13, english: "How much is this?", chinese: "这个多少钱？", phonetic: "haʊ mʌtʃ ɪz ðɪs", difficulty: "easy" },
        { id: 14, english: "It's too expensive.", chinese: "太贵了", phonetic: "ɪts tuː ɪkˈspensɪv", difficulty: "easy" },
        { id: 15, english: "Can you give me a discount?", chinese: "可以便宜点吗？", phonetic: "kæn juː ɡɪv miː ə ˈdɪskaʊnt", difficulty: "easy" },
        { id: 16, english: "I'll take it.", chinese: "我要了", phonetic: "aɪl teɪk ɪt", difficulty: "easy" },
        { id: 17, english: "Do you accept credit cards?", chinese: "你们收信用卡吗？", phonetic: "duː juː əkˈsept ˈkredɪt kɑːrdz", difficulty: "easy" },
        { id: 18, english: "Here is your change.", chinese: "这是你的零钱", phonetic: "hɪr ɪz jɔːr tʃeɪndʒ", difficulty: "easy" },
        { id: 19, english: "Can I have a receipt?", chinese: "可以给我发票吗？", phonetic: "kæn aɪ hæv ə rɪˈsiːt", difficulty: "easy" },
        { id: 20, english: "Thank you for your help.", chinese: "谢谢你的帮助", phonetic: "θæŋk juː fə jɔːr help", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 3,
      title: "第3节：问路技巧",
      description: "学习如何用英语询问和指路",
      estimatedTime: 10,
      sentences: [
        { id: 21, english: "Where is the restroom?", chinese: "洗手间在哪里？", phonetic: "wɛr ɪz ðə ˈrɛstruːm", difficulty: "easy" },
        { id: 22, english: "Go straight ahead.", chinese: "一直往前走", phonetic: "ɡoʊ streɪt əˈhɛd", difficulty: "easy" },
        { id: 23, english: "Turn left.", chinese: "左转", phonetic: "tɜrn lɛft", difficulty: "easy" },
        { id: 24, english: "Turn right.", chinese: "右转", phonetic: "tɜrn raɪt", difficulty: "easy" },
        { id: 25, english: "It's on your right.", chinese: "在你右边", phonetic: "ɪts ɑn jɔːr raɪt", difficulty: "easy" },
        { id: 26, english: "It's on your left.", chinese: "在你左边", phonetic: "ɪts ɑn jɔːr lɛft", difficulty: "easy" },
        { id: 27, english: "Is it far?", chinese: "远吗？", phonetic: "ɪz ɪt fɑr", difficulty: "easy" },
        { id: 28, english: "No, it's close.", chinese: "不，挺近的", phonetic: "noʊ ɪts kloʊs", difficulty: "easy" },
        { id: 29, english: "How do I get there?", chinese: "我怎么去那里？", phonetic: "haʊ duː aɪ ɡɛt ðɛr", difficulty: "easy" },
        { id: 30, english: "Follow me.", chinese: "跟我来", phonetic: "ˈfɑloʊ miː", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 4,
      title: "第4节：饮食喜好",
      description: "谈论食物和饮料的喜好与建议",
      estimatedTime: 10,
      sentences: [
        { id: 31, english: "What's your favorite food?", chinese: "你最喜欢的食物是什么？", phonetic: "wʌts jɔːr ˈfeɪvərɪt fuːd", difficulty: "easy" },
        { id: 32, english: "I like pizza.", chinese: "我喜欢披萨", phonetic: "aɪ laɪk ˈpiːtsə", difficulty: "easy" },
        { id: 33, english: "Do you want some coffee?", chinese: "你想喝咖啡吗？", phonetic: "duː juː wɑnt sʌm ˈkɔːfi", difficulty: "easy" },
        { id: 34, english: "Yes, please.", chinese: "好的，谢谢", phonetic: "jɛs pliːz", difficulty: "easy" },
        { id: 35, english: "No, thanks.", chinese: "不用，谢谢", phonetic: "noʊ θæŋks", difficulty: "easy" },
        { id: 36, english: "I am full.", chinese: "我吃饱了", phonetic: "aɪ æm fʊl", difficulty: "easy" },
        { id: 37, english: "It tastes great.", chinese: "味道很好", phonetic: "ɪt teɪsts ɡreɪt", difficulty: "easy" },
        { id: 38, english: "I am thirsty.", chinese: "我渴了", phonetic: "aɪ æm ˈθɜrsti", difficulty: "easy" },
        { id: 39, english: "Let's eat out.", chinese: "我们出去吃吧", phonetic: "lɛts iːt aʊt", difficulty: "easy" },
        { id: 40, english: "Enjoy your meal!", chinese: "祝你好胃口！", phonetic: "ɪnˈdʒɔɪ jɔː miːl", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 5,
      title: "第5节：时间与日期",
      description: "学习谈论时间和日期的表达方式",
      estimatedTime: 10,
      sentences: [
        { id: 41, english: "What's the date today?", chinese: "今天几号？", phonetic: "wʌts ðə deɪt təˈdeɪ", difficulty: "easy" },
        { id: 42, english: "Today is Monday.", chinese: "今天星期一", phonetic: "təˈdeɪ ɪz ˈmʌndeɪ", difficulty: "easy" },
        { id: 43, english: "What time do you get up?", chinese: "你几点起床？", phonetic: "wʌt taɪm duː juː ɡɛt ʌp", difficulty: "easy" },
        { id: 44, english: "I get up at 7.", chinese: "我七点起床", phonetic: "aɪ ɡɛt ʌp æt ˈsevən", difficulty: "easy" },
        { id: 45, english: "When do you go to bed?", chinese: "你什么时候睡觉？", phonetic: "wɛn duː juː ɡoʊ tə bɛd", difficulty: "easy" },
        { id: 46, english: "I go to bed at 11.", chinese: "我十一点睡觉", phonetic: "aɪ ɡoʊ tə bɛd æt ɪˈlɛvən", difficulty: "easy" },
        { id: 47, english: "Do you work every day?", chinese: "你每天都工作吗？", phonetic: "duː juː wɜrk ˈɛvri deɪ", difficulty: "easy" },
        { id: 48, english: "No, I have weekends off.", chinese: "不，周末休息", phonetic: "noʊ aɪ hæv ˈwiːkˌɛndz ɔf", difficulty: "easy" },
        { id: 49, english: "What do you do in your free time?", chinese: "你空闲时做什么？", phonetic: "wʌt duː juː duː ɪn jɔːr friː taɪm", difficulty: "easy" },
        { id: 50, english: "I watch movies.", chinese: "我看电影", phonetic: "aɪ wɒtʃ ˈmuːviz", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 6,
      title: "第6节：家庭与婚姻",
      description: "谈论家庭成员及婚姻状况的表达",
      estimatedTime: 10,
      sentences: [
        { id: 51, english: "Do you have any brothers or sisters?", chinese: "你有兄弟姐妹吗？", phonetic: "duː juː hæv ˈɛni ˈbrʌðərz ɔr ˈsɪstərz", difficulty: "easy" },
        { id: 52, english: "I have one brother.", chinese: "我有一个兄弟", phonetic: "aɪ hæv wʌn ˈbrʌðər", difficulty: "easy" },
        { id: 53, english: "Are you married?", chinese: "你结婚了吗？", phonetic: "ɑːr juː ˈmærɪd", difficulty: "easy" },
        { id: 54, english: "Yes, I am married.", chinese: "是的，我结婚了", phonetic: "jɛs aɪ æm ˈmærɪd", difficulty: "easy" },
        { id: 55, english: "No, I am single.", chinese: "不，我单身", phonetic: "noʊ aɪ æm ˈsɪŋɡəl", difficulty: "easy" },
        { id: 56, english: "Do you have children?", chinese: "你有孩子吗？", phonetic: "duː juː hæv ˈtʃɪldrən", difficulty: "easy" },
        { id: 57, english: "I have two kids.", chinese: "我有两个孩子", phonetic: "aɪ hæv tuː kɪdz", difficulty: "easy" },
        { id: 58, english: "How old are they?", chinese: "他们多大了？", phonetic: "haʊ oʊld ɑːr ðeɪ", difficulty: "easy" },
        { id: 59, english: "They are 5 and 8.", chinese: "他们5岁和8岁", phonetic: "ðeɪ ɑːr faɪv ənd eɪt", difficulty: "easy" },
        { id: 60, english: "That's nice.", chinese: "那很好", phonetic: "ðæts naɪs", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 7,
      title: "第7节：音乐兴趣",
      description: "谈论音乐喜好及相关活动的表达",
      estimatedTime: 10,
      sentences: [
        { id: 61, english: "Do you like music?", chinese: "你喜欢音乐吗？", phonetic: "duː ju˕ laɪk ˈmjuːzɪk", difficulty: "easy" },
        { id: 62, english: "Yes, I love it.", chinese: "是的，我很喜欢", phonetic: "jɛs aɪ lʌv ɪt", difficulty: "easy" },
        { id: 63, english: "Can you play the piano?", chinese: "你会弹钢琴吗？", phonetic: "kæn juː pleɪ ðə piˈænoʊ", difficulty: "easy" },
        { id: 64, english: "A little.", chinese: "会一点", phonetic: "ə ˈlɪtəl", difficulty: "easy" },
        { id: 65, english: "What kind of music do you like?", chinese: "你喜欢什么类型的音乐？", phonetic: "wʌt kaɪnd əv ˈmjuːzɪk duː juː laɪk", difficulty: "easy" },
        { id: 66, english: "I like pop music.", chinese: "我喜欢流行音乐", phonetic: "aɪ laɪk pɑp ˈmjuːzɪk", difficulty: "easy" },
        { id: 67, english: "Do you sing?", chinese: "你唱歌吗？", phonetic: "duː ju˕ sɪŋ", difficulty: "easy" },
        { id: 68, english: "Sometimes.", chinese: "有时候", phonetic: "ˈsʌmtaɪmz", difficulty: "easy" },
        { id: 69, english: "Let's sing together.", chinese: "我们一起唱吧", phonetic: "lɛts sɪŋ təˈɡɛðər", difficulty: "easy" },
        { id: 70, english: "That sounds fun.", chinese: "听起来很有趣", phonetic: "ðæt saʊndz fʌn", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 8,
      title: "第8节：运动爱好",
      description: "谈论运动喜好及相关活动的表达",
      estimatedTime: 10,
      sentences: [
        { id: 71, english: "Do you like sports?", chinese: "你喜欢运动吗？", phonetic: "duː ju˕ laɪk spɔrts", difficulty: "easy" },
        { id: 72, english: "I like basketball.", chinese: "我喜欢篮球", phonetic: "aɪ laɪk ˈbæskɪtˌbɔl", difficulty: "easy" },
        { id: 73, english: "Can you swim?", chinese: "你会游泳吗？", phonetic: "kæn ju˕ swɪm", difficulty: "easy" },
        { id: 74, english: "Yes, I can.", chinese: "是的，我会", phonetic: "jɛs aɪ kæn", difficulty: "easy" },
        { id: 75, english: "No, I can't.", chinese: "不，我不会", phonetic: "noʊ aɪ kænt", difficulty: "easy" },
        { id: 76, english: "Let's play football.", chinese: "我们去踢足球吧", phonetic: "lɛts pleɪ ˈfʊtbɔl", difficulty: "easy" },
        { id: 77, english: "I am tired.", chinese: "我累了", phonetic: "aɪ æm taɪərd", difficulty: "easy" },
        { id: 78, english: "Take a break.", chinese: "休息一下", phonetic: "teɪk ə breɪk", difficulty: "easy" },
        { id: 79, english: "You did a great job.", chinese: "你做得很好", phonetic: "juː dɪd ə ɡreɪt dʒɑb", difficulty: "easy" },
        { id: 80, english: "Let's try again.", chinese: "我们再试一次", phonetic: "lɛts traɪ əˈɡɛn", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 9,
      title: "第9节：健康与医疗",
      description: "学习与健康和医疗相关的基本英语表达",
      estimatedTime: 10,
      sentences: [
        { id: 81, english: "What's the matter?", chinese: "怎么了？", phonetic: "wʌts ðə ˈmætər", difficulty: "easy" },
        { id: 82, english: "I have a headache.", chinese: "我头疼", phonetic: "aɪ hæv ə ˈhɛdeɪk", difficulty: "easy" },
        { id: 83, english: "Are you okay?", chinese: "你还好吗？", phonetic: "ɑːr ju˕ oʊˈkeɪ", difficulty: "easy" },
        { id: 84, english: "I need to see a doctor.", chinese: "我需要看医生", phonetic: "aɪ niːd tə siː ə ˈdɑktər", difficulty: "easy" },
        { id: 85, english: "Take some medicine.", chinese: "吃点药吧", phonetic: "teɪk sʌm ˈmɛdɪsɪn", difficulty: "easy" },
        { id: 86, english: "Get well soon.", chinese: "早日康复", phonetic: "ɡɛt wɛl suːn", difficulty: "easy" },
        { id: 87, english: "Do you need help?", chinese: "你需要帮助吗？", phonetic: "duː ju˕ niːd hɛlp", difficulty: "easy" },
        { id: 88, english: "Call me if you need anything.", chinese: "有需要就叫我", phonetic: "kɔːl miː ɪf ju˕ niːd ˈɛnɪθɪŋ", difficulty: "easy" },
        { id: 89, english: "Thank you, I will.", chinese: "谢谢，我会的", phonetic: "θæŋk ju˕ aɪ wɪl", difficulty: "easy" },
        { id: 90, english: "No problem.", chinese: "没问题", phonetic: "noʊ ˈprɒbləm", difficulty: "easy" },
      ],
      courseId: 1
    },
    {
      id: 10,
      title: "第10节：日常计划",
      description: "学习如何用英语表达日常计划和安排",
      estimatedTime: 10,
      sentences: [
        { id: 91, english: "What are your plans for today?", chinese: "你今天有什么安排？", phonetic: "wʌt ɑːr jɔːr plænz fə təˈdeɪ", difficulty: "easy" },
        { id: 92, english: "I am going shopping.", chinese: "我要去购物", phonetic: "aɪ æm ˈɡoʊɪŋ ˈʃɑːpɪŋ", difficulty: "easy" },
        { id: 93, english: "Let's go together.", chinese: "我们一起去吧", phonetic: "lɛts ɡoʊ təˈɡɛðər", difficulty: "easy" },
        { id: 94, english: "Sounds good.", chinese: "听起来不错", phonetic: "saʊndz ɡʊd", difficulty: "easy" },
        { id: 95, english: "See you at 3 o'clock.", chinese: "三点见", phonetic: "siː juː æt θriː əˈklɒk", difficulty: "easy" },
        { id: 96, english: "Don't be late.", chinese: "别迟到", phonetic: "doʊnt biː leɪt", difficulty: "easy" },
        { id: 97, english: "I'll be there on time.", chinese: "我会准时到", phonetic: "aɪl biː ðɛr ɑn taɪm", difficulty: "easy" },
        { id: 98, english: "Let's have fun!", chinese: "让我们玩得开心！", phonetic: "lɛts hæv fʌn", difficulty: "easy" },
        { id: 99, english: "Take some photos.", chinese: "拍些照片吧", phonetic: "teɪk sʌm ˈfoʊtoʊz", difficulty: "easy" },
        { id: 100, english: "See you next time.", chinese: "下次见", phonetic: "siː juː nɛkst taɪm", difficulty: "easy" },
      ],
      courseId: 1
    },
  ],
};
