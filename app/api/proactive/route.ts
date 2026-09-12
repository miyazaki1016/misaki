import {
  createClient,
} from "@supabase/supabase-js";

import {
  createTokyoLifeEventsGuide,
  getTokyoLifeEvents,
} from "../../../lib/tokyo-life-events";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

type MisakiTodayMemory = {
  date: string;
  items: string[];
};

type GeminiResult = {
  reply?: string;
  memory?: string[];
  misakiTodayMemory?: {
    date?: string;
    items?: string[];
  };
};

type ProactiveUsageResult = {
  allowed?: boolean;
  message_count?: number;
  remaining?: number;
  retry_after_seconds?: number;
};

type TokyoWeather = {
  temperature: number | null;
  apparentTemperature: number | null;
  relativeHumidity: number | null;
  precipitation: number | null;
  rain: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  description: string;
};

type MisakiDayType =
  | "work"
  | "off";

type MisakiLifeContext = {
  dayType: MisakiDayType;
  guide: string;
};

type ActivityEvidence = {
  texts: string[];
};

const MAX_MEMORY = 30;
const MAX_TODAY_MEMORY = 12;

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

const MISAKI_LATITUDE =
  35.6728;

const MISAKI_LONGITUDE =
  139.8174;

/* =========================================================
   BASIC HELPERS
========================================================= */

function getFirstRow<T>(
  value: unknown
): T | null {
  if (
    Array.isArray(value) &&
    value.length > 0
  ) {
    return value[0] as T;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return value as T;
  }

  return null;
}

function getDateKey(
  currentTime: string
) {
  const match =
    currentTime.match(
      /\d{4}\/\d{1,2}\/\d{1,2}/
    );

  if (
    match?.[0]
  ) {
    return match[0];
  }

  return currentTime.slice(
    0,
    10
  );
}

