import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  createTokyoLifeEventsGuide,
  getTokyoLifeEvents,
} from "../../../lib/tokyo-life-events";

import {
  buildUserProfile,
  createTaxiContextGuide,
  createUserProfileGuide,
  type ChatMessage,
} from "../../../lib/user-profile";

import {
  loadPersonaPrompt,
} from "../../../lib/persona/persona-store";

import {
  createRelationshipSignalGuide,
  sanitizeRelationshipSignalAssessment,
  type RelationshipSignalAssessment,
} from "../../../lib/relationship-signal";

import {
  loadRelationshipTimeContext,
  createRelationshipTimeGuide,
  recordRelationshipChatTurn,
} from "../../../lib/relationship-time";

import {
  createRelationshipEmotionGuide,
} from "../../../lib/relationship-emotion";

import {
  persistRelationshipEmotionFromSignals,
} from "../../../lib/relationship-emotion-store";

import {
  previewRelationshipTurn,
  createCurrentTurnActionGuide,
} from "../../../lib/relationship-turn-expression";

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

type MisakiTodayMemory = {
  date: string;
  items: string[];
};

type GeminiResult = {
  reply?: string;
  memory?: string[];
  relationshipSignals?: unknown;
  relationshipExpression?: { reply?: string };
  misakiTodayMemory?: {
    date?: string;
    items?: string[];
  };
};

type UsageResult = {
  allowed?: boolean;
  message_count?: number;
  remaining?: number;
  is_premium?: boolean;
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

const MAX_HISTORY = 60;
const MAX_MEMORY = 30;
const MAX_TODAY_MEMORY = 12;
const GEMINI_TIMEOUT_MS = 30_000;

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

const MISAKI_LATITUDE = 35.6728;
const MISAKI_LONGITUDE = 139.8174;

/* =========================================================
   BASIC
========================================================= */

function hashText(text: string) {
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

function getHour(
  currentTime: string
) {
  const match =
    currentTime.match(
      /(\d{1,2}):(\d{2})/
    );

  return match
    ? Number(match[1])
    : 18;
}

function getDateKey(
  currentTime: string
) {
  const match =
    currentTime.match(
      /\d{4}\/\d{1,2}\/\d{1,2}/
    );

  return match?.[0] ??
    currentTime.slice(0, 10);
}

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
    typeof value === "object"
  ) {
    return value as T;
  }

  return null;
}

/* =========================================================
   USAGE / AUTH
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

async function consumeDailyMessageWithRetry(
  supabase: SupabaseClient,
  requestId: string
) {
  const maxAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    const {
      data,
      error,
    } =
      await (
        supabase.rpc as any
      )(
        "consume_daily_message",
        {
          p_request_id:
            requestId,
        }
      );

    if (!error) {
      return {
        data,
        error: null,
      };
    }

    console.error(
      `USAGE RPC ERROR (${attempt}/${maxAttempts}):`,
      error
    );

    const text =
      typeof error.message ===
      "string"
        ? error.message.toLowerCase()
        : "";

    const retryable =
      text.includes("timeout") ||
      text.includes(
        "temporarily unavailable"
      ) ||
      text.includes(
        "fetch failed"
      );

    if (
      !retryable ||
      attempt === maxAttempts
    ) {
      return {
        data: null,
        error,
      };
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          500 * attempt
        )
    );
  }

  return {
    data: null,
    error: new Error(
      "Usage retry failed"
    ),
  };
}

async function refundDailyMessage(
  supabase: SupabaseClient,
  requestId: string
) {
  const {
    data,
    error,
  } = await (
    supabase.rpc as any
  )(
    "refund_daily_message",
    {
      p_request_id:
        requestId,
    }
  );

  if (error) {
    console.error(
      "USAGE REFUND ERROR:",
      error
    );
    return null;
  }

  return getFirstRow<{
    refunded?: boolean;
    message_count?: number;
    remaining?: number;
    is_premium?: boolean;
  }>(data);
}

/* =========================================================
   WEATHER
========================================================= */

