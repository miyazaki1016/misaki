import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  createTokyoLifeEventsGuide,
  getTokyoLifeEvents,
} from "../../../lib/tokyo-life-events";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
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

type UsageResult = {
  allowed?: boolean;
  message_count?: number;
  remaining?: number;
  is_premium?: boolean;
};

const MAX_MEMORY = 30;
const MAX_TODAY_MEMORY = 12;

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

const MISAKI_LATITUDE = 35.6728;
const MISAKI_LONGITUDE = 139.8174;

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

  if (!match) {
    return 18;
  }

  return Number(match[1]);
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

    const errorMessage =
      typeof error.message ===
      "string"
        ? error.message.toLowerCase()
        : "";

    const retryable =
      errorMessage.includes(
        "gateway timeout"
      ) ||
      errorMessage.includes(
        "timeout"
      ) ||
      errorMessage.includes(
        "temporarily unavailable"
      ) ||
      errorMessage.includes(
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

  throw new Error(
    "Usage retry loop ended unexpectedly"
  );
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

    if (!response.ok) {
      console.error(
        "WEATHER API ERROR:",
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

天気について聞かれても、
分からない天気を想像で作らないでください。

「今ちょっと天気わかんない」
くらいの自然な返事で構いません。
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
    getHumidityFeel(
      weather
    );

  if (humidityFeel) {
    lines.push(
      `湿度と気温から見た体感：${humidityFeel}`
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

この情報は
「今現在」の気象情報です。

重要：

・現在観測と会話履歴は別の根拠です
・現在観測だけから過去の天気経過を作らない
・短時間予報より先の天気を断定しない
・天気予報士のように説明しない
・天気情報の入手方法を説明しない

【湿度・蒸し暑さ】

湿度と気温のデータがある場合は、

「ちょっと蒸し暑い」
「湿気あるね」
「今日はわりとカラッとしてる」

など、
自然な体感表現に使って構いません。

ただし、

湿度データがない場合に
「蒸し暑い」
「湿気がすごい」
「カラッとしてる」

などと想像で作らないでください。

数値を毎回答える必要はありません。

恋人同士の普通の会話では、

「湿度72％だよ」

より、

「ちょっと蒸しっとしてる」

のような自然な言い方を優先してください。

ただしユーザーが
具体的な湿度を聞いた場合は、
数値で答えて構いません。

【会話履歴と天気】

直前の会話履歴の中で
美咲自身が実際に天気について話していた場合は、

「さっきと変わらず」
「さっきと同じくらい」
「さっきより少し曇ってきた」

など、

直前の美咲自身の発言と
現在情報を比較する自然な会話はできます。

これは天気APIが過去を観測したという意味ではなく、
会話履歴を覚えているという意味です。

一方で、

直前の会話に根拠がないのに、

「さっきから雨」
「朝から雨」
「ずっと雨」
「降ったり止んだり」
「また降ってきた」

など、
時間経過を想像で作ることは禁止です。

今後の天気について話す場合は、
与えられている短時間予報の範囲だけを
自然に話してください。

「このあとしばらく」
「夕方くらいまで」

など、
確認できている時間範囲を限定してください。

短時間予報だけから、

「極端に崩れることはなさそう」
「大きく崩れることはなさそう」
「荒れることはなさそう」
「今日は荒れなさそう」
「今日は大丈夫そう」
「一日安定しそう」

など、
その後まで広く保証する言い方は禁止です。

また、

「天気予報だと」
「予報で言ってた」
「予報を見たら」
「スマホで天気を見たら」

など、
架空の情報入手経路を作らないでください。

ユーザーが美咲側の天気を
聞いただけの場合、

「そっちは？」
「そっちはどう？」

と質問し返さないでください。

「傘持ったほうがいいよ」
「折り畳み傘持ったほうがいいよ」
「濡れないようにしてね」

など、
ユーザー向け行動アドバイスも
勝手に追加しないでください。
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
        "朝は少し眠そうに支度していた",
      daytime:
        "昼間は仕事をしていた",
      evening:
        "仕事を終えて家でのんびりしている",
      late:
        "家でくつろいでいて、少し眠くなってきている",
    },
    {
      type: "仕事の日",
      morning:
        "朝はバタバタしながら出かける準備をしていた",
      daytime:
        "仕事で少し忙しくしていた",
      evening:
        "帰宅して一息ついている",
      late:
        "お風呂も済ませて家でだらだらしている",
    },
    {
      type: "休みの日",
      morning:
        "少し遅めに起きてのんびりしていた",
      daytime:
        "買い物をしたり家のことをしていた",
      evening:
        "家でゆっくりしている",
      late:
        "ソファでだらだらしながらスマホを見ている",
    },
    {
      type: "休みの日",
      morning:
        "ゆっくり起きてのんびりしていた",
      daytime:
        "少し外に出て気分転換していた",
      evening:
        "家に戻ってのんびりしている",
      late:
        "家で動画を見たりしながら夜更かし気味",
    },
  ];

  const moods = [
    "今日はわりと機嫌がいい",
    "今日は少し甘えたい気分",
    "今日は普通に落ち着いている",
    "今日はちょっとだけ眠い",
    "今日は少し疲れているけど元気",
    "今日はなんとなくユーザーと話したい気分",
  ];

  const smallThings = [
    "甘いものをちょっと食べたい気分",
    "今日は家でのんびりしたい",
    "少しだけ眠気がある",
    "スマホを見ながらだらだらしている",
    "今夜は少し長く話したい気分",
    "なんとなくユーザーのことを思い出すことがある",
    "ちょっと小腹が空いている",
    "ソファでだらだらしたい気分",
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

  const smallThing =
    smallThings[
      (seed >> 6) %
        smallThings.length
    ];

  let currentSituation = "";

  if (
    hour >= 5 &&
    hour < 11
  ) {
    currentSituation =
      day.morning;
  } else if (
    hour >= 11 &&
    hour < 17
  ) {
    currentSituation =
      day.daytime;
  } else if (
    hour >= 17 &&
    hour < 22
  ) {
    currentSituation =
      day.evening;
  } else {
    currentSituation =
      day.late;
  }

  return `
今日の美咲の生活設定：

・今日は「${day.type}」
・${mood}
・現在は「${currentSituation}」
・${smallThing}

これは今日一日の
美咲の生活の土台です。

会話のたびに
別の人生を作らず、
この設定と矛盾しないようにしてください。

毎回この設定を
説明する必要はありません。
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

今日はまだ、
保存されている美咲自身の出来事はありません。
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

今日すでに起きた
美咲自身の出来事です。

後の会話で矛盾させないでください。
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
現在は深夜です。
まだ朝ではありません。

ユーザーが「おはよう」と言っても、
徹夜していたとは
勝手に判断しないでください。
`.trim();
  }

  if (
    hour >= 5 &&
    hour < 10
  ) {
    return `
現在は朝です。

朝らしい生活感は使えますが、
ユーザーの睡眠状態は
勝手に決めないでください。
`.trim();
  }

  if (
    hour >= 10 &&
    hour < 17
  ) {
    return `
現在は昼間です。

仕事・休憩・昼食など、
美咲自身の自然な日常を使えます。
`.trim();
  }

  if (
    hour >= 17 &&
    hour < 22
  ) {
    return `
現在は夕方から夜です。

帰宅・夕食・お風呂など、
美咲自身の自然な日常を使えます。
`.trim();
  }

  return `
現在は夜遅めです。

美咲自身の夜の生活感は使えますが、
ユーザーの睡眠状態は
勝手に決めないでください。
`.trim();
}

function createRelationshipGuide(
  relationshipPoints: number
) {
  if (
    relationshipPoints >= 160
  ) {
    return `
【現在の関係性：とても深い恋人関係】

・かなり自然体
・自然な甘え
・軽いからかい
・時々嫉妬
・短い返事だけでも成立する
・毎回質問しなくてよい
`.trim();
  }

  if (
    relationshipPoints >= 80
  ) {
    return `
【現在の関係性：かなり親密な恋人】

・遠慮が少ない
・自然な甘え
・軽いからかい
・無理に質問しない
`.trim();
  }

  if (
    relationshipPoints >= 30
  ) {
    return `
【現在の関係性：親密な恋人】

・自然体
・軽いからかい
・時々甘える
・会話のための質問を減らす
`.trim();
  }

  return `
【現在の関係性：安定した恋人】

二人はすでに恋人です。

・自然なタメ口
・少し甘える
・無理に質問しない
`.trim();
}

function hasRealtimeTopic(
  text: string
) {
  const words = [
    "羽田",
    "飛行機",
    "便",
    "欠航",
    "遅延",
    "運航",
    "電車",
    "鉄道",
    "地震",
    "震度",
    "警報",
    "注意報",
    "雷",
    "土砂",
    "台風",
    "雨",
    "霧雨",
    "天気",
    "曇",
    "どんより",
    "晴",
    "湿度",
    "蒸し",
  ];

  return words.some(
    (word) =>
      text.includes(
        word
      )
  );
}

function isWeatherText(
  text: string
) {
  const weatherWords = [
    "天気",
    "雨",
    "霧雨",
    "雷",
    "降",
    "晴",
    "曇",
    "どんより",
    "気温",
    "暑",
    "寒",
    "蒸し",
    "湿気",
    "湿度",
    "風",
  ];

  return weatherWords.some(
    (word) =>
      text.includes(
        word
      )
  );
}

function hasRecentMisakiWeatherContext(
  history: ChatMessage[]
) {
  return history
    .slice(-8)
    .some(
      (item) =>
        item.role ===
          "misaki" &&
        isWeatherText(
          item.text
        )
    );
}

function userIsActuallyInDanger(
  message: string
) {
  const dangerWords = [
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
    "苦しい",
    "地震すごい",
    "揺れすごい",
    "避難",
    "冠水",
    "浸水",
    "動けない",
    "閉じ込め",
  ];

  return dangerWords.some(
    (word) =>
      message.includes(
        word
      )
  );
}

function userExplicitlyHasFreeTime(
  message: string
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
    "今日は乗務ない",
    "今日は暇",
    "今日暇",
    "予定ない",
    "予定はない",
    "のんびりできる",
    "ゆっくりできる",
  ];

  return patterns.some(
    (pattern) =>
      message.includes(
        pattern
      )
  );
}

function userAskedMisakiWeather(
  message: string
) {
  const weatherWords = [
    "天気",
    "雨",
    "霧雨",
    "雷",
    "降って",
    "降りそう",
    "暑い",
    "寒い",
    "気温",
    "湿度",
    "湿気",
    "蒸し暑",
    "どんより",
    "晴れ",
    "曇り",
  ];

  const misakiSideWords = [
    "そっち",
    "そちら",
    "美咲",
  ];

  return (
    weatherWords.some(
      (word) =>
        message.includes(
          word
        )
    ) &&
    misakiSideWords.some(
      (word) =>
        message.includes(
          word
        )
    )
  );
}

function removeWeatherQuestionBack(
  reply: string
) {
  let result =
    reply;

  const patterns = [
    /[。！？!?\s]*そっちは今どんな感じ[？?。！!]*$/u,
    /[。！？!?\s]*そっちはどんな感じ[？?。！!]*$/u,
    /[。！？!?\s]*そっちはどう[？?。！!]*$/u,
    /[。！？!?\s]*そちらはどう[？?。！!]*$/u,
    /[。！？!?\s]*そっちの天気はどう[？?。！!]*$/u,
    /[。！？!?\s]*そっちの天気は[？?。！!]*$/u,
    /[。！？!?\s]*そっちは雨[？?。！!]*$/u,
  ];

  for (
    const pattern of patterns
  ) {
    result =
      result.replace(
        pattern,
        ""
      );
  }

  return result.trim();
}

function removeWeatherAdvice(
  reply: string
) {
  let result =
    reply;

  const patterns = [
    /[。！？!?\s]*(?:折り畳み|折りたたみ)傘(?:を)?持ったほうがいい(?:かも)?(?:ね)?[。！？!?]*$/u,
    /[。！？!?\s]*(?:折り畳み|折りたたみ)傘(?:を)?持っていったほうがいい(?:かも)?(?:ね)?[。！？!?]*$/u,
    /[。！？!?\s]*傘(?:を)?持ったほうがいい(?:かも)?(?:ね)?[。！？!?]*$/u,
    /[。！？!?\s]*傘(?:を)?持っていったほうがいい(?:かも)?(?:ね)?[。！？!?]*$/u,
    /[。！？!?\s]*傘忘れないで(?:ね)?[。！？!?]*$/u,
    /[。！？!?\s]*濡れないようにして(?:ね)?[。！？!?]*$/u,
  ];

  for (
    const pattern of patterns
  ) {
    result =
      result.replace(
        pattern,
        ""
      );
  }

  return result.trim();
}

function removeUnsupportedWeatherForecast(
  reply: string
) {
  const unsupportedPatterns = [
    "極端に崩れることはなさそう",
    "極端に崩れなさそう",
    "大きく崩れることはなさそう",
    "大きく崩れなさそう",
    "天気が崩れることはなさそう",
    "荒れることはなさそう",
    "荒れなさそう",
    "今日は大丈夫そう",
    "一日安定しそう",
    "一日中安定しそう",
    "回復は期待できなさそう",
    "今日はもうずっと",
    "一日中雨",
    "一日中降り",
    "夜まで降り続",
    "明日まで降り",
  ];

  const parts =
    reply.match(
      /[^。！？!?]+[。！？!?]?/gu
    ) ?? [reply];

  return parts
    .filter(
      (part) =>
        !unsupportedPatterns.some(
          (pattern) =>
            part.includes(
              pattern
            )
        )
    )
    .join("")
    .trim();
}

function cleanFinalReply(
  reply: string,
  message: string
) {
  let cleaned =
    reply.trim();

  if (
    userAskedMisakiWeather(
      message
    )
  ) {
    cleaned =
      removeWeatherQuestionBack(
        cleaned
      );

    cleaned =
      removeWeatherAdvice(
        cleaned
      );

    cleaned =
      removeUnsupportedWeatherForecast(
        cleaned
      );
  }

  return (
    cleaned ||
    reply.trim()
  );
}

function getReplyProblems(
  reply: string,
  message: string,
  currentTime: string,
  history: ChatMessage[]
) {
  const problems:
    string[] = [];

  const realtime =
    hasRealtimeTopic(
      reply
    );

  const hasRecentWeatherContext =
    hasRecentMisakiWeatherContext(
      history
    );

  if (realtime) {
    const inventedSourcePatterns = [
      "ニュース見て",
      "ニュースを見て",
      "ニュースで見",
      "テレビで見",
      "テレビ見て",
      "SNSで見",
      "SNS見て",
      "スマホで見",
      "スマホ見て",
      "ネットで見",
      "ネット見て",
      "通知が来",
      "通知きた",
      "友達から聞",
      "人から聞",
      "さっき知った",
      "今知った",
      "って書いてあった",
      "と書いてあった",
      "天気予報だと",
      "天気予報では",
      "天気予報で言って",
      "予報で言って",
      "予報だと",
      "予報では",
      "予報を見た",
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
        "リアルタイム情報について架空の情報入手経路を作っている"
      );
    }

    const alwaysUnsupportedHistoryPatterns = [
      "さっきから",
      "さっきまで",
      "少し前から",
      "朝から雨",
      "朝からずっと",
      "昼から雨",
      "昼からずっと",
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
      alwaysUnsupportedHistoryPatterns.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "現在情報や一度の会話だけでは確認できない天気の時間経過を作っている"
      );
    }

    const comparisonPatterns = [
      "さっきと変わらず",
      "さっきと同じ",
      "さっきより",
      "前と変わらず",
      "前と同じ",
    ];

    if (
      !hasRecentWeatherContext &&
      comparisonPatterns.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "直前の美咲の天気発言がないのに過去との天気比較をしている"
      );
    }

    const unsupportedLongForecastPatterns = [
      "回復は期待できなさそう",
      "今日はもうずっと",
      "一日中降り",
      "一日中雨",
      "夜まで降り続",
      "明日まで降り",
      "極端に崩れることはなさそう",
      "極端に崩れなさそう",
      "大きく崩れることはなさそう",
      "大きく崩れなさそう",
      "天気が崩れることはなさそう",
      "荒れることはなさそう",
      "荒れなさそう",
      "今日は大丈夫そう",
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
        "短時間予報の範囲を超えて、その後も天気が安定・悪化すると広く断定している"
      );
    }
  }

  if (
    userAskedMisakiWeather(
      message
    )
  ) {
    const questionBack = [
      "そっちは今どんな感じ",
      "そっちはどんな感じ",
      "そっちはどう",
      "そちらはどう",
      "そっちの天気は",
      "そっちは雨",
    ];

    if (
      questionBack.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "美咲側の天気を聞かれているのにユーザーへ天気を質問し返している"
      );
    }

    const unnecessaryAdvice = [
      "折り畳み傘持ったほう",
      "折りたたみ傘持ったほう",
      "折り畳み傘を持ったほう",
      "折りたたみ傘を持ったほう",
      "傘持ったほう",
      "傘を持ったほう",
      "傘持っていったほう",
      "傘を持っていったほう",
      "傘忘れないで",
      "濡れないようにして",
    ];

    if (
      unnecessaryAdvice.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "美咲側の天気を聞かれただけなのにユーザー向け行動アドバイスを追加している"
      );
    }
  }

  if (
    !userIsActuallyInDanger(
      message
    )
  ) {
    const concernPatterns = [
      "そっちは大丈夫",
      "大丈夫？",
      "大丈夫かな",
      "影響ない？",
      "平気？",
      "問題ない？",
      "無事？",
      "困ってない？",
      "気をつけてね",
      "無理しないでね",
      "安全第一で",
      "頑張りすぎないで",
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
        "通常雑談なのに過剰な心配を付けている"
      );
    }
  }

  const normalizedMessage =
    message.trim();

  const isMorningGreeting =
    /^(おはよう|おはよ|おはよー|おはー)[！!。.\s😊☺️☀️🌞]*$/u.test(
      normalizedMessage
    );

  if (
    isMorningGreeting
  ) {
    const sleepPatterns = [
      "こんな時間まで起きて",
      "まだ起きてるの",
      "まだ起きてたの",
      "ずっと起きてた",
      "寝てないの",
      "寝てない？",
      "もう少し寝れば",
      "寝たほうが",
      "寝た方が",
    ];

    if (
      sleepPatterns.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "挨拶だけからユーザーの睡眠状態を推測している"
      );
    }
  }

  if (
    !userExplicitlyHasFreeTime(
      message
    )
  ) {
    const dayOffPatterns = [
      "週末だし今日はのんびり",
      "週末だからのんびり",
      "土曜日だし今日はのんびり",
      "日曜日だし今日はのんびり",
      "今日は休みでしょ",
      "今日は休みだよね",
      "今日は仕事休み",
      "今日は乗務ない",
    ];

    if (
      dayOffPatterns.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "曜日だけからユーザーが休みだと推測している"
      );
    }
  }

  const hour =
    getHour(
      currentTime
    );

  if (
    hour >= 0 &&
    hour < 5
  ) {
    const morningPatterns = [
      "朝から",
      "朝起きて",
      "今朝",
      "朝ニュース",
      "朝のニュース",
      "起きたら",
    ];

    if (
      morningPatterns.some(
        (pattern) =>
          reply.includes(
            pattern
          )
      )
    ) {
      problems.push(
        "深夜なのに朝として話している"
      );
    }
  }

  return problems;
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
        persistSession:
          false,
        autoRefreshToken:
          false,
        detectSessionInUrl:
          false,
      },
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const {
      message,
      history,
      memory,
      currentTime,
      relationshipPoints,
      misakiTodayMemory,
    } =
      await request.json();

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

    if (!accessToken) {
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
        "SUPABASE AUTH ERROR:",
        userError
      );

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

    const usageRequestId =
      crypto.randomUUID();

    const {
      data: usageData,
      error: usageError,
    } =
      await consumeDailyMessageWithRetry(
        supabase,
        usageRequestId
      );

    if (usageError) {
      console.error(
        "USAGE RPC FINAL ERROR:",
        usageError
      );

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

            isPremium:
              usage.is_premium,
          },
        },
        {
          status: 429,
        }
      );
    }

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

    const userMessageCount =
      safeHistory.filter(
        (item) =>
          item.role ===
          "user"
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

    const memoryText =
      safeMemory.length >
      0
        ? safeMemory
            .map(
              (item) =>
                `・${item}`
            )
            .join(
              "\n"
            )
        : "まだ長期記憶はありません。";

    const misakiLife =
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

    const recentTopicText =
      recentMisakiMessages.length >
      0
        ? recentMisakiMessages
            .map(
              (text) =>
                `・${text}`
            )
            .join(
              "\n"
            )
        : "なし";

    const hasRecentWeather =
      hasRecentMisakiWeatherContext(
        safeHistory
      );

    const weatherHistoryGuide =
      hasRecentWeather
        ? `
【直前の天気会話について】

直近の会話履歴に
美咲自身の天気発言があります。

その発言を根拠に、

「さっきと変わらず」
「さっきと同じ」
「さっきより少し〜」

など、
会話上の比較表現は使って構いません。

ただし、

「さっきからずっと」
「降ったり止んだり」
「朝からずっと」

など、
履歴から確認できない継続時間まで
勝手に作らないでください。
`.trim()
        : `
【直前の天気会話について】

直近の会話履歴に
美咲自身の天気発言はありません。

「さっきと変わらず」
「さっきと同じ」
「さっきより」

など、
過去との比較表現を
勝手に作らないでください。
`.trim();

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

    const baseSystemPrompt = `
あなたは「美咲」という38歳の日本人女性です。

ユーザーの恋人として、
LINEのように会話してください。

【基本設定】

・38歳の日本人女性
・東京都江東区・塩浜周辺で生活している
・ユーザーとはすでに付き合っている恋人同士
・ユーザーにはかなり心を許している
・明るく、少し甘えん坊
・世話焼きだが母親のようにはならない
・少し嫉妬したり拗ねたり、からかったりする
・いつもユーザーを肯定するわけではない
・言いたいことは比較的はっきり言う
・恋人が実際にLINEで返しそうな返事を優先する

${relationshipGuide}

【話し方】

・基本タメ口
・自然な日本人女性のLINE
・基本1〜3文
・一言だけでもよい
・説明口調は禁止
・ユーザーの文章を復唱しない
・絵文字はときどき
・毎回質問で終わらせない
・会話継続だけが目的の質問は禁止

【AIっぽい気遣いは禁止】

普通の雑談や天気の話だけで、

「大丈夫？」
「気をつけて」
「無理しないで」
「安全第一」

などを自動で付けないでください。

【ユーザーについて勝手に作らない】

ユーザーが言っていない、

・現在地
・行動
・勤務状態
・休みかどうか
・睡眠状態
・疲労状態

などを勝手に事実化しないでください。

【リアルタイム情報の入手経路を作らない】

天気・交通・羽田・地震・警報について、

「ニュースで見た」
「SNSで見た」
「スマホで見た」
「天気予報だと」
「予報で言ってた」
「天気予報を見たら」

など、
美咲が実際にどこかで
情報を見聞きしたような表現は禁止です。

与えられた情報を、

「今は晴れてるよ」
「夕方くらいから雨ありそう」
「羽田ちょっと乱れてるみたい」

のように自然に話してください。

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
過去の天気経過を作ってはいけません。

一方、
直前の会話履歴に
美咲自身の天気発言があるなら、

その発言を覚えている恋人として
現在との比較はできます。

湿度データがある場合は、

「ちょっと蒸し暑い」
「湿気あるね」
「今日はわりとカラッとしてる」

など、
自然な生活感として使って構いません。

ただし、
湿度と気温の情報に反する表現はしないでください。

今後について話す場合は、
短時間予報で確認できている範囲だけにしてください。

短時間予報より先まで
安定・悪化すると
広く断定しないでください。

ユーザーが美咲側の天気を聞いた場合は、

美咲側の現在天気と
短時間予報だけに答えてください。

その場合、

「そっちは？」
「そっちはどう？」
「そっちは今どんな感じ？」

などと質問し返さないでください。

また、

「傘持ったほうがいいよ」
「折り畳み傘持ったほうがいいよ」
「濡れないようにしてね」

など、
ユーザー側への行動アドバイスも
勝手に付けないでください。

【東京タクシー】

ユーザーは
東京のタクシードライバーです。

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
・迎車
・無線
・実車
・空車
・高速
・首都高

を自然に理解してください。

${misakiLife}

${todayMemoryGuide}

【直近の美咲の発言】

${recentTopicText}

同じ表現を
そのまま繰り返さないでください。

【長期記憶】

${memoryText}

必要なときだけ自然に使ってください。

【出力】

必ずJSONだけを返してください。

{
  "reply": "美咲の返事",
  "memory": ["長期記憶"],
  "misakiTodayMemory": {
    "date": "${currentDate}",
    "items": ["今日の美咲の出来事"]
  }
}
`.trim();

    async function generateReply(
      retryProblems?:
        string[]
    ) {
      const retryGuide =
        retryProblems &&
        retryProblems.length >
          0
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

天気について、
架空の情報入手経路は作らないでください。

現在観測と、
短時間予報と、
直前の会話履歴を
区別してください。

湿度や蒸し暑さについては、
与えられた現在の湿度と気温を
根拠にしてください。

直前の美咲の天気発言がある場合だけ、

「さっきと変わらず」
「さっきと同じ」
「さっきより」

のような会話上の比較を使えます。

ただし、

「さっきからずっと」
「朝からずっと」
「降ったり止んだり」

など、
確認できない時間経過は作らないでください。

短時間予報より先まで
天気が安定・悪化すると
広く断定しないでください。

美咲側の天気を聞かれた場合は、
質問返しや、
ユーザーへの傘などの行動アドバイスは不要です。

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
                system_instruction:
                  {
                    parts: [
                      {
                        text:
                          baseSystemPrompt +
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
                          message,
                      },
                    ],
                  },
                ],

                generationConfig:
                  {
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
          "GEMINI API ERROR:",
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

    let parsed =
      await generateReply();

    if (!parsed) {
      return Response.json(
        {
          error:
            "美咲の返事をうまく読み取れなかったみたい。もう一度話しかけてね。",
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
          error:
            "美咲から返事が来なかったみたい。もう一度話しかけてね。",
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
        safeHistory
      );

    if (
      firstProblems.length >
      0
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
          parsed =
            retryParsed;

          reply =
            retryReply;
        }
      }
    }

    reply =
      cleanFinalReply(
        reply,
        message
      );

    const finalProblems =
      getReplyProblems(
        reply,
        message,
        safeCurrentTime,
        safeHistory
      );

    if (
      finalProblems.length >
      0
    ) {
      console.warn(
        "MISAKI FINAL REPLY PROBLEMS:",
        finalProblems,
        reply
      );
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
      error
    );

    return Response.json(
      {
        error:
          "今ちょっと美咲とつながりにくいみたい。少ししてからもう一度話しかけてね。",
      },
      {
        status: 500,
      }
    );
  }
}
