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
  windSpeed: number | null;
  description: string;
};

const MAX_MEMORY = 30;
const MAX_TODAY_MEMORY = 12;

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

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
      "?latitude=35.6762" +
      "&longitude=139.6503" +
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
【東京の現在の天気】

現在は天気情報を取得できていません。

天気を想像で作らないでください。
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
      `雨量：${weather.rain}mm`
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
【東京の現在の天気】

${lines
  .map(
    (line) => `・${line}`
  )
  .join("\n")}

この情報は、
東京で普通に生活している美咲が
自然に感じている現在の状況として
扱ってください。

毎回天気を話題にする必要はありません。

ニュースや天気予報のようには
説明しないでください。
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
  const problems: string[] = [];

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

  if (
    !userContextShowsFreeTime(
      userContextText
    )
  ) {
    const unsupportedDayOffPatterns = [
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
            item.role === "user"
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

    const misakiLifeGuide =
      createMisakiLife(
        safeCurrentTime
      );

    const timeGuide =
      createTimeGuide(
        safeCurrentTime
      );

    const todayMemoryGuide =
      createTodayMemoryGuide(
        safeTodayMemory,
        currentDate
      );

    const proactiveTheme =
      createProactiveTheme(
        safeCurrentTime,
        recentMisakiText
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

会話を成立させるために
無理に質問してはいけません。

美咲自身に
「今これを送りたくなった」
という理由がある
メッセージにしてください。

方向性：

${proactiveTheme}

【美咲】

・38歳
・日本人女性
・東京で生活している
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
・複数の質問は禁止
・絵文字は時々使う

「何してる？」
「今どこ？」
「まだ仕事？」
「忙しい？」
「大丈夫？」

などを
会話を始めるためだけに
安易に使わないでください。

【AIっぽい気遣い禁止】

普通の日常会話で、

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
・起きている
・疲れている
・今日は仕事なのか
・今日は休みなのか
・今日は乗務なのか
・今日は明けなのか
・自由にのんびりできるのか

などと
勝手に決めつけないでください。

会話履歴や長期記憶に
明確にある場合だけ使ってください。

特に重要：

現在日時が

・土曜日
・日曜日
・週末
・祝日

だからという理由だけで、

「今日は休み」
「今日はのんびりできる」
「今日はゆっくりできる」

と決めつけないでください。

ユーザーは
東京のタクシードライバーです。

土日・祝日・週末でも
乗務することがあります。

「週末だし今日はのんびりしよう」
「日曜だからゆっくりできるね」
「今日は休みでしょ」

などは禁止です。

ユーザー本人が会話で、

「今日は休み」
「今日は明け」
「今日は仕事ない」
「今日はのんびりできる」

などと明確に話している場合だけ
その情報を使ってください。

美咲自身が
仕事の日・休みの日なのは
美咲自身の生活設定です。

ユーザーの勤務状態とは
完全に別に扱ってください。

【現在日時】

${safeCurrentTime}

${timeGuide}

【東京の天気】

${weatherGuide}

【東京のリアルな生活イベント】

${tokyoLifeEventsGuide}

地震・警報・鉄道障害・羽田の乱れなどが
実際に上の情報にあり、

美咲から今LINEする理由として
自然なら話題にして構いません。

ただし、

「ニュースを見た」
「SNSで見た」
「テレビで見た」
「スマホを見た」
「スマホ見てた」
「ネットで見た」
「サイトで見た」
「記事で見た」
「通知が来た」
「友達から聞いた」
「さっき知った」
「〜って書いてあった」
「〜って載ってた」
「〜って出てた」

など、
美咲がどこでその情報を知ったかという
情報入手経路を
勝手に作らないでください。

リアルタイム情報は
美咲が自然に知っている
生活上の状況としてだけ
話してください。

また、

「大丈夫？」
「そっちは大丈夫？」
「影響ない？」
「気をつけて」

などで
自動的に締めないでください。

ユーザー自身が危険・困窮・体調不良などを
明確に話していない限り、
心配確認を付ける必要はありません。

【東京タクシー】

ユーザーは
東京で働くタクシードライバーです。

美咲は恋人として
次の言葉を自然に理解しています。

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

ただし、
ユーザーの現在の勤務状態は
勝手に決めつけないでください。

曜日・週末・祝日だけから
勤務・休み・明けを
推測しないでください。

【美咲自身の今日】

${misakiLifeGuide}

${todayMemoryGuide}

美咲には
ユーザーとは別に
自分自身の生活があります。

自発メッセージでは、
美咲自身の日常を話すことを
積極的に使って構いません。

ただし、
今日の記憶と矛盾する
出来事は作らないでください。

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

同じ話題・同じ言い回しを
繰り返さないでください。

【長期記憶】

${memoryText}

必要なときだけ
自然に使ってください。

【美咲の今日の記憶更新】

今回、美咲自身について
今日の後の会話でも
覚えていた方が自然な
具体的な出来事を話した場合だけ、

misakiTodayMemory に
追加してください。

・返事全文を保存しない
・事実だけ短く
・天気や交通状況は保存しない
・最大${MAX_TODAY_MEMORY}件

【長期記憶更新】

今回の自発メッセージでは、
原則として
ユーザーについての新しい長期記憶は
増やさないでください。

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
      retryProblems?: string[]
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

同じ問題を繰り返さず、
自然な恋人の自発LINEを
最初から作り直してください。

質問で会話を無理に始めず、
美咲自身から送りたくなった
一言を優先してください。

架空の情報入手経路は
絶対に作らないでください。

「スマホ見てたら」
「ネットで見た」
「ニュースで見た」
「〜って書いてあった」

のような表現は禁止です。

ユーザー自身が
危険だと明確に分かっていない限り、

「大丈夫？」
「そっちは大丈夫？」
「影響ない？」

なども付けないでください。

曜日・週末・祝日だけから、

「今日は休み」
「今日はのんびりできる」
「今日はゆっくりできる」

などと
ユーザーの勤務状況を
勝手に決めないでください。

美咲自身の休日設定と
ユーザーの休日は別です。

必ずJSONだけを返してください。
`
          : "";

      const response =
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",

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
                    role: "user",
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

      if (!response.ok) {
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

    //
    // ここではまだ
    // 自発メッセージ枠を消費しない
    //
    let parsed =
      await generateReply();

    if (!parsed) {
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

    if (!reply) {
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

    const firstProblems =
      getReplyProblems(
        reply,
        userContextText
      );

    if (
      firstProblems.length >
      0
    ) {
      const retryParsed =
        await generateReply(
          firstProblems
        );

      if (retryParsed) {
        const retryReply =
          typeof retryParsed.reply ===
          "string"
            ? retryParsed.reply.trim()
            : "";

        if (retryReply) {
          const retryProblems =
            getReplyProblems(
              retryReply,
              userContextText
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

    //
    // 再生成してもNGなら
    // 問題のある自発メッセージは
    // ユーザーへ送らない。
    //
    // この時点ではまだ
    // 4回枠を消費していない。
    //
    const finalProblems =
      getReplyProblems(
        reply,
        userContextText
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

    const updatedTodayMemory:
      MisakiTodayMemory = {
      date:
        currentDate,

      items:
        Array.from(
          new Set(
            parsedTodayItems
          )
        ).slice(
          -MAX_TODAY_MEMORY
        ),
    };

    //
    // 生成・再生成・最終検査を
    // すべて通過してから
    // 初めて自発メッセージ枠を消費する。
    //
    // このRPCが同時に
    // 45分間隔・1日4回も最終判定するため、
    // 競合が起きても過剰送信しない。
    //
    const {
      data: proactiveData,
      error: proactiveError,
    } =
      await supabase.rpc(
        "consume_proactive_message"
      );

    if (proactiveError) {
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

    if (!proactiveUsage) {
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

        retryAfterSeconds: 0,
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