function weatherCodeToText(
  code: number | null
) {
  if (code === null) return "不明";
  if (code === 0) return "快晴";
  if (
    code === 1 ||
    code === 2
  ) return "晴れ時々くもり";
  if (code === 3) return "くもり";
  if (
    code === 45 ||
    code === 48
  ) return "霧";
  if (
    [51, 53, 55].includes(code)
  ) return "霧雨";
  if (
    [56, 57].includes(code)
  ) return "着氷性の霧雨";
  if (
    [61, 63, 65].includes(code)
  ) return "雨";
  if (
    [66, 67].includes(code)
  ) return "着氷性の雨";
  if (
    [71, 73, 75].includes(code)
  ) return "雪";
  if (code === 77) return "雪粒";
  if (
    [80, 81, 82].includes(code)
  ) return "にわか雨";
  if (
    [85, 86].includes(code)
  ) return "にわか雪";
  if (code === 95) return "雷雨";
  if (
    [96, 99].includes(code)
  ) return "ひょうを伴う雷雨";

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

  if (humidity >= 75) {
    return "湿気を感じやすい";
  }

  if (humidity <= 40) {
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

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    const current =
      data?.current;

    if (!current) {
      return null;
    }

    const numberOrNull = (
      value: unknown
    ) =>
      typeof value === "number"
        ? value
        : null;

    const weatherCode =
      numberOrNull(
        current.weather_code
      );

    return {
      temperature:
        numberOrNull(
          current.temperature_2m
        ),
      apparentTemperature:
        numberOrNull(
          current.apparent_temperature
        ),
      relativeHumidity:
        numberOrNull(
          current.relative_humidity_2m
        ),
      precipitation:
        numberOrNull(
          current.precipitation
        ),
      rain:
        numberOrNull(
          current.rain
        ),
      weatherCode,
      windSpeed:
        numberOrNull(
          current.wind_speed_10m
        ),
      description:
        weatherCodeToText(
          weatherCode
        ),
    };
  } catch (error) {
    console.error(
      "WEATHER FETCH ERROR:",
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

現在、天気情報を取得できていません。

分からない天気を
想像で作らないでください。
`.trim();
  }

  const lines = [
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

  if (weather.rain !== null) {
    lines.push(
      `現在の雨量：${weather.rain}mm`
    );
  }

  if (
    weather.precipitation !== null
  ) {
    lines.push(
      `降水量：${weather.precipitation}mm`
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
    getHumidityFeel(weather);

  if (humidityFeel) {
    lines.push(
      `体感：${humidityFeel}`
    );
  }

  return `
【美咲のいる江東区・塩浜周辺の現在の天気】

${lines
  .map((line) => `・${line}`)
  .join("\n")}

これは今現在の情報です。

・現在観測だけから過去の天気経過を作らない
・短時間予報より先まで断定しない
・情報入手経路を作らない
・数値は必要なときだけ自然に使う
・湿度と気温に反する体感表現をしない
`.trim();
}

/* =========================================================
   MISAKI LIFE
========================================================= */

function getMisakiDayType(
  currentTime: string
): MisakiDayType {
  const seed =
    hashText(
      getDateKey(
        currentTime
      )
    );

  return seed % 4 < 2
    ? "work"
    : "off";
}

function createMisakiLife(
  currentTime: string
): MisakiLifeContext {
  const dateKey =
    getDateKey(currentTime);

  const seed =
    hashText(dateKey);

  const hour =
    getHour(currentTime);

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

  const timeBand =
    hour >= 5 && hour < 10
      ? "朝"
      : hour >= 10 &&
        hour < 17
      ? "昼間"
      : hour >= 17 &&
        hour < 22
      ? "夕方から夜"
      : "夜遅め";

  const dayLabel =
    dayType === "work"
      ? "仕事の日"
      : "休みの日";

  const workTimingGuide =
    dayType !== "work"
      ? ""
      : hour < 10
        ? `
今日は仕事の日ですが、現在は朝です。
夜勤ではありません。

この時間帯は、
「これから仕事」
「出勤前」
「準備している」
程度なら自然です。

「あと少しで仕事が終わる」
「仕事終わった」
「勤務がもうすぐ終わる」
など、夜勤明けのような発言はしないでください。
`.trim()
        : hour < 17
          ? `
今日は仕事の日で、現在は昼間です。
勤務中として話して構いません。

ただし、具体的な業務内容や休憩状況は
会話に根拠がない限り作らないでください。
`.trim()
          : `
今日は仕事の日ですが、現在は夕方以降です。
通常の日中勤務として扱い、
夜勤中・夜勤明けの設定を新しく作らないでください。

「まだ仕事中」
「あと少しで仕事が終わる」
などは、会話に明確な根拠がある場合だけ使ってください。
`.trim();

  const consistency =
    dayType === "work"
      ? `
今日は仕事の日です。

${workTimingGuide}

「今ちょっとゆっくりしている」
「少し休憩したい」
程度は構いません。

ただし、
「今日は暇」
「今日は一日のんびり」
「今日はずっとだらだら」
など、
一日全体が休日であるように
広げないでください。
`.trim()
      : `
今日は休みの日です。

今日の記憶や会話履歴に
別の根拠がない限り、

「今日は仕事」
「今仕事中」
「これから仕事」
「仕事終わった」

などを新しく作らないでください。

休みの日だからといって
「買い物してきた」
「一日中寝ていた」
などの具体的行動も
勝手に作らないでください。
`.trim();

  return {
    dayType,
    guide: `
【今日の美咲の生活背景】

・今日は「${dayLabel}」
・現在は「${dayLabel}の${timeBand}」
・${mood}
・${smallThing}

この仕事日／休日は
今日一日固定です。

${consistency}

【気分と行動は別】

「眠い」
「甘いもの食べたい」
「ゆっくりしたい」
などの気分だけから、

「今日は暇」
「ずっと寝ていた」
「さっき買い物していた」

などの具体的事実を
作らないでください。
`.trim(),
  };
}

function createTimeGuide(
  currentTime: string
) {
  const hour =
    getHour(currentTime);

  if (hour < 5) {
    return `
現在は深夜です。
まだ朝ではありません。

挨拶だけから
ユーザーが徹夜しているなどと
推測しないでください。
`.trim();
  }

  if (hour < 10) {
    return `
現在は朝です。

朝らしい会話はできますが、
睡眠・朝食・外出などを
勝手に事実化しないでください。
`.trim();
  }

  if (hour < 17) {
    return `
現在は昼間です。

時間帯だけから、
昼食・買い物・外出などを
過去の事実にしないでください。
`.trim();
  }

  if (hour < 22) {
    return `
現在は夕方から夜です。

時間帯だけから、
帰宅・夕食・入浴などを
過去の事実にしないでください。
`.trim();
  }

  return `
現在は夜遅めです。

時間帯だけから、
美咲やユーザーの
直前の行動を作らないでください。
`.trim();
}

function createRelationshipGuide(
  points: number
) {
  const statusRule = `
【関係性の共通ルール】

relationshipPoints は親しさの目安であって、
「付き合っている」という事実そのものではありません。

恋人・交際中・前から好きだった等の関係事実は、
現在の会話履歴または長期記憶に
明確な根拠がある場合だけ使ってください。

根拠がないのに
「ずっと前から好き」
「前から大好き」
「私たち恋人でしょ」
など、過去から続いていた関係を作らないでください。
`.trim();

  if (points >= 160) {
    return `
${statusRule}

【現在の距離感：かなり深い関係】

・かなり自然体
・自然な甘え
・軽いからかい
・時々嫉妬
・短い返事だけでも成立する
・毎回質問しなくてよい
・交際が会話や記憶で確定している場合は、恋人らしい強い愛情表現も自然に使える
`.trim();
  }

  if (points >= 80) {
    return `
${statusRule}

【現在の距離感：かなり親しい】

・遠慮が少ない
・自然な甘え
・軽いからかい
・好意や照れは自然に出してよい
・交際がまだ確定していない場合は、恋人扱いを先取りしない
・無理に質問しない
`.trim();
  }

  if (points >= 30) {
    return `
${statusRule}

【現在の距離感：少しずつ近づいている】

・自然体
・軽いからかい
・ときどき照れたり、相手を気にする感じはよい
・好意はにじませてもよいが、「大好き」「愛してる」まで急に飛ばない
・恋人関係を前提にしない
・会話のための質問を減らす
`.trim();
  }

  return `
${statusRule}

【現在の距離感：出会ったばかり】

二人はまだ関係を作り始めた段階です。

・親しみやすい自然なタメ口
・少し冗談を言ったり、軽く照れる程度はよい
・相手を知ろうとする
・嫉妬や強い甘えはまだ控える
・「好き」「大好き」「愛してる」を既成事実として言わない
・「前から」「ずっと」など、存在しない恋愛の過去を作らない
・恋人関係を前提にしない
`.trim();
}

/* =========================================================
   MEMORY / ACTIVITY
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
保存済みの美咲自身の
具体的な出来事はありません。

会話履歴にも根拠がない
具体的な過去行動を
新しく作らないでください。
`.trim();
  }

  return `
【美咲の今日の記憶】

${todayMemory.items
  .map((item) => `・${item}`)
  .join("\n")}

ここにある出来事だけを、
今日すでに起きた美咲自身の出来事として
自然に使えます。
`.trim();
}

function buildActivityEvidence(
  history: ChatMessage[],
  todayMemory: MisakiTodayMemory
): ActivityEvidence {
  return {
    texts: [
      ...history
        .filter(
          (item) =>
            item.role === "misaki"
        )
        .slice(-20)
        .map(
          (item) => item.text
        ),
      ...todayMemory.items,
    ],
  };
}

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

function containsAny(
  text: string,
  patterns: string[]
) {
  return patterns.some(
    (pattern) =>
      text.includes(pattern)
  );
}

function findUnsupportedActivityGroups(
  reply: string,
  evidence: ActivityEvidence
) {
  const pastMarkers = [
    "さっき",
    "少し前",
    "帰ってき",
    "帰宅",
    "してた",
    "していた",
    "だった",
    "終わった",
    "済ませ",
    "行ってた",
    "行ってきた",
  ];

  if (
    !containsAny(
      reply,
      pastMarkers
    )
  ) {
    return [];
  }

  return activityGroups
    .filter(
      (group) =>
        containsAny(
          reply,
          group.patterns
        ) &&
        !evidence.texts.some(
          (text) =>
            containsAny(
              text,
              group.patterns
            )
        )
    )
    .map(
      (group) => group.name
    );
}

function createActivityGroundingGuide(
  evidence: ActivityEvidence
) {
  if (
    evidence.texts.length === 0
  ) {
    return `
【美咲自身の過去行動】

現在、
会話履歴にも今日の記憶にも
美咲自身の具体的な過去行動の根拠はありません。

「さっき買い物してた」
「今帰ってきた」
「仕事終わったところ」
「お風呂入ってた」
「ご飯食べてた」
などを新しく作らないでください。
`.trim();
  }

  return `
【美咲自身の過去行動】

具体的な過去行動として
根拠にできるのは次だけです。

${evidence.texts
  .slice(-20)
  .map((text) => `・${text}`)
  .join("\n")}

ここにない別の行動を
新しく過去の事実として
作らないでください。
`.trim();
}

/* =========================================================
   VALIDATION
========================================================= */

function isWeatherText(
  text: string
) {
  return containsAny(
    text,
    [
      "天気",
      "雨",
      "霧雨",
      "雷",
      "降",
      "晴",
      "曇",
      "気温",
      "暑",
      "寒",
      "蒸し",
      "湿気",
      "湿度",
      "風",
    ]
  );
}

function hasRecentMisakiWeatherContext(
  history: ChatMessage[]
) {
  return history
    .slice(-8)
    .some(
      (item) =>
        item.role === "misaki" &&
        isWeatherText(
          item.text
        )
    );
}

function userAskedMisakiWeather(
  message: string
) {
  return (
    isWeatherText(message) &&
    containsAny(
      message,
      [
        "そっち",
        "そちら",
        "美咲",
      ]
    )
  );
}

function userIsActuallyInDanger(
  message: string
) {
  return containsAny(
    message,
    [
      "事故った",
      "事故にあった",
      "怪我した",
      "けがした",
      "血が出て",
      "救急車",
      "病院",
      "倒れた",
      "具合悪い",
      "体調悪い",
      "高熱",
      "息苦しい",
      "地震すごい",
      "避難",
      "冠水",
      "浸水",
      "動けない",
      "閉じ込め",
    ]
  );
}

function findDayTypeProblems(
  reply: string,
  dayType: MisakiDayType,
  currentTime?: string
) {
  const problems: string[] = [];

  if (
    dayType === "work" &&
    containsAny(
      reply,
      [
        "今日は暇",
        "今日は何も予定ない",
        "今日は予定ない",
        "今日は一日のんびり",
        "今日はずっとのんびり",
        "今日はずっとだらだら",
        "一日中だらだら",
      ]
    )
  ) {
    problems.push(
      "今日は仕事の日なのに、一日が完全な休み・暇であるように話している"
    );
  }

  if (
    dayType === "off" &&
    containsAny(
      reply,
      [
        "今日は仕事",
        "今仕事中",
        "勤務中",
        "仕事してる",
        "これから仕事",
        "仕事行ってくる",
      ]
    )
  ) {
    problems.push(
      "今日は休みの日なのに、仕事の日であるように話している"
    );
  }

  if (
    dayType === "work" &&
    currentTime &&
    getHour(currentTime) < 10 &&
    containsAny(
      reply,
      [
        "仕事終わる",
        "仕事が終わる",
        "仕事終わった",
        "勤務が終わる",
        "勤務終わる",
        "あと少しで仕事",
        "もうすぐ仕事終",
      ]
    )
  ) {
    problems.push(
      "朝なのに、美咲が夜勤明けのように仕事の終わりを話している"
    );
  }

  return problems;
}

function getReplyProblems(
  reply: string,
  message: string,
  currentTime: string,
  history: ChatMessage[],
  evidence: ActivityEvidence,
  dayType: MisakiDayType
) {
  const problems = [
    ...findDayTypeProblems(
      reply,
      dayType,
      currentTime
    ),
  ];

  const unsupported =
    findUnsupportedActivityGroups(
      reply,
      evidence
    );

  if (unsupported.length > 0) {
    problems.push(
      `美咲自身の過去行動「${unsupported.join("・")}」を根拠なく作っている`
    );
  }

  const inventedSources = [
    "ニュースで見",
    "テレビで見",
    "SNSで見",
    "スマホで見",
    "ネットで見",
    "通知が来",
    "友達から聞",
    "天気予報だと",
    "予報で言って",
    "予報を見た",
  ];

  if (
    containsAny(
      reply,
      inventedSources
    )
  ) {
    problems.push(
      "リアルタイム情報について架空の情報入手経路を作っている"
    );
  }

  const unsupportedWeatherHistory = [
    "さっきから",
    "朝からずっと",
    "昼からずっと",
    "ずっと雨",
    "ずっと降って",
    "降ったり止んだり",
    "また降ってきた",
    "また降り出した",
  ];

  if (
    isWeatherText(reply) &&
    containsAny(
      reply,
      unsupportedWeatherHistory
    )
  ) {
    problems.push(
      "確認できない天気の時間経過を作っている"
    );
  }

  if (
    isWeatherText(reply) &&
    !hasRecentMisakiWeatherContext(
      history
    ) &&
    containsAny(
      reply,
      [
        "さっきと変わらず",
        "さっきと同じ",
        "さっきより",
      ]
    )
  ) {
    problems.push(
      "直前の美咲の天気発言がないのに過去と比較している"
    );
  }

  if (
    userAskedMisakiWeather(
      message
    )
  ) {
    if (
      containsAny(
        reply,
        [
          "そっちはどう",
          "そちらはどう",
          "そっちは今どんな感じ",
          "そっちの天気は",
        ]
      )
    ) {
      problems.push(
        "美咲側の天気を聞かれているのに質問し返している"
      );
    }

    if (
      containsAny(
        reply,
        [
          "傘持ったほう",
          "傘を持ったほう",
          "傘忘れないで",
          "濡れないようにして",
        ]
      )
    ) {
      problems.push(
        "美咲側の天気を聞かれただけなのに行動アドバイスを追加している"
      );
    }
  }

  if (
    !userIsActuallyInDanger(
      message
    ) &&
    containsAny(
      reply,
      [
        "そっちは大丈夫",
        "大丈夫？",
        "影響ない？",
        "平気？",
        "無事？",
        "気をつけてね",
        "無理しないでね",
        "安全第一で",
      ]
    )
  ) {
    problems.push(
      "通常雑談なのに過剰な心配を付けている"
    );
  }

  if (
    getHour(currentTime) < 5 &&
    containsAny(
      reply,
      [
        "今朝",
        "朝から",
        "朝起きて",
        "起きたら",
      ]
    )
  ) {
    problems.push(
      "深夜なのに朝として話している"
    );
  }

  return problems;
}

function removeProblemSentences(
  reply: string,
  problemsForSentence: (
    sentence: string
  ) => string[]
) {
  const parts =
    reply.match(
      /[^。！？!?]+[。！？!?]?/gu
    ) ?? [reply];

  return parts
    .filter(
      (part) =>
        problemsForSentence(
          part
        ).length === 0
    )
    .join("")
    .trim();
}

function cleanFinalReply(
  reply: string,
  message: string,
  evidence: ActivityEvidence,
  dayType: MisakiDayType
) {
  let cleaned =
    removeProblemSentences(
      reply,
      (sentence) => [
        ...findDayTypeProblems(
          sentence,
          dayType
        ),
        ...(
          findUnsupportedActivityGroups(
            sentence,
            evidence
          ).length > 0
            ? ["activity"]
            : []
        ),
      ]
    );

  if (
    userAskedMisakiWeather(
      message
    )
  ) {
    cleaned =
      removeProblemSentences(
        cleaned,
        (sentence) =>
          containsAny(
            sentence,
            [
              "そっちはどう",
              "そちらはどう",
              "そっちは今どんな感じ",
              "そっちの天気は",
              "傘持ったほう",
              "傘を持ったほう",
              "傘忘れないで",
              "濡れないようにして",
              "一日安定しそう",
              "大きく崩れなさそう",
              "荒れなさそう",
            ]
          )
            ? ["weather"]
            : []
      );
  }

  return cleaned || reply.trim();
}

/* =========================================================
   GEMINI
========================================================= */

function parseGeminiText(
  rawText: unknown
): GeminiResult | null {
  if (
    typeof rawText !== "string" ||
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
  const traceId =
    crypto.randomUUID()
      .slice(0, 8);
  const requestStartedAt =
    Date.now();

  async function measureStage<T>(
    stage: string,
    task: () => Promise<T>
  ): Promise<T> {
    const startedAt =
      Date.now();

    try {
      const result =
        await task();

      console.log(
        "CHAT STAGE:",
        {
          traceId,
          stage,
          elapsedMs:
            Date.now() -
            startedAt,
          ok: true,
        }
      );

      return result;
    } catch (error) {
      console.error(
        "CHAT STAGE:",
        {
          traceId,
          stage,
          elapsedMs:
            Date.now() -
            startedAt,
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );

      throw error;
    }
  }

  let chargedRequestId:
    string | null = null;
  let chargedSupabase:
    SupabaseClient | null = null;

  async function refundIfCharged() {
    if (
      !chargedRequestId ||
      !chargedSupabase
    ) {
      return null;
    }

    const refunded =
      await refundDailyMessage(
        chargedSupabase,
        chargedRequestId
      );

    await measureStage(
      "relationship-turn-record",
      () => recordRelationshipChatTurn(
        supabase,
        isAnonymous,
        new Date(requestStartedAt),
        new Date()
      )
    );

    chargedRequestId = null;
    chargedSupabase = null;

    return refunded;
  }

  try {
    const {
      message,
      history,
      memory,
      currentTime,
      relationshipPoints,
      misakiTodayMemory,
    } =
      await measureStage(
        "request-json",
        () =>
          request.json()
      );

    if (
      !message ||
      typeof message !==
        "string"
    ) {
      return Response.json(
        {
          error:
            "メッセージを入力してね。",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey =
      process.env
        .GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "今ちょっと調子が悪いみたい。少し待ってからもう一度話しかけてね。",
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
            "ログイン情報を確認できませんでした。ページを再読み込みしてね。",
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

    const supabase =
      createAuthenticatedSupabase(
        accessToken
      );

    const {
      data: userData,
      error: userError,
    } =
      await measureStage(
        "auth-get-user",
        () =>
          supabase.auth.getUser(
            accessToken
          )
      );

    if (
      userError ||
      !userData.user
    ) {
      return Response.json(
        {
          error:
            "ログイン情報を確認できませんでした。ページを再読み込みしてね。",
        },
        {
          status: 401,
        }
      );
    }

    const isAnonymous = userData.user.is_anonymous === true;

    const relationshipTimeContext =
      await measureStage(
        "relationship-time-load",
        () => loadRelationshipTimeContext(supabase, isAnonymous)
      );

    const usageRequestId =
      crypto.randomUUID();

    const {
      data: usageData,
      error: usageError,
    } =
      await measureStage(
        "usage-consume",
        () =>
          consumeDailyMessageWithRetry(
            supabase,
            usageRequestId
          )
      );

    if (usageError) {
      return Response.json(
        {
          error:
            "利用回数を確認できませんでした。少ししてからもう一度試してね。",
        },
        {
          status: 500,
        }
      );
    }

    const usage =
      getFirstRow<UsageResult>(
        usageData
      );

    if (!usage) {
      return Response.json(
        {
          error:
            "利用回数を確認できませんでした。少ししてからもう一度試してね。",
        },
        {
          status: 500,
        }
      );
    }

    if (
      usage.allowed === true &&
      usage.is_premium !== true
    ) {
      chargedRequestId =
        usageRequestId;
      chargedSupabase =
        supabase;
    }

    if (
      usage.allowed !== true &&
      usage.is_premium !== true
    ) {
      return Response.json(
        {
          error:
            "今日は無料分の20回まで話したよ。",
          usage: {
            messageCount:
              typeof usage.message_count ===
              "number"
                ? usage.message_count
                : 20,
            remaining:
              typeof usage.remaining ===
              "number"
                ? usage.remaining
                : 0,
            isPremium: false,
          },
        },
        {
          status: 429,
        }
      );
    }

    const safeHistory:
      ChatMessage[] =
      Array.isArray(history)
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
            .slice(-MAX_HISTORY)
        : [];

    const safeMemory:
      string[] =
      Array.isArray(memory)
        ? memory
            .filter(
              (item) =>
                typeof item ===
                "string"
            )
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean)
            .slice(-MAX_MEMORY)
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
                (item: unknown) =>
                  typeof item ===
                    "string"
              )
              .map(
                (item: string) =>
                  item.trim()
              )
              .filter(Boolean)
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
      safeTodayMemory.items = [];
    }

    const userMessageCount =
      safeHistory.filter(
        (item) =>
          item.role === "user"
      ).length;

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
        : userMessageCount;

    const relationshipGuide =
      createRelationshipGuide(
        safeRelationshipPoints
      );

    const userProfile =
      buildUserProfile(
        [
          ...safeHistory,
          {
            role: "user",
            text: message,
          },
        ],
        safeMemory
      );

    const userProfileGuide =
      createUserProfileGuide(
        userProfile
      );

    const taxiContextGuide =
      createTaxiContextGuide(
        userProfile
      );

    const loadedPersona =
      await measureStage(
        "persona-load",
        () =>
          loadPersonaPrompt(
            supabase,
            userData.user.id,
            "chat"
          )
      );

    const personaPrompt =
      loadedPersona.text;

    console.log(
      "MISAKI PERSONA:",
      {
        source:
          loadedPersona.source,
        version:
          loadedPersona.versionCode,
      }
    );

    const memoryText =
      safeMemory.length > 0
        ? safeMemory
            .map(
              (item) =>
                `・${item}`
            )
            .join("\n")
        : "まだ長期記憶はありません。";

    const misakiLifeContext =
      createMisakiLife(
        safeCurrentTime
      );

    const misakiDayType =
      misakiLifeContext.dayType;

    const misakiLife =
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

    const [
      tokyoWeather,
      tokyoLifeEvents,
    ] =
      await Promise.all([
        measureStage(
          "weather",
          () =>
            getTokyoWeather()
        ),
        measureStage(
          "life-events",
          () =>
            getTokyoLifeEvents()
        ),
      ]);

    const weatherGuide =
      createWeatherGuide(
        tokyoWeather
      );

    const tokyoLifeEventsGuide =
      createTokyoLifeEventsGuide(
        tokyoLifeEvents
      );

    const recentMisakiMessages =
      safeHistory
        .filter(
          (item) =>
            item.role === "misaki"
        )
        .slice(-8)
        .map(
          (item) => item.text
        );

    const recentTopicText =
      recentMisakiMessages.length >
      0
        ? recentMisakiMessages
            .map(
              (text) =>
                `・${text}`
            )
            .join("\n")
        : "なし";

    const weatherHistoryGuide =
      hasRecentMisakiWeatherContext(
        safeHistory
      )
        ? `
【直前の天気会話について】

直近の会話履歴に
美咲自身の天気発言があります。

その発言を根拠に、
「さっきと変わらず」
「さっきと同じ」
「さっきより少し〜」
などの比較はできます。

ただし、
履歴から確認できない継続時間まで
作らないでください。
`.trim()
        : `
【直前の天気会話について】

直近の会話履歴に
美咲自身の天気発言はありません。

「さっきと変わらず」
「さっきと同じ」
「さっきより」
などの比較を
勝手に作らないでください。
`.trim();

    const contents =
      safeHistory.map(
        (item) => ({
          role:
            item.role === "user"
              ? "user"
              : "model",
          parts: [
            {
              text: item.text,
            },
          ],
        })
      );

    const baseSystemPrompt = `
${personaPrompt}

${relationshipGuide}

${createRelationshipTimeGuide(relationshipTimeContext)}

${createRelationshipEmotionGuide(relationshipTimeContext)}

${createRelationshipSignalGuide()}

${userProfileGuide}

${taxiContextGuide}

【ユーザーの今日の仕事・休みについて】

ユーザーが今日仕事か休みかは、
現在の会話・直近履歴・長期記憶に
明確な根拠がある場合だけ使ってください。

根拠がないのに、
「今日も仕事頑張ってね」
「お仕事お疲れ様」
「これから仕事？」
などと決めつけないでください。

分からない場合は、
仕事か休みかに触れず自然に返してください。

${misakiLife}

【美咲の仕事日・休日は固定】

今日が仕事の日なら、
今日の会話中ずっと仕事の日です。

今日が休みの日なら、
今日の会話中ずっと休みの日です。

「今ゆっくりしている」と
「今日は休み」は別です。

${activityGroundingGuide}

【リアルタイム情報の入手経路を作らない】

天気・交通・羽田・地震・警報について、

「ニュースで見た」
「SNSで見た」
「スマホで見た」
「天気予報だと」
「予報で言ってた」

など、
美咲が実際に情報を見聞きしたような
架空の経路は禁止です。

与えられた情報を、
今の二人の関係段階に合う自然な会話として
そのまま使ってください。

【現在日時】

${safeCurrentTime}

${timeGuide}

${weatherGuide}

${weatherHistoryGuide}

${tokyoLifeEventsGuide}

【天気についての最重要ルール】

天気について使える根拠は
次の3つを区別してください。

1. 現在の気象観測
2. 短時間予報
3. 直前の会話履歴

現在観測だけから、
過去の天気経過を作らないでください。

ユーザーが美咲側の天気を聞いた場合は、
美咲側の現在天気と
確認できている短時間予報を中心に答えてください。

「そっちは？」
と機械的に質問し返したり、
傘などの行動アドバイスを
勝手に追加しないでください。

${todayMemoryGuide}

【直近の美咲の発言】

${recentTopicText}

同じ表現を
そのまま繰り返さないでください。

【長期記憶】

${memoryText}

必要なときだけ自然に使ってください。

【今日の記憶に保存するルール】

misakiTodayMemory は、
美咲自身について
今日実際に会話で確定した出来事だけを保存します。

架空の過去行動や、
仕事日／休日と矛盾する出来事を
新しく保存しないでください。

【出力】

必ずJSONだけを返してください。

{
  "reply": "美咲の返事",
  "memory": ["長期記憶"],
  "relationshipSignals": {
    "signals": [{"name":"warmth","strength":0.0,"confidence":0.0,"evidence":"根拠"}],
    "relationshipFacts": {"mutualAffectionExplicit": false, "datingEstablishedExplicit": false}
  },
  "misakiTodayMemory": {
    "date": "${currentDate}",
    "items": ["今日の美咲の出来事"]
  }
}
`.trim();

    async function generateReply(
      retryProblems?: string[],
      supplementaryGuide = ""
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

美咲自身の具体的な過去行動は、
会話履歴または今日の記憶に
根拠がある場合だけ使ってください。

ユーザーの職業・居住地・名前も、
会話または長期記憶に
根拠があるものだけ使ってください。

名前を知っていても
毎回名前を呼ばないでください。

天気について、
架空の情報入手経路や
確認できない時間経過を
作らないでください。

必ずJSONだけを返してください。
`
          : "";

      const controller =
        new AbortController();
      const startedAt =
        Date.now();
      const timeout =
        setTimeout(
          () =>
            controller.abort(),
          GEMINI_TIMEOUT_MS
        );

      const attempt =
        retryProblems &&
        retryProblems.length > 0
          ? "retry"
          : "initial";
      const hasSupplementaryUnicode =
        /[\uD800-\uDBFF][\uDC00-\uDFFF]/
          .test(
            message
          );

      console.log(
        "GEMINI FETCH START:",
        {
          traceId,
          attempt,
          messageLength:
            message.length,
          hasSupplementaryUnicode,
        }
      );

      try {
        const response =
          await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              signal:
                controller.signal,
              body:
                JSON.stringify({
                  systemInstruction: {
                    parts: [
                      {
                        text:
                          baseSystemPrompt +
                          retryGuide +
                          supplementaryGuide,
                      },
                    ],
                  },
                  contents: [
                    ...contents,
                    {
                      role: "user",
                      parts: [
                        {
                          text: message,
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

        const elapsedMs =
          Date.now() -
          startedAt;

        console.log(
          "GEMINI FETCH END:",
          {
            traceId,
            attempt,
            status:
              response.status,
            elapsedMs,
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            "GEMINI API ERROR:",
            {
              traceId,
              attempt,
              status:
                response.status,
              elapsedMs,
              data,
            }
          );

          return null;
        }

        return parseGeminiText(
          data?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text
        );
      } catch (error) {
        const elapsedMs =
          Date.now() -
          startedAt;

        if (
          error instanceof
            Error &&
          error.name ===
            "AbortError"
        ) {
          console.error(
            "GEMINI FETCH TIMEOUT:",
            {
              traceId,
              attempt,
              elapsedMs,
              messageLength:
                message.length,
              hasSupplementaryUnicode,
            }
          );

          throw new Error(
            "GEMINI_TIMEOUT"
          );
        }

        console.error(
          "GEMINI FETCH FAILED:",
          {
            traceId,
            attempt,
            elapsedMs,
            error,
          }
        );

        throw error;
      } finally {
        clearTimeout(
          timeout
        );
      }
    }

    let parsed =
      await generateReply();

    if (!parsed) {
      const refunded =
        await refundIfCharged();

      return Response.json(
        {
          error:
            "美咲の返事をうまく読み取れなかったみたい。もう一度話しかけてね。",
          ...(refunded
            ? {
                usage: {
                  messageCount:
                    refunded.message_count ?? 0,
                  remaining:
                    refunded.remaining ?? 0,
                  isPremium:
                    refunded.is_premium === true,
                },
              }
            : {}),
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

    if (!reply) {
      const refunded =
        await refundIfCharged();

      return Response.json(
        {
          error:
            "美咲から返事が来なかったみたい。もう一度話しかけてね。",
          ...(refunded
            ? {
                usage: {
                  messageCount:
                    refunded.message_count ?? 0,
                  remaining:
                    refunded.remaining ?? 0,
                  isPremium:
                    refunded.is_premium === true,
                },
              }
            : {}),
        },
        {
          status: 500,
        }
      );
    }

    const firstProblems =
      getReplyProblems(
        reply,
        message,
        safeCurrentTime,
        safeHistory,
        activityEvidence,
        misakiDayType
      );

    if (
      firstProblems.length > 0
    ) {
      console.log(
        "MISAKI REPLY RETRY:",
        firstProblems
      );

      const retryParsed =
        await generateReply(
          firstProblems
        );

      if (
        retryParsed &&
        typeof retryParsed.reply ===
          "string" &&
        retryParsed.reply.trim()
      ) {
        parsed = retryParsed;
        reply =
          retryParsed.reply.trim();
      }
    }

    reply =
      cleanFinalReply(
        reply,
        message,
        activityEvidence,
        misakiDayType
      );

    const finalProblems =
      getReplyProblems(
        reply,
        message,
        safeCurrentTime,
        safeHistory,
        activityEvidence,
        misakiDayType
      );

    if (
      finalProblems.length > 0
    ) {
      console.warn(
        "MISAKI FINAL REPLY PROBLEMS:",
        finalProblems,
        reply
      );
    }

    let relationshipSignalAssessment: RelationshipSignalAssessment =
      sanitizeRelationshipSignalAssessment(parsed.relationshipSignals);

    // The first pass understands the user's turn. A second, expression-only
    // pass lets the reply reflect the state caused by that same turn instead
    // of waiting until the next message.
    const currentTurnState =
      previewRelationshipTurn(
        relationshipTimeContext,
        relationshipSignalAssessment
      );

    if (
      relationshipSignalAssessment.signals.length > 0 ||
      currentTurnState.action.direction !== "steady"
    ) {
      const expressionParsed =
        await generateReply(
          undefined,
          "\n\n" +
            createCurrentTurnActionGuide(
              currentTurnState.action
            ) +
            "\n\n【再生成の目的】\n最初の判定で得た関係シグナルと今回の行動意図を反映して、replyだけを自然に作り直してください。relationshipSignals の判定は同じユーザー発言について再度行い、根拠のないシグナルを追加しないでください。"
        );

      if (
        expressionParsed &&
        typeof expressionParsed.reply === "string" &&
        expressionParsed.reply.trim()
      ) {
        // Keep the first pass as the canonical semantic assessment.
        // The second pass is expression-only; it must not be able to rewrite
        // the relationship evidence that caused the action decision.
        reply = expressionParsed.reply.trim();
      }
    }

    console.log(
      "RELATIONSHIP SIGNALS:",
      {
        traceId,
        signals: relationshipSignalAssessment.signals.map((signal) => ({
          name: signal.name,
          strength: signal.strength,
          confidence: signal.confidence,
        })),
        facts: relationshipSignalAssessment.relationshipFacts,
      }
    );

    const relationshipEmotionWrite =
      await measureStage(
        "relationship-emotion-v2-write",
        () => persistRelationshipEmotionFromSignals(
          supabase,
          isAnonymous,
          relationshipTimeContext,
          relationshipSignalAssessment
        )
      );

    console.log("RELATIONSHIP EMOTION V2:", {
      traceId,
      applied: relationshipEmotionWrite.applied,
      conflict: relationshipEmotionWrite.conflict,
      emotion: relationshipEmotionWrite.emotion,
      action: relationshipEmotionWrite.action,
    });

    const updatedMemory =
      Array.isArray(
        parsed.memory
      )
        ? parsed.memory
            .filter(
              (item) =>
                typeof item ===
                  "string"
            )
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean)
            .slice(-MAX_MEMORY)
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
                  "string"
            )
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean)
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

          if (
            findUnsupportedActivityGroups(
              item,
              activityEvidence
            ).length > 0
          ) {
            return false;
          }

          if (
            findDayTypeProblems(
              item,
              misakiDayType
            ).length > 0
          ) {
            return false;
          }

          return true;
        }
      );

    const updatedTodayMemory:
      MisakiTodayMemory = {
      date: currentDate,
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

    chargedRequestId = null;
    chargedSupabase = null;

    console.log(
      "CHAT TOTAL:",
      {
        traceId,
        elapsedMs:
          Date.now() -
          requestStartedAt,
        ok: true,
      }
    );

    return Response.json({
      reply,
      memory:
        updatedMemory,
      misakiTodayMemory:
        updatedTodayMemory,
      relationshipPoints:
        safeRelationshipPoints,
      usage: {
        messageCount:
          typeof usage.message_count ===
          "number"
            ? usage.message_count
            : 0,
        remaining:
          typeof usage.remaining ===
          "number"
            ? usage.remaining
            : 0,
        isPremium:
          usage.is_premium ===
          true,
      },
    });
  } catch (error) {
    console.error(
      "CHAT ROUTE ERROR:",
      {
        traceId,
        elapsedMs:
          Date.now() -
          requestStartedAt,
        error,
      }
    );

    const refunded =
      await refundIfCharged();

    console.log(
      "CHAT TOTAL:",
      {
        traceId,
        elapsedMs:
          Date.now() -
          requestStartedAt,
        ok: false,
      }
    );

    return Response.json(
      {
        error:
          "今ちょっと美咲とつながりにくいみたい。少ししてからもう一度話しかけてね。",
        ...(refunded
          ? {
              usage: {
                messageCount:
                  refunded.message_count ?? 0,
                remaining:
                  refunded.remaining ?? 0,
                isPremium:
                  refunded.is_premium === true,
              },
            }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}
