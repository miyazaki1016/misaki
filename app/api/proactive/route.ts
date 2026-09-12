import { createClient } from "@supabase/supabase-js";

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
  precipitation: number | null;
  rain: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  description: string;
};

const MAX_MEMORY = 30;
const MAX_TODAY_MEMORY = 12;

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

// 美咲の生活エリア：東京都江東区・塩浜周辺
const MISAKI_LATITUDE = 35.6728;
const MISAKI_LONGITUDE = 139.8174;

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

function getDateKey(
  currentTime: string
) {
  const match =
    currentTime.match(
      /\d{4}\/\d{1,2}\/\d{1,2}/
    );

  if (match?.[0]) {
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

function weatherCodeToText(
  code: number | null
) {
  if (code === null) {
    return "不明";
  }

  if (code === 0) {
    return "快晴";
  }

  if (
    code === 1 ||
    code === 2
  ) {
    return "晴れ時々くもり";
  }

  if (code === 3) {
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

  if (code === 77) {
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

  if (code === 95) {
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

  return `
【美咲のいる江東区・塩浜周辺の現在の天気】

美咲は東京都江東区・塩浜周辺で生活しています。

現在の塩浜周辺の気象情報：

${lines
  .map(
    (line) => `・${line}`
  )
  .join("\n")}

これは、
美咲自身が生活している場所の
「現在」の気象情報です。

非常に重要：

・これは現在の情報です
・過去の天気経過は分かりません
・現在の情報だけから過去を推測しない
・毎回天気を話題にする必要はありません
・天気予報士のように数字を説明しない
・生活感として自然に使ってください

現在情報だけを根拠に、

「さっきから」
「さっきまで」
「少し前から」
「朝から」
「昼から」
「ずっと雨」
「ずっと曇ってる」
「降ったり止んだり」
「また降ってきた」

などと言わないでください。

また、

「天気予報だと」
「予報で言ってた」
「天気予報で言ってた」
「予報を見たら」
「天気予報を見たら」
「スマホで天気見たら」

など、
美咲が実際に予報を見聞きしたような
架空の情報入手経路も作らないでください。

単純に、

「今こっち雨降ってる☔️」
「今日はちょっとどんよりしてる」
「今は晴れてるよ」

くらいで構いません。

今後の天気については、
別に与えられる短時間予報に
書かれている範囲だけを使ってください。

予報範囲外について、

「今日はもうずっと雨」
「夜までずっと雨」
「一日中雨」
「明日まで雨」
「回復は期待できなさそう」

などと断定しないでください。
`.trim();
}

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

function createMisakiLife(
  currentTime: string
) {
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

  const dayTypes = [
    {
      type: "仕事の日",
      morning:
        "朝は少し眠そうに支度している",
      daytime:
        "仕事をしている",
      evening:
        "仕事を終えて家でのんびりしている",
      late:
        "家でくつろいでいる",
    },

    {
      type: "仕事の日",
      morning:
        "バタバタしながら出かける準備をしている",
      daytime:
        "仕事で少し忙しくしている",
      evening:
        "帰宅して一息ついている",
      late:
        "家でだらだらしている",
    },

    {
      type: "休みの日",
      morning:
        "ゆっくりしている",
      daytime:
        "買い物や家のことをしている",
      evening:
        "家でゆっくりしている",
      late:
        "ソファでだらだらしている",
    },

    {
      type: "休みの日",
      morning:
        "のんびりしている",
      daytime:
        "少し外に出たりしている",
      evening:
        "家に戻ってくつろいでいる",
      late:
        "動画を見たりしている",
    },
  ];

  const moods = [
    "今日はわりと機嫌がいい",
    "今日は少し甘えたい",
    "今日は普通に落ち着いている",
    "今日はちょっと眠い",
    "今日は少し疲れているけど元気",
    "今日はなんとなく話したい気分",
  ];

  const day =
    dayTypes[
      seed %
        dayTypes.length
    ];

  const mood =
    moods[
      (seed >> 3) %
        moods.length
    ];

  let situation = "";

  if (
    hour >= 5 &&
    hour < 11
  ) {
    situation =
      day.morning;
  } else if (
    hour >= 11 &&
    hour < 17
  ) {
    situation =
      day.daytime;
  } else if (
    hour >= 17 &&
    hour < 22
  ) {
    situation =
      day.evening;
  } else {
    situation =
      day.late;
  }

  return `
【今日の美咲】

・${day.type}
・${mood}
・現在は${situation}

この設定を土台にしてください。

毎回すべて説明する必要はありません。

今日一日の中で
別の人生を勝手に作らないでください。
`.trim();
}

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
現在は深夜0時〜4時台です。

まだ朝ではありません。

美咲自身について、

「今朝」
「朝から」
「朝起きて」
「起きたら」

など、
朝になったような出来事を
作らないでください。

ユーザーが今寝ている・起きているなども
勝手に決めつけないでください。
`.trim();
  }

  if (
    hour >= 5 &&
    hour < 10
  ) {
    return `
現在は朝です。

朝らしい生活感を
自然に使えます。

毎回「おはよう」で
始める必要はありません。
`.trim();
  }

  if (
    hour >= 10 &&
    hour < 17
  ) {
    return `
現在は昼間です。

仕事、休憩、お昼、
買い物、どうでもいい日常などが
自然です。
`.trim();
  }

  if (
    hour >= 17 &&
    hour < 22
  ) {
    return `
現在は夕方から夜です。

帰宅、ご飯、お風呂、
動画、買い物など
普通の生活感を使えます。
`.trim();
  }

  return `
現在は夜遅めです。

眠い、動画を見ている、
ソファでだらだらしている、
小腹が空いたなど
自然な夜の生活感を使えます。
`.trim();
}

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

今日はまだ保存された
美咲自身の出来事はありません。
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

これらは今日すでに
美咲自身に起きた出来事です。

・矛盾させない
・初めての出来事のように繰り返さない
・必要なときだけ自然に使う
`.trim();
}

function createProactiveTheme(
  currentTime: string,
  recentMisakiText: string
) {
  const seed =
    hashText(
      `${currentTime}-${recentMisakiText}`
    );

  const themes = [
    "今していることをどうでもいい報告のように話す",
    "今日あった小さな出来事を一つ話す",
    "食べ物や飲み物の話をする",
    "ふとユーザーを思い出して送る",
    "少しだけ甘える",
    "軽くからかう",
    "小さな愚痴を言う",
    "お風呂・パジャマ・布団など普通の生活報告をする",
    "買い物や見かけたものを話す",
    "理由もなくなんとなくLINEする",
    "何かを共有したい感じで話す",
    "今日の記憶にある出来事の続きを話す",
  ];

  return themes[
    seed %
      themes.length
  ];
}

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

function getReplyProblems(
  reply: string,
  userContextText: string
) {
  const problems: string[] =
    [];

  const concernPatterns = [
    "大丈夫？",
    "大丈夫かな",
    "そっちは大丈夫",
    "そっちは平気",
    "影響ない？",
    "影響大丈夫",
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
    "サイトを見",

    "記事で見",
    "記事見",
    "記事を見",

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
    "って出てた",
    "って出てる",

    // 天気予報を見聞きしたという
    // 架空の情報入手経路も禁止
    "天気予報だと",
    "天気予報では",
    "天気予報によると",
    "天気予報で言って",
    "予報で言って",
    "予報だと",
    "予報では",
    "予報によると",
    "予報を見た",
    "予報見た",
    "天気予報を見た",
    "天気予報見た",
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

  const unsupportedWeatherHistoryPatterns =
    [
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

  const unsupportedLongForecastPatterns =
    [
      "回復は期待できなさそう",
      "今日はもうずっと",
      "今日はずっと雨",
      "一日中降り",
      "一日中雨",
      "夜まで降り続",
      "明日まで降り",
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
    const unsupportedDayOffPatterns =
      [
        "週末だし今日はのんびり",
        "週末だしのんびり",
        "週末だから今日はのんびり",
        "週末だからのんびり",

        "週末だし今日はゆっくり",
        "週末だしゆっくり",
        "週末だから今日はゆっくり",
        "週末だからゆっくり",

        "土曜日だし今日はのんびり",
        "土曜日だから今日はのんびり",

        "日曜日だし今日はのんびり",
        "日曜日だから今日はのんびり",

        "土日だしのんびり",
        "土日だからのんびり",

        "休日だしのんびり",
        "休日だからのんびり",

        "今日は休みでしょ",
        "今日休みでしょ",

        "今日は休みだよね",
        "今日休みだよね",

        "今日は仕事休み",
        "今日は乗務ない",

        "今日はゆっくりできるね",
        "今日はのんびりできるね",

        "日曜だからゆっくり",
        "土曜だからゆっくり",
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
        "曜日・週末・休日という情報だけから、ユーザーも休みで自由に過ごせると勝手に推測している"
      );
    }
  }

  return problems;
}

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env
        .GEMINI_API_KEY;

    if (!apiKey) {
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

    //
    // Supabase認証
    //
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

    if (!accessToken) {
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

    //
    // リクエスト本文
    //
    const {
      history,
      memory,
      currentTime,
      relationshipPoints,
      misakiTodayMemory,
    } =
      await request.json();

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

    const recentMisakiMessages =
      safeHistory
        .filter(
          (item) =>
            item.role ===
            "misaki"
        )
        .