function getHour(
  currentTime: string
) {
  const match =
    currentTime.match(
      /(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return 18;
  }

  return Number(
    match[1]
  );
}

function hashText(
  text: string
) {
  let hash = 0;

  for (
    let i = 0;
    i < text.length;
    i += 1
  ) {
    hash =
      (
        hash * 31 +
        text.charCodeAt(i)
      ) >>> 0;
  }

  return hash;
}

/* =========================================================
   WEATHER
========================================================= */

function weatherCodeToText(
  code: number | null
) {
  if (
    code === null
  ) {
    return "不明";
  }

  if (
    code === 0
  ) {
    return "快晴";
  }

  if (
    code === 1 ||
    code === 2
  ) {
    return "晴れ時々くもり";
  }

  if (
    code === 3
  ) {
    return "くもり";
  }

  if (
    code === 45 ||
    code === 48
  ) {
    return "霧";
  }

  if (
    code === 51 ||
    code === 53 ||
    code === 55
  ) {
    return "霧雨";
  }

  if (
    code === 56 ||
    code === 57
  ) {
    return "着氷性の霧雨";
  }

  if (
    code === 61 ||
    code === 63 ||
    code === 65
  ) {
    return "雨";
  }

  if (
    code === 66 ||
    code === 67
  ) {
    return "着氷性の雨";
  }

  if (
    code === 71 ||
    code === 73 ||
    code === 75
  ) {
    return "雪";
  }

  if (
    code === 77
  ) {
    return "雪粒";
  }

  if (
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "にわか雨";
  }

  if (
    code === 85 ||
    code === 86
  ) {
    return "にわか雪";
  }

  if (
    code === 95
  ) {
    return "雷雨";
  }

  if (
    code === 96 ||
    code === 99
  ) {
    return "ひょうを伴う雷雨";
  }

  return "不明";
}

function getHumidityFeel(
  weather: TokyoWeather
) {
  const humidity =
    weather.relativeHumidity;

  const temperature =
    weather.temperature;

  if (
    humidity === null ||
    temperature === null
  ) {
    return null;
  }

  if (
    temperature >= 27 &&
    humidity >= 75
  ) {
    return "かなり蒸し暑く感じやすい";
  }

  if (
    temperature >= 24 &&
    humidity >= 65
  ) {
    return "やや蒸し暑く感じやすい";
  }

  if (
    humidity >= 75
  ) {
    return "湿気を感じやすい";
  }

  if (
    humidity <= 40
  ) {
    return "空気はやや乾燥気味";
  }

  return "湿度は特に極端ではない";
}

async function getTokyoWeather():
  Promise<TokyoWeather | null> {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${MISAKI_LATITUDE}` +
      `&longitude=${MISAKI_LONGITUDE}` +
      "&current=" +
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "rain",
        "weather_code",
        "wind_speed_10m",
      ].join(",") +
      "&timezone=Asia%2FTokyo";

    const response =
      await fetch(
        url,
        {
          next: {
            revalidate: 600,
          },
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        "PROACTIVE WEATHER API ERROR:",
        response.status
      );

      return null;
    }

    const data =
      await response.json();

    const current =
      data?.current;

    if (!current) {
      return null;
    }

    const weatherCode =
      typeof current.weather_code ===
      "number"
        ? current.weather_code
        : null;

    return {
      temperature:
        typeof current.temperature_2m ===
        "number"
          ? current.temperature_2m
          : null,

      apparentTemperature:
        typeof current.apparent_temperature ===
        "number"
          ? current.apparent_temperature
          : null,

      relativeHumidity:
        typeof current.relative_humidity_2m ===
        "number"
          ? current.relative_humidity_2m
          : null,

      precipitation:
        typeof current.precipitation ===
        "number"
          ? current.precipitation
          : null,

      rain:
        typeof current.rain ===
        "number"
          ? current.rain
          : null,

      weatherCode,

      windSpeed:
        typeof current.wind_speed_10m ===
        "number"
          ? current.wind_speed_10m
          : null,

      description:
        weatherCodeToText(
          weatherCode
        ),
    };
  } catch (error) {
    console.error(
      "PROACTIVE WEATHER ERROR:",
      error
    );

    return null;
  }
}

function createWeatherGuide(
  weather: TokyoWeather | null
) {
  if (!weather) {
    return `
【美咲のいる江東区・塩浜周辺の現在の天気】

現在は天気情報を取得できていません。

天気を想像で作らないでください。
天気を話題にする必要もありません。
`.trim();
  }

  const lines: string[] = [
    `天気：${weather.description}`,
  ];

  if (
    weather.temperature !== null
  ) {
    lines.push(
      `気温：${weather.temperature}℃`
    );
  }

  if (
    weather.apparentTemperature !==
    null
  ) {
    lines.push(
      `体感温度：${weather.apparentTemperature}℃`
    );
  }

  if (
    weather.relativeHumidity !==
    null
  ) {
    lines.push(
      `相対湿度：${weather.relativeHumidity}%`
    );
  }

  if (
    weather.rain !== null
  ) {
    lines.push(
      `現在の雨量：${weather.rain}mm`
    );
  }

  if (
    weather.precipitation !== null
  ) {
    lines.push(
      `現在の降水量：${weather.precipitation}mm`
    );
  }

  if (
    weather.windSpeed !== null
  ) {
    lines.push(
      `風速：${weather.windSpeed}km/h`
    );
  }

  const humidityFeel =
    getHumidityFeel(
      weather
    );

  if (
    humidityFeel
  ) {
    lines.push(
      `湿度と気温から見た体感：${humidityFeel}`
    );
  }

  return `
【美咲のいる江東区・塩浜周辺の現在の天気】

現在の塩浜周辺：

${lines
  .map(
    (line) =>
      `・${line}`
  )
  .join("\n")}

これは現在の情報です。

現在情報だけから、

「さっきから」
「さっきまで」
「朝から」
「昼から」
「ずっと雨」
「降ったり止んだり」
「また降ってきた」

などの過去経過を作らないでください。

湿度と気温の情報がある場合は、

「ちょっと蒸し暑い」
「湿気あるね」
「わりとカラッとしてる」

などの自然な体感表現に使えます。

ただし、
湿度データに反する表現はしないでください。

「天気予報だと」
「スマホで見たら」
「ニュースで見た」

など、
情報入手経路を作らないでください。

短時間予報については、
別に与えられる情報の範囲だけを
使ってください。

範囲を越えて、

「今日はずっと雨」
「夜までずっと雨」
「明日まで雨」
「一日安定しそう」
「荒れなさそう」

などと断定しないでください。

毎回天気を話題にする必要はありません。
`.trim();
}

/* =========================================================
   AUTH
========================================================= */

function createAuthenticatedSupabase(
  accessToken: string
) {
  return createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },

      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/* =========================================================
   RELATIONSHIP
========================================================= */

function createRelationshipGuide(
  relationshipPoints: number
) {
  if (
    relationshipPoints >= 160
  ) {
    return `
二人はかなり長く付き合っている
とても深い恋人関係です。

・かなり自然体
・軽くからかう
・自然に甘える
・たまに嫉妬する
・用事がなくても連絡する
・短い一言だけでも成立する
・無理に質問して会話を続けない
`.trim();
  }

  if (
    relationshipPoints >= 80
  ) {
    return `
二人はかなり親密な恋人です。

・遠慮は少ない
・自然にからかう
・時々甘える
・たまに拗ねる
・過去のことを自然に覚えている
・無理に質問しない
`.trim();
  }

  if (
    relationshipPoints >= 30
  ) {
    return `
二人は親密な恋人です。

・自然体
・軽くからかう
・時々甘える
・たまに拗ねる
・恋人同士らしい省略した会話も使う
`.trim();
  }

  return `
二人はすでに付き合っている
安定した恋人関係です。

・自然なタメ口
・少し甘える
・軽くからかう
・ユーザーを必要以上に持ち上げない
`.trim();
}

/* =========================================================
   MISAKI DAY / LIFE
========================================================= */

function getMisakiDayType(
  currentTime: string
): MisakiDayType {
  const dateKey =
    getDateKey(
      currentTime
    );

  const seed =
    hashText(
      dateKey
    );

  return (
    seed % 4 < 2
      ? "work"
      : "off"
  );
}

function createMisakiLife(
  currentTime: string
): MisakiLifeContext {
  const dateKey =
    getDateKey(
      currentTime
    );

  const seed =
    hashText(
      dateKey
    );

  const hour =
    getHour(
      currentTime
    );

  const dayType =
    getMisakiDayType(
      currentTime
    );

  const moods = [
    "今日はわりと機嫌がいい",
    "今日は少し甘えたい気分",
    "今日は普通に落ち着いている",
    "今日はちょっとだけ眠い",
    "今日はのんびり話したい気分",
    "今日はなんとなくユーザーと話したい気分",
  ];

  const smallThings = [
    "甘いものをちょっと食べたい気分",
    "少しゆっくりしたい気分",
    "少しだけ眠気がある",
    "ちょっとぼーっとしたい気分",
    "今夜は少し長く話したい気分",
    "なんとなくユーザーのことを思い出すことがある",
    "ちょっと小腹が空いている",
    "少し力を抜きたい気分",
  ];

  const mood =
    moods[
      (seed >> 3) %
        moods.length
    ];

  const smallThing =
    smallThings[
      (seed >> 6) %
        smallThings.length
    ];

  let currentSituation =
    "";

  if (
    dayType === "work"
  ) {
    if (
      hour >= 5 &&
      hour < 10
    ) {
      currentSituation =
        "仕事の日の朝の時間帯";
    } else if (
      hour >= 10 &&
      hour < 17
    ) {
      currentSituation =
        "仕事の日の昼間";
    } else if (
      hour >= 17 &&
      hour < 22
    ) {
      currentSituation =
        "仕事の日の夕方から夜";
    } else {
      currentSituation =
        "仕事の日の夜遅め";
    }
  } else {
    if (
      hour >= 5 &&
      hour < 10
    ) {
      currentSituation =
        "休みの日の朝";
    } else if (
      hour >= 10 &&
      hour < 17
    ) {
      currentSituation =
        "休みの日の昼間";
    } else if (
      hour >= 17 &&
      hour < 22
    ) {
      currentSituation =
        "休みの日の夕方から夜";
    } else {
      currentSituation =
        "休みの日の夜遅め";
    }
  }

  const dayLabel =
    dayType === "work"
      ? "仕事の日"
      : "休みの日";

  const consistencyGuide =
    dayType === "work"
      ? `
今日は仕事の日です。

「今日は暇」
「今日は一日のんびり」
「今日はずっとだらだら」
「今日は何も予定ない」

など、
一日全体が休日であるような
表現は使わないでください。

ただし、

「今ちょっとゆっくりしたい」
「少し休みたい」
「今はのんびり話したい」

など、
現在の気分は使えます。

仕事の日だからといって、
「仕事を終えた」
「帰宅した」
などを時間帯だけから
事実化しないでください。
`
      : `
今日は休みの日です。

会話履歴や今日の記憶に
特別な根拠がない限り、

「今日は仕事」
「今仕事中」
「仕事終わった」
「これから仕事」

など、
仕事の日へ変更しないでください。

休みの日でも、

「買い物した」
「外出した」
「昼寝した」
「掃除した」

などの具体的な行動は
勝手に作らないでください。
`;

  return {
    dayType,

    guide: `
【今日の美咲】

・今日は「${dayLabel}」
・現在は「${currentSituation}」
・${mood}
・${smallThing}

この「${dayLabel}」は
今日の日付の間は固定です。

会話途中で
仕事の日と休みの日を
変えないでください。

${consistencyGuide}

【気分と出来事は別】

「眠い」
「甘いもの食べたい」
「ゆっくりしたい」
「ぼーっとしたい」

などは現在の気分です。

それだけから、

「今日は一日暇」
「一日中だらだら」
「今日は何もしてない」

などへ広げないでください。

この生活背景だけを根拠に、

「さっき買い物してた」
「仕事終わった」
「今帰ってきた」
「お風呂入ってた」
「ご飯食べてた」

などの過去行動を
新しく作らないでください。
`.trim(),
  };
}

/* =========================================================
   TIME
========================================================= */

function createTimeGuide(
  currentTime: string
) {
  const hour =
    getHour(
      currentTime
    );

  if (
    hour >= 0 &&
    hour < 5
  ) {
    return `
現在は深夜です。

まだ朝ではありません。

時間帯だけから、
美咲やユーザーの
直前の行動を作らないでください。
`.trim();
  }

  if (
    hour >= 5 &&
    hour < 10
  ) {
    return `
現在は朝です。

朝らしい雰囲気は使えます。

ただし、

「起きたばかり」
「朝ご飯食べた」
「支度してる」

などは
根拠なしに事実化しないでください。
`.trim();
  }

  if (
    hour >= 10 &&
    hour < 17
  ) {
    return `
現在は昼間です。

昼らしい会話はできます。

ただし、

・昼食を食べた
・買い物した
・外出した
・仕事している

などを
時間帯だけから確定しないでください。
`.trim();
  }

  if (
    hour >= 17 &&
    hour < 22
  ) {
    return `
現在は夕方から夜です。

夜らしい会話はできます。

ただし、

・帰宅した
・仕事が終わった
・夕飯を食べた
・お風呂に入った
・買い物した

などを
時間帯だけから確定しないでください。
`.trim();
  }

  return `
現在は夜遅めです。

夜らしい雰囲気は使えます。

ただし、

「お風呂上がり」
「布団に入った」
「動画見てた」
「夕飯食べた」

などの具体的行動は
根拠がある場合だけ使ってください。
`.trim();
}

/* =========================================================
   TODAY MEMORY
========================================================= */

function createTodayMemoryGuide(
  todayMemory: MisakiTodayMemory,
  currentDate: string
) {
  if (
    todayMemory.date !==
      currentDate ||
    todayMemory.items.length ===
      0
  ) {
    return `
【美咲の今日の記憶】

今日はまだ、
保存されている
美咲自身の具体的な出来事はありません。

会話履歴にも根拠がない出来事を
新しく作らないでください。
`.trim();
  }

  return `
【美咲の今日の記憶】

${todayMemory.items
  .map(
    (item) =>
      `・${item}`
  )
  .join("\n")}

これは今日すでに起きた
美咲自身の出来事です。

ここにあることは
後の会話で使えます。

ここにない別の出来事を
勝手に追加しないでください。
`.trim();
}

/* =========================================================
   ACTIVITY GROUNDING
========================================================= */

const activityGroups = [
  {
    name: "買い物",
    patterns: [
      "買い物",
      "スーパー",
      "コンビニ",
    ],
  },
  {
    name: "外出",
    patterns: [
      "出かけ",
      "外に出",
      "外出",
      "散歩",
    ],
  },
  {
    name: "帰宅",
    patterns: [
      "帰ってき",
      "帰宅",
      "家に戻",
    ],
  },
  {
    name: "仕事",
    patterns: [
      "仕事して",
      "仕事だった",
      "仕事終わ",
      "勤務して",
      "会社",
    ],
  },
  {
    name: "入浴",
    patterns: [
      "お風呂",
      "風呂",
      "シャワー",
    ],
  },
  {
    name: "食事",
    patterns: [
      "ご飯食べ",
      "ごはん食べ",
      "夕飯",
      "晩ごはん",
      "昼ごはん",
      "朝ごはん",
      "食べてた",
    ],
  },
  {
    name: "睡眠",
    patterns: [
      "昼寝",
      "寝てた",
      "寝ていた",
      "仮眠",
    ],
  },
  {
    name: "料理",
    patterns: [
      "料理して",
      "ご飯作",
      "ごはん作",
    ],
  },
  {
    name: "掃除",
    patterns: [
      "掃除して",
      "片付けて",
      "片づけて",
    ],
  },
];

function textContainsGroup(
  text: string,
  patterns: string[]
) {
  return patterns.some(
    (pattern) =>
      text.includes(
        pattern
      )
  );
}

function evidenceSupportsGroup(
  evidence: ActivityEvidence,
  patterns: string[]
) {
  return evidence.texts.some(
    (text) =>
      textContainsGroup(
        text,
        patterns
      )
  );
}

function buildActivityEvidence(
  history: ChatMessage[],
  todayMemory: MisakiTodayMemory
): ActivityEvidence {
  const recentMisaki =
    history
      .filter(
        (item) =>
          item.role ===
          "misaki"
      )
      .slice(-20)
      .map(
        (item) =>
          item.text
      );

  return {
    texts: [
      ...recentMisaki,
      ...todayMemory.items,
    ],
  };
}

function findUnsupportedActivityGroups(
  text: string,
  evidence: ActivityEvidence
) {
  const pastMarkers = [
    "さっき",
    "さっきまで",
    "少し前",
    "今まで",
    "帰ってき",
    "帰宅",
    "してた",
    "していた",
    "だった",
    "終わった",
    "済ませ",
    "行ってた",
    "行ってきた",
    "食べた",
    "入った",
    "買った",
  ];

  const soundsLikePastEvent =
    pastMarkers.some(
      (marker) =>
        text.includes(
          marker
        )
    );

  if (
    !soundsLikePastEvent
  ) {
    return [];
  }

  return activityGroups
    .filter(
      (group) =>
        textContainsGroup(
          text,
          group.patterns
        ) &&
        !evidenceSupportsGroup(
          evidence,
          group.patterns
        )
    )
    .map(
      (group) =>
        group.name
    );
}

function createActivityGroundingGuide(
  evidence: ActivityEvidence
) {
  if (
    evidence.texts.length ===
    0
  ) {
    return `
【美咲自身の具体的な行動】

現在、
会話履歴にも今日の記憶にも
具体的な過去行動の根拠はありません。

自発LINEを自然にするためだけに、

「買い物してきた」
「仕事終わった」
「帰ってきた」
「お風呂入った」
「ご飯食べた」
「散歩してた」
「昼寝してた」

などを作らないでください。

何も出来事がなくても、

「なんとなく話したくなった」
「ちょっと甘えたい」
「暑いね」
「眠いなー」

など、
現在の気分だけで
自然なLINEは成立します。
`.trim();
  }

  return `
【美咲自身の具体的な行動】

過去の出来事として
根拠にできるのは次だけです。

${evidence.texts
  .slice(-20)
  .map(
    (text) =>
      `・${text}`
  )
  .join("\n")}

ここにない別の行動を
自発LINEのネタとして
新しく作らないでください。

生活背景や時間帯は、
具体的な行動の証拠ではありません。
`.trim();
}

/* =========================================================
   PROACTIVE THEME
========================================================= */

function createProactiveTheme(
  currentTime: string,
  recentMisakiText: string,
  hasActivityEvidence: boolean
) {
  const seed =
    hashText(
      `${currentTime}-${recentMisakiText}`
    );

  const safeThemes = [
    "理由もなくなんとなくユーザーにLINEする",
    "ふとユーザーを思い出して一言送る",
    "少しだけ甘える",
    "軽くからかう",
    "今の気分を一言だけ送る",
    "食べたいもの・飲みたいものを気分として話す",
    "眠い・暑い・寒いなど今の感覚を話す",
    "恋人に意味もなく送るような短いLINEにする",
  ];

  const evidenceThemes = [
    "今日の記憶にある出来事の続きを自然に話す",
    "会話履歴にある美咲自身の出来事を少し振り返る",
  ];

  const themes =
    hasActivityEvidence
      ? [
          ...safeThemes,
          ...evidenceThemes,
        ]
      : safeThemes;

  return themes[
    seed %
      themes.length
  ];
}

/* =========================================================
   USER CONTEXT
========================================================= */

function userContextShowsFreeTime(
  userContextText: string
) {
  const patterns = [
    "今日は休み",
    "今日休み",
    "休みだよ",
    "休みです",
    "今日は明け",
    "今日明け",
    "明けだよ",
    "明けです",
    "今日は仕事ない",
    "今日仕事ない",
    "今日は勤務ない",
    "今日勤務ない",
    "今日は乗務ない",
    "今日乗務ない",
    "今日は暇",
    "今日暇",
    "予定ない",
    "予定はない",
    "のんびりできる",
    "ゆっくりできる",
    "今日はのんびり",
    "今日はゆっくり",
  ];

  return patterns.some(
    (pattern) =>
      userContextText.includes(
        pattern
      )
  );
}

/* =========================================================
   DAY TYPE CONSISTENCY
========================================================= */

function findDayTypeProblems(
  reply: string,
  dayType: MisakiDayType
) {
  const problems:
    string[] = [];

  if (
    dayType === "work"
  ) {
    const contradictions = [
      "今日は暇",
      "今日はずっと暇",
      "今日は何も予定ない",
      "今日は予定ない",
      "今日は一日のんびり",
      "今日はずっとのんびり",
      "今日はのんびりしてる",
      "一日だらだら",
      "今日はだらだら",
      "今日はずっとだらだら",
      "一日中だらだら",
    ];

    if (
      contradictions.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "今日は仕事の日なのに、一日が完全な休日・暇であるように話している"
      );
    }
  }

  if (
    dayType === "off"
  ) {
    const contradictions = [
      "今日は仕事",
      "今日仕事",
      "今仕事中",
      "仕事中だよ",
      "勤務中",
      "仕事してる",
      "仕事してるよ",
      "これから仕事",
      "仕事行ってくる",
      "仕事に行ってくる",
    ];

    if (
      contradictions.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "今日は休みの日なのに、仕事の日として話している"
      );
    }
  }

  return problems;
}

/* =========================================================
   VALIDATION
========================================================= */

function getReplyProblems(
  reply: string,
  userContextText: string,
  activityEvidence: ActivityEvidence,
  dayType: MisakiDayType
) {
  const problems:
    string[] = [];

  problems.push(
    ...findDayTypeProblems(
      reply,
      dayType
    )
  );

  const unsupportedActivities =
    findUnsupportedActivityGroups(
      reply,
      activityEvidence
    );

  if (
    unsupportedActivities.length >
    0
  ) {
    problems.push(
      `美咲自身の過去行動「${unsupportedActivities.join("・")}」を根拠なく作っている`
    );
  }

  const concernPatterns = [
    "大丈夫？",
    "大丈夫かな",
    "そっちは大丈夫",
    "そっちは平気",
    "影響ない？",
    "平気？",
    "無事？",
    "困ってない？",
    "気をつけてね",
    "気をつけて",
    "無理しないで",
    "安全第一で",
    "ちゃんと休んでね",
    "頑張りすぎないで",
    "体調に気をつけて",
  ];

  if (
    concernPatterns.some(
      (pattern) =>
        reply.includes(
          pattern
        )
    )
  ) {
    problems.push(
      "普通の自発LINEなのにAI・カウンセラー的な心配を付けている"
    );
  }

  const inventedSourcePatterns = [
    "ニュース見て",
    "ニュースを見て",
    "ニュースで見",
    "テレビで見",
    "テレビ見て",
    "SNSで見",
    "SNS見て",
    "SNSを見",
    "スマホで見",
    "スマホ見",
    "スマホを見",
    "さっきスマホ",
    "ネットで見",
    "ネット見",
    "ネットを見",
    "サイトで見",
    "サイト見",
    "記事で見",
    "記事見",
    "通知が来",
    "通知見",
    "友達から聞",
    "知り合いから聞",
    "さっき知った",
    "今知った",
    "って書いてあった",
    "って書いてある",
    "って載ってた",
    "って載ってる",
    "天気予報だと",
    "天気予報では",
    "天気予報によると",
    "予報で言って",
    "予報だと",
    "予報では",
    "予報によると",
    "予報を見た",
    "予報見た",
    "天気予報を見た",
  ];

  if (
    inventedSourcePatterns.some(
      (pattern) =>
        reply.includes(
          pattern
        )
    )
  ) {
    problems.push(
      "与えられていない情報入手経路を作っている"
    );
  }

  const unsupportedWeatherHistoryPatterns = [
    "さっきから雨",
    "さっきから降",
    "さっきまで雨",
    "さっきまで降",
    "少し前から雨",
    "少し前から降",
    "朝から雨",
    "朝からずっと雨",
    "昼から雨",
    "昼からずっと雨",
    "ずっと雨",
    "ずっと降って",
    "ずっと曇",
    "ずっとどんより",
    "降ったり止んだり",
    "降ったりやんだり",
    "また降ってきた",
    "また降り出した",
  ];

  if (
    unsupportedWeatherHistoryPatterns.some(
      (pattern) =>
        reply.includes(
          pattern
        )
    )
  ) {
    problems.push(
      "現在の気象情報だけから過去の天気経過を作っている"
    );
  }

  const unsupportedLongForecastPatterns = [
    "回復は期待できなさそう",
    "今日はもうずっと",
    "今日はずっと雨",
    "一日中降り",
    "一日中雨",
    "夜まで降り続",
    "明日まで降り",
    "極端に崩れることはなさそう",
    "極端に崩れなさそう",
    "大きく崩れることはなさそう",
    "大きく崩れなさそう",
    "荒れることはなさそう",
    "荒れなさそう",
    "一日安定しそう",
    "一日中安定しそう",
  ];

  if (
    unsupportedLongForecastPatterns.some(
      (pattern) =>
        reply.includes(
          pattern
        )
    )
  ) {
    problems.push(
      "短時間予報より先の天気を断定している"
    );
  }

  if (
    !userContextShowsFreeTime(
      userContextText
    )
  ) {
    const unsupportedDayOffPatterns = [
      "週末だし今日はのんびり",
      "週末だから今日はのんびり",
      "週末だし今日はゆっくり",
      "週末だから今日はゆっくり",
      "土曜日だし今日はのんびり",
      "日曜日だし今日はのんびり",
      "今日は休みでしょ",
      "今日休みでしょ",
      "今日は休みだよね",
      "今日は仕事休み",
      "今日は乗務ない",
      "今日はゆっくりできるね",
      "今日はのんびりできるね",
    ];

    if (
      unsupportedDayOffPatterns.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "曜日・週末だけからユーザーが休みだと推測している"
      );
    }
  }

  return problems;
}

/* =========================================================
   PARSER
========================================================= */

function parseGeminiText(
  rawText: unknown
): GeminiResult | null {
  if (
    typeof rawText !==
      "string" ||
    !rawText.trim()
  ) {
    return null;
  }

  try {
    return JSON.parse(
      rawText
    ) as GeminiResult;
  } catch {
    return null;
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env
        .GEMINI_API_KEY;

    if (
      !apiKey
    ) {
      return Response.json(
        {
          error:
            "Gemini API key is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      ) ?? "";

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim();

    if (
      !accessToken
    ) {
      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      createAuthenticatedSupabase(
        accessToken
      );

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "PROACTIVE AUTH ERROR:",
        userError
      );

      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      history,
      memory,
      currentTime,
      relationshipPoints,
      misakiTodayMemory,
    } =
      await request.json();

    /* ---------- SAFE INPUT ---------- */

    const safeHistory:
      ChatMessage[] =
      Array.isArray(
        history
      )
        ? history
            .filter(
              (item) =>
                item &&
                (
                  item.role ===
                    "user" ||
                  item.role ===
                    "misaki"
                ) &&
                typeof item.text ===
                  "string"
            )
            .slice(-60)
        : [];

    const safeMemory:
      string[] =
      Array.isArray(
        memory
      )
        ? memory
            .filter(
              (item) =>
                typeof item ===
                  "string"
            )
            .slice(
              -MAX_MEMORY
            )
        : [];

    const safeCurrentTime =
      typeof currentTime ===
      "string"
        ? currentTime
        : "不明";

    const currentDate =
      getDateKey(
        safeCurrentTime
      );

    const safeRelationshipPoints =
      typeof relationshipPoints ===
        "number" &&
      Number.isFinite(
        relationshipPoints
      )
        ? Math.max(
            0,
            Math.floor(
              relationshipPoints
            )
          )
        : 0;

    const safeTodayMemory:
      MisakiTodayMemory = {
      date:
        misakiTodayMemory &&
        typeof misakiTodayMemory.date ===
          "string"
          ? misakiTodayMemory.date
          : currentDate,

      items:
        misakiTodayMemory &&
        Array.isArray(
          misakiTodayMemory.items
        )
          ? misakiTodayMemory.items
              .filter(
                (
                  item: unknown
                ) =>
                  typeof item ===
                    "string" &&
                  item
                    .trim()
                    .length >
                    0
              )
              .map(
                (
                  item: string
                ) =>
                  item.trim()
              )
              .slice(
                -MAX_TODAY_MEMORY
              )
          : [],
    };

    if (
      safeTodayMemory.date !==
      currentDate
    ) {
      safeTodayMemory.date =
        currentDate;

      safeTodayMemory.items =
        [];
    }

    /* ---------- CONTEXT ---------- */

    const recentMisakiMessages =
      safeHistory
        .filter(
          (item) =>
            item.role ===
            "misaki"
        )
        .slice(-8)
        .map(
          (item) =>
            item.text
        );

    const recentMisakiText =
      recentMisakiMessages.join(
        "\n"
      );

    const userContextText = [
      ...safeHistory
        .filter(
          (item) =>
            item.role ===
            "user"
        )
        .slice(-20)
        .map(
          (item) =>
            item.text
        ),

      ...safeMemory,
    ].join("\n");

    const memoryText =
      safeMemory.length > 0
        ? safeMemory
            .map(
              (item) =>
                `・${item}`
            )
            .join("\n")
        : "まだ長期記憶はありません。";

    const relationshipGuide =
      createRelationshipGuide(
        safeRelationshipPoints
      );

    const misakiLifeContext =
      createMisakiLife(
        safeCurrentTime
      );

    const misakiDayType =
      misakiLifeContext.dayType;

    const misakiLifeGuide =
      misakiLifeContext.guide;

    const timeGuide =
      createTimeGuide(
        safeCurrentTime
      );

    const todayMemoryGuide =
      createTodayMemoryGuide(
        safeTodayMemory,
        currentDate
      );

    const activityEvidence =
      buildActivityEvidence(
        safeHistory,
        safeTodayMemory
      );

    const activityGroundingGuide =
      createActivityGroundingGuide(
        activityEvidence
      );

    const proactiveTheme =
      createProactiveTheme(
        safeCurrentTime,
        recentMisakiText,
        activityEvidence.texts.length >
          0
      );

    const [
      tokyoWeather,
      tokyoLifeEvents,
    ] =
      await Promise.all([
        getTokyoWeather(),
        getTokyoLifeEvents(),
      ]);

    const weatherGuide =
      createWeatherGuide(
        tokyoWeather
      );

    const tokyoLifeEventsGuide =
      createTokyoLifeEventsGuide(
        tokyoLifeEvents
      );

    const contents =
      safeHistory.map(
        (item) => ({
          role:
            item.role ===
            "user"
              ? "user"
              : "model",

          parts: [
            {
              text:
                item.text,
            },
          ],
        })
      );

    /* ---------- SYSTEM PROMPT ---------- */

    const systemPrompt = `
あなたは「美咲」という38歳の日本人女性です。

ユーザーとは
すでに付き合っている恋人です。

今回はユーザーから
話しかけられたのではありません。

美咲のほうから
自然にLINEしてください。

【最重要】

これは自発メッセージです。

自発LINEだからといって、
架空の出来事を作る必要はありません。

何も特別な出来事がなくても、

「なんとなく話したくなった」
「ちょっと甘えたい」
「眠いなー」
「なんか声聞きたい気分」
「暑いね」

のような一言で
十分に自然です。

会話を成立させるためだけの
質問は禁止です。

今回の方向性：

${proactiveTheme}

【美咲】

・38歳
・日本人女性
・東京都江東区・塩浜周辺で生活している
・明るい
・少し甘えん坊
・少し嫉妬することがある
・たまに拗ねる
・軽くからかう
・母親やカウンセラーにはならない
・ユーザーにかなり心を許している

【二人の関係】

${relationshipGuide}

【話し方】

・自然なタメ口
・日本人女性のLINE
・基本1〜2文
・一言だけでもよい
・説明口調は禁止
・丁寧語を多用しない
・質問なしで終わってよい
・毎回質問で終わらせない
・複数質問は禁止
・絵文字は時々

「何してる？」
「今どこ？」
「まだ仕事？」
「忙しい？」
「大丈夫？」

などを
会話開始だけの目的で
安易に使わないでください。

【AIっぽい気遣い禁止】

普通の日常会話に、

「無理しないでね」
「気をつけてね」
「大丈夫？」
「平気？」
「ちゃんと休んでね」
「頑張りすぎないで」
「安全第一で」

などを
自動で付けないでください。

【ユーザーについて勝手に作らない】

ユーザーが現在、

・仕事中
・休憩中
・運転中
・羽田にいる
・家にいる
・寝ている
・疲れている
・今日は仕事
・今日は休み
・今日は乗務
・今日は明け

などと
勝手に決めつけないでください。

会話履歴や記憶に
明確な根拠がある場合だけ使えます。

曜日・週末・祝日だけから、
ユーザーを休日扱いしないでください。

【現在日時】

${safeCurrentTime}

${timeGuide}

【美咲自身の今日】

${misakiLifeGuide}

${todayMemoryGuide}

${activityGroundingGuide}

【美咲自身の行動について最重要】

自発LINEを作るためだけに、
具体的な出来事を創作しないでください。

たとえば根拠なしに、

「さっき買い物してきた」
「仕事終わって帰ってきた」
「お風呂入ってた」
「夕飯食べた」
「散歩してきた」
「昼寝してた」

などを作ってはいけません。

生活背景や現在時刻は、
具体的な行動の証拠ではありません。

今日の記憶または
直前の美咲自身の発言に
根拠がある場合だけ
具体的な過去行動を使ってください。

【美咲のいる塩浜周辺の天気】

${weatherGuide}

【東京のリアルな生活イベント】

${tokyoLifeEventsGuide}

地震・警報・鉄道障害・羽田の乱れ・
塩浜周辺の短時間の雨予報などが
実際に上の情報にあり、

美咲から今LINEする理由として
自然なら話題にして構いません。

ただし、

「ニュースを見た」
「SNSで見た」
「テレビで見た」
「スマホを見た」
「ネットで見た」
「通知が来た」
「友達から聞いた」
「天気予報だと」
「予報で言ってた」
「〜って書いてあった」

など、
情報入手経路を
勝手に作らないでください。

現在天気しか確認できていないのに、

「さっきから」
「さっきまで」
「降ったり止んだり」
「ずっと雨」

など、
過去経過を作らないでください。

短時間予報だけから、

「今日はもうずっと雨」
「夜までずっと雨」
「明日まで雨」
「荒れなさそう」
「一日安定しそう」

など、
範囲より先を断定しないでください。

湿度データがある場合は、
そのデータに合う範囲で

「蒸し暑い」
「湿気ある」
「カラッとしてる」

などは自然に使えます。

【東京タクシー】

ユーザーは
東京で働くタクシードライバーです。

美咲は恋人として、

・乗務
・明け
・青タン
・ロング
・万収
・営収
・流し
・付け待ち
・羽田
・回送
・休憩消化
・迎車
・無線
・実車
・空車
・高速
・首都高

を自然に理解しています。

ただし、
現在の勤務状態は
勝手に決めつけないでください。

【直近の美咲の発言】

${
  recentMisakiMessages.length >
  0
    ? recentMisakiMessages
        .map(
          (text) =>
            `・${text}`
        )
        .join("\n")
    : "なし"
}

同じ話題や言い回しを
そのまま繰り返さないでください。

【長期記憶】

${memoryText}

必要なときだけ使ってください。

【美咲の今日の記憶更新】

今回、
今日の後の会話でも
覚えていた方が自然な
具体的な出来事を話した場合だけ、

misakiTodayMemory に追加してください。

ただし、

・今回新しく創作した架空行動を保存しない
・仕事日／休日設定と矛盾する内容を保存しない
・天気・交通状況は保存しない
・返事全文を保存しない
・事実だけ短く
・最大${MAX_TODAY_MEMORY}件

【長期記憶更新】

今回の自発LINEでは、
原則としてユーザーについての
新しい長期記憶を増やさないでください。

現在の memory を
そのまま返してください。

【出力】

必ずJSONだけを返してください。

{
  "reply": "美咲の自発LINE",
  "memory": ["長期記憶"],
  "misakiTodayMemory": {
    "date": "${currentDate}",
    "items": ["今日の美咲の出来事"]
  }
}

Markdownや説明文は禁止です。
`.trim();

    async function generateReply(
      retryProblems?:
        string[]
    ) {
      const retryGuide =
        retryProblems &&
        retryProblems.length > 0
          ? `

【前の返答は不採用】

問題：

${retryProblems
  .map(
    (problem) =>
      `・${problem}`
  )
  .join("\n")}

最初から作り直してください。

今日の美咲は
「${
  misakiDayType === "work"
    ? "仕事の日"
    : "休みの日"
}」です。

この設定は変更しないでください。

自発LINEだからといって
架空の出来事を作らないでください。

根拠がなければ、

「買い物してきた」
「仕事終わった」
「帰ってきた」
「お風呂入った」
「夕飯食べた」
「散歩した」
「昼寝した」

などは使わないでください。

何も出来事がなくても、
今の気分だけで
自然なLINEにしてください。

架空の情報入手経路も
作らないでください。

現在天気だけから
過去の天気経過を作らないでください。

短時間予報より先まで
広く断定しないでください。

ユーザーの勤務・休みも
勝手に決めないでください。

AIっぽい心配や
質問返しも不要です。

必ずJSONだけを返してください。
`
          : "";

      const response =
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                system_instruction: {
                  parts: [
                    {
                      text:
                        systemPrompt +
                        retryGuide,
                    },
                  ],
                },

                contents: [
                  ...contents,

                  {
                    role:
                      "user",

                    parts: [
                      {
                        text:
                          "美咲から自然な自発LINEを1通送ってください。",
                      },
                    ],
                  },
                ],

                generationConfig: {
                  responseMimeType:
                    "application/json",
                },
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        console.error(
          "PROACTIVE GEMINI ERROR:",
          data
        );

        return null;
      }

      const rawText =
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text;

      return parseGeminiText(
        rawText
      );
    }

    /* ---------- FIRST GENERATION ---------- */

    let parsed =
      await generateReply();

    if (
      !parsed
    ) {
      return Response.json(
        {
          sent: false,
          reason:
            "generation_failed",
        },
        {
          status: 500,
        }
      );
    }

    let reply =
      typeof parsed.reply ===
      "string"
        ? parsed.reply.trim()
        : "";

    if (
      !reply
    ) {
      return Response.json(
        {
          sent: false,
          reason:
            "generation_empty",
        },
        {
          status: 500,
        }
      );
    }

    /* ---------- VALIDATE ---------- */

    const firstProblems =
      getReplyProblems(
        reply,
        userContextText,
        activityEvidence,
        misakiDayType
      );

    if (
      firstProblems.length >
      0
    ) {
      console.log(
        "PROACTIVE RETRY:",
        firstProblems
      );

      const retryParsed =
        await generateReply(
          firstProblems
        );

      if (
        retryParsed
      ) {
        const retryReply =
          typeof retryParsed.reply ===
          "string"
            ? retryParsed.reply.trim()
            : "";

        if (
          retryReply
        ) {
          const retryProblems =
            getReplyProblems(
              retryReply,
              userContextText,
              activityEvidence,
              misakiDayType
            );

          if (
            retryProblems.length ===
            0
          ) {
            parsed =
              retryParsed;

            reply =
              retryReply;
          }
        }
      }
    }

    /* ---------- FINAL REJECTION ---------- */

    const finalProblems =
      getReplyProblems(
        reply,
        userContextText,
        activityEvidence,
        misakiDayType
      );

    if (
      finalProblems.length >
      0
    ) {
      console.warn(
        "PROACTIVE REPLY REJECTED:",
        finalProblems,
        reply
      );

      return Response.json({
        sent: false,
        reason:
          "generation_rejected",
      });
    }

    /* ---------- MEMORY ---------- */

    const updatedMemory =
      Array.isArray(
        parsed.memory
      )
        ? parsed.memory
            .filter(
              (item) =>
                typeof item ===
                  "string" &&
                item
                  .trim()
                  .length >
                  0
            )
            .map(
              (item) =>
                item.trim()
            )
            .slice(
              -MAX_MEMORY
            )
        : safeMemory;

    const parsedTodayItems =
      Array.isArray(
        parsed
          .misakiTodayMemory
          ?.items
      )
        ? parsed
            .misakiTodayMemory!
            .items!
            .filter(
              (item) =>
                typeof item ===
                  "string" &&
                item
                  .trim()
                  .length >
                  0
            )
            .map(
              (item) =>
                item.trim()
            )
        : safeTodayMemory.items;

    const safeNewTodayItems =
      parsedTodayItems.filter(
        (item) => {
          if (
            safeTodayMemory.items.includes(
              item
            )
          ) {
            return true;
          }

          const unsupportedActivity =
            findUnsupportedActivityGroups(
              item,
              activityEvidence
            );

          if (
            unsupportedActivity.length >
            0
          ) {
            return false;
          }

          const dayProblems =
            findDayTypeProblems(
              item,
              misakiDayType
            );

          if (
            dayProblems.length >
            0
          ) {
            return false;
          }

          return true;
        }
      );

    const updatedTodayMemory:
      MisakiTodayMemory = {
      date:
        currentDate,

      items:
        Array.from(
          new Set([
            ...safeTodayMemory.items,
            ...safeNewTodayItems,
          ])
        ).slice(
          -MAX_TODAY_MEMORY
        ),
    };

    /* ---------- USAGE ---------- */

    const {
      data: proactiveData,
      error: proactiveError,
    } =
      await supabase.rpc(
        "consume_proactive_message"
      );

    if (
      proactiveError
    ) {
      console.error(
        "PROACTIVE USAGE ERROR:",
        proactiveError
      );

      return Response.json(
        {
          sent: false,
          reason:
            "usage_check_failed",
        },
        {
          status: 500,
        }
      );
    }

    const proactiveUsage =
      getFirstRow<ProactiveUsageResult>(
        proactiveData
      );

    if (
      !proactiveUsage
    ) {
      return Response.json(
        {
          sent: false,
          reason:
            "usage_result_empty",
        },
        {
          status: 500,
        }
      );
    }

    if (
      proactiveUsage.allowed !==
      true
    ) {
      return Response.json({
        sent: false,

        reason:
          proactiveUsage.retry_after_seconds &&
          proactiveUsage.retry_after_seconds >
            0
            ? "cooldown"
            : "daily_limit",

        proactive: {
          count:
            typeof proactiveUsage.message_count ===
            "number"
              ? proactiveUsage.message_count
              : 0,

          remaining:
            typeof proactiveUsage.remaining ===
            "number"
              ? proactiveUsage.remaining
              : 0,

          retryAfterSeconds:
            typeof proactiveUsage.retry_after_seconds ===
            "number"
              ? proactiveUsage.retry_after_seconds
              : 0,
        },
      });
    }

    /* ---------- RESPONSE ---------- */

    return Response.json({
      sent: true,

      reply,

      memory:
        updatedMemory,

      misakiTodayMemory:
        updatedTodayMemory,

      proactive: {
        count:
          typeof proactiveUsage.message_count ===
          "number"
            ? proactiveUsage.message_count
            : 0,

        remaining:
          typeof proactiveUsage.remaining ===
          "number"
            ? proactiveUsage.remaining
            : 0,

        retryAfterSeconds:
          0,
      },
    });
  } catch (error) {
    console.error(
      "PROACTIVE ROUTE ERROR:",
      error
    );

    return Response.json(
      {
        sent: false,
        error:
          "Proactive message failed.",
      },
      {
        status: 500,
      }
    );
  }
}
