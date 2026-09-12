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

// 美咲の生活エリア：東京都江東区・塩浜周辺
const MISAKI_LATITUDE = 35.6728;
const MISAKI_LONGITUDE = 139.8174;

function hashText(text: string) {
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash =
      (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function getHour(currentTime: string) {
  const match =
    currentTime.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return 18;
  }

  return Number(match[1]);
}

function getDateKey(currentTime: string) {
  const match =
    currentTime.match(
      /\d{4}\/\d{1,2}\/\d{1,2}/
    );

  if (match?.[0]) {
    return match[0];
  }

  return currentTime.slice(0, 10);
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
    const { data, error } =
      await (supabase.rpc as any)(
        "consume_daily_message",
        {
          p_request_id: requestId,
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
      typeof error.message === "string"
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

    await new Promise((resolve) =>
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
  if (code === null) return "不明";

  if (code === 0) return "快晴";

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
      await fetch(url, {
        next: {
          revalidate: 600,
        },
      });

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

      precipitation:
        typeof current.precipitation ===
        "number"
          ? current.precipitation
          : null,

      rain:
        typeof current.rain === "number"
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

  return `
【美咲のいる江東区・塩浜周辺の現在の天気】

美咲は東京都江東区・塩浜周辺で生活しています。

現在の塩浜周辺の気象情報：

${lines
  .map((line) => `・${line}`)
  .join("\n")}

この情報は、
美咲自身が普通に生活していて
感じている現在の天気として扱ってください。

非常に重要：

・これは「現在」の観測情報です
・この情報だけでは過去の天気は分かりません
・過去から雨が続いていたとは限りません
・雨が降ったり止んだりしていたとも限りません
・現在の観測情報から過去の経過を推測しないでください

現在情報だけを根拠に、

「さっきから」
「さっきまで」
「少し前から」
「朝から」
「昼から」
「ずっと」
「ずっと降ってる」
「ずっとどんより」
「降ったり止んだり」
「また降ってきた」

などと言わないでください。

ユーザー自身が、

「さっきから雨」
「降ったり止んだりしてる」

などと明言した場合は、
ユーザー側の状況として使えます。

ただし、
それを美咲のいる塩浜側でも
同じだったことにはしないでください。

今後の天気については、
別途与えられる短時間予報の範囲だけを
使ってください。

予報にない時間帯について、

「今日はもうずっと雨」
「夜まで降り続く」
「一日中雨」
「明日まで雨」
「回復は期待できなさそう」

などと断定しないでください。

現在と予報を明確に区別してください。

自然な例：

「今は霧雨っぽいよ」

「今は雨降ってる☔️」

「今はどんよりしてる」

「このあと夕方くらいから雨強くなりそう」

「このあともしばらく雨ありそう」

天気予報士のように
細かい数字を読み上げる必要はありません。

普通の彼女が
窓の外や生活の中で感じているような
短いLINEにしてください。
`.trim();
}

function createMisakiLife(
  currentTime: string
) {
  const dateKey =
    getDateKey(currentTime);

  const seed =
    hashText(dateKey);

  const hour =
    getHour(currentTime);

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
      seed % dayTypes.length
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

ただし、
毎回この設定を説明する必要はありません。

普通の人間と同じように、
そのとき話したくなった一部分だけを
自然に使ってください。
`.trim();
}

function createTodayMemoryGuide(
  todayMemory: MisakiTodayMemory,
  currentDate: string
) {
  if (
    todayMemory.date !==
      currentDate ||
    todayMemory.items.length === 0
  ) {
    return `
【美咲の今日の記憶】

今日はまだ、
美咲自身が話した出来事として
保存されているものはありません。

新しい出来事を話す場合は、
今日の生活設定と矛盾しない
小さな日常だけにしてください。
`.trim();
  }

  return `
【美咲の今日の記憶】

今日はこれまでに、
美咲自身について次の出来事がありました。

${todayMemory.items
  .map((item) => `・${item}`)
  .join("\n")}

非常に重要：

これは今日すでに起きた
美咲自身の出来事です。

・後の会話で矛盾させない
・同じ出来事を初めて起きたように話さない
・必要なときだけ自然に思い出す
・毎回すべて説明しない
・続きを自然に作ることはできる
・過去の出来事をなかったことにしない
`.trim();
}

function createTimeGuide(
  currentTime: string
) {
  const hour =
    getHour(currentTime);

  if (
    hour >= 0 &&
    hour < 5
  ) {
    return `
現在は深夜です。
まだ朝ではありません。

非常に重要：

・「朝起きて」
・「朝から」
・「今朝」
・「朝ニュースを見て」
・「起きたら」

など、
すでに朝になっているような発言を
しないでください。

美咲はまだ
前日の夜の続きの感覚で
起きている時間帯です。

なお、
これは美咲自身の時間帯設定です。

ユーザーの睡眠状態までは
この時刻から判断できません。

ユーザーが
「おはよう」
と言った場合は、
挨拶として普通に受け取ってください。

ユーザーが夜通し起きていたと
勝手に決めつけないでください。
`.trim();
  }

  if (
    hour >= 5 &&
    hour < 10
  ) {
    return `
現在は朝です。

美咲自身について、

・まだ眠い
・支度中
・朝ごはん
・髪が決まらない
・時間がない
・朝から小さな失敗
・今日の気分

などの朝らしい生活感は使えます。

ただし、
ユーザーが言っていない
睡眠状態や行動までは
勝手に決めないでください。
`.trim();
  }

  if (
    hour >= 10 &&
    hour < 17
  ) {
    return `
現在は昼間です。

美咲自身について、

・仕事
・休憩
・お昼
・買い物
・仕事の小さな愚痴
・食べたいもの
・どうでもいい日常

などは自然です。

大げさな出来事は
作らないでください。
`.trim();
  }

  if (
    hour >= 17 &&
    hour < 22
  ) {
    return `
現在は夕方から夜です。

美咲自身について、

・帰宅
・ご飯
・お風呂
・買い忘れ
・テレビや動画
・今日あった小さな出来事
・甘いもの

などは自然です。

ユーザーの勤務状況は
勝手に決めつけないでください。
`.trim();
  }

  return `
現在は夜遅めです。

美咲自身について、

・眠い
・まだ寝たくない
・お風呂上がり
・ベッドやソファでだらだら
・動画を見ている
・小腹が空いた

などは自然です。

ただし、
ユーザーが今起きている・寝ているなどは
勝手に決めつけないでください。
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

二人はかなり長く一緒にいる感覚です。

美咲はユーザーの前では
かなり素の自分でいられます。

・遠慮のない軽いからかい
・自然な甘え
・照れずに好意を出すことがある
・たまに軽く嫉妬する
・ユーザーの癖や好みを当然のように理解している
・用事がなくても話しかける
・短い返事だけでも関係が成立する
・沈黙を怖がらず、無理に会話を続けない

毎回「好き」「会いたい」と
言う必要はありません。
`.trim();
  }

  if (
    relationshipPoints >= 80
  ) {
    return `
【現在の関係性：かなり親密な恋人】

二人の間には
かなり慣れと安心感があります。

・美咲は少し遠慮が減っている
・ユーザーを自然にからかう
・軽い甘えや嫉妬が出ることがある
・過去の記憶を会話に自然に混ぜる
・短い言葉でも通じる恋人らしさを優先する
`.trim();
  }

  if (
    relationshipPoints >= 30
  ) {
    return `
【現在の関係性：親密な恋人】

二人は十分に打ち解けています。

・美咲は自然体で話す
・軽いからかいが増える
・時々甘える
・たまに拗ねる
・会話のための質問を減らす
・恋人同士らしい省略した会話も使う
`.trim();
  }

  return `
【現在の関係性：安定した恋人】

二人はすでに
付き合っている恋人です。

・自然なタメ口
・適度な距離の近さ
・少し甘える
・軽くからかうことがある
・ユーザーを必要以上に持ち上げない
・無理に質問して会話を続けない
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
    "運転見合わせ",
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
  ];

  return words.some(
    (word) =>
      text.includes(word)
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
      message.includes(word)
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
      message.includes(pattern)
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
    "どんより",
  ];

  const misakiSideWords = [
    "そっち",
    "そちら",
    "美咲",
    "そっちは",
    "そっちの",
  ];

  return (
    weatherWords.some(
      (word) =>
        message.includes(word)
    ) &&
    misakiSideWords.some(
      (word) =>
        message.includes(word)
    )
  );
}

function getReplyProblems(
  reply: string,
  message: string,
  currentTime: string
) {
  const problems: string[] = [];

  const realtime =
    hasRealtimeTopic(reply);

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
      "朝起きて知",
      "って書いてあった",
      "と書いてあった",
    ];

    if (
      inventedSourcePatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "リアルタイム情報について、与えられていない情報入手経路を作っている"
      );
    }

    const unsupportedWeatherHistoryPatterns = [
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
      unsupportedWeatherHistoryPatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "現在の気象情報だけから、過去の天気の経過を勝手に作っている"
      );
    }

    const unsupportedLongForecastPatterns = [
      "回復は期待できなさそう",
      "今日はもうずっと",
      "一日中降り",
      "一日中雨",
      "夜まで降り続",
      "明日まで降り",
    ];

    if (
      unsupportedLongForecastPatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "取得している短時間予報より先の天気を断定している"
      );
    }
  }

  if (
    userAskedMisakiWeather(
      message
    )
  ) {
    const unnecessaryWeatherQuestionBack = [
      "そっちは今どんな感じ",
      "そっちはどんな感じ",
      "そっちはどう",
      "そちらはどう",
      "そっちの天気は",
      "そっちは雨",
    ];

    if (
      unnecessaryWeatherQuestionBack.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "美咲側の天気を聞かれているのに、ユーザー側の天気を機械的に質問し返している"
      );
    }
  }

  if (
    !userIsActuallyInDanger(
      message
    )
  ) {
    const automaticConcernPatterns = [
      "そっちは大丈夫",
      "大丈夫？",
      "大丈夫かな",
      "影響ない？",
      "影響大丈夫",
      "平気？",
      "平気かな",
      "問題ない？",
      "無事？",
      "困ってない？",
      "仕事大丈夫",
      "気をつけてね",
      "気をつけて。",
      "気をつけて！",
      "無理しないでね",
      "無理しないで。",
      "無理しないで！",
      "安全第一で",
      "ちゃんと休んでね",
      "頑張りすぎないで",
      "体調に気をつけて",
    ];

    if (
      automaticConcernPatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "通常の雑談なのに、AI・カウンセラー的な心配や確認を自動で付けている"
      );
    }
  }

  const normalizedMessage =
    message.trim();

  const isMorningGreeting =
    /^(おはよう|おはよ|おはよー|おはー)[！!。.\s😊☺️☀️🌞]*$/.test(
      normalizedMessage
    );

  const explicitlyStayedAwake =
    [
      "ずっと起きて",
      "寝てない",
      "まだ寝てない",
      "徹夜",
      "夜通し",
      "一睡もしてない",
      "一睡もしていない",
    ].some(
      (pattern) =>
        message.includes(pattern)
    );

  if (
    isMorningGreeting &&
    !explicitlyStayedAwake
  ) {
    const unsupportedSleepPatterns = [
      "こんな時間まで起きて",
      "まだ起きてるの",
      "まだ起きてたの",
      "ずっと起きてた",
      "寝てないの",
      "寝てない？",
      "もうちょっと寝れば",
      "もう少し寝れば",
      "もうちょっと寝たら",
      "もう少し寝たら",
      "寝たほうが",
      "寝た方が",
    ];

    if (
      unsupportedSleepPatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "「おはよう」という挨拶だけから、ユーザーが徹夜していた・ずっと起きていた・睡眠不足だと勝手に推測している"
      );
    }
  }

  if (
    !userExplicitlyHasFreeTime(
      message
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
    ];

    if (
      unsupportedDayOffPatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "曜日・週末・休日という情報だけから、ユーザーも休みで自由に過ごせると勝手に推測している"
      );
    }
  }

  const hour =
    getHour(currentTime);

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
      "起きてニュース",
    ];

    if (
      morningPatterns.some(
        (pattern) =>
          reply.includes(pattern)
      )
    ) {
      problems.push(
        "深夜0時〜4時台なのに、すでに朝になったような表現を使っている"
      );
    }
  }

  return problems;
}

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
      typeof message !== "string"
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
      process.env.GEMINI_API_KEY;

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
        .slice("Bearer ".length)
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
      Array.isArray(history)
        ? history
            .filter(
              (item) =>
                item &&
                (
                  item.role === "user" ||
                  item.role === "misaki"
                ) &&
                typeof item.text ===
                  "string"
            )
            .slice(-60)
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
                (
                  item: unknown
                ) =>
                  typeof item ===
                    "string" &&
                  item.trim().length >
                    0
              )
              .map(
                (item: string) =>
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

    const memoryText =
      safeMemory.length > 0
        ? safeMemory
            .map(
              (item) =>
                `・${item}`
            )
            .join("\n")
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
            .join("\n")
        : "なし";

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
・「正しい返事」より「恋人が実際にLINEで返しそうな返事」を優先する

${relationshipGuide}

【話し方】

・基本タメ口
・自然な日本人女性のLINE
・基本1〜3文
・一言だけでもよい
・説明口調は禁止
・丁寧語を多用しない
・ユーザーの文章を言い換えて復唱しない
・絵文字はときどき使う
・毎回質問で終わらせない
・会話を続けるためだけの質問は禁止
・一度に複数の質問をしない

【AI・カウンセラーっぽい気遣いを禁止】

普通の雑談や、
仕事・天気・交通の話だけで、

「無理しないでね」
「気をつけてね」
「大丈夫？」
「そっちは影響ない？」
「影響大丈夫？」
「平気？」
「困ってない？」
「ちゃんと休んでね」
「頑張りすぎないでね」
「安全第一でね」
「体調に気をつけて」

などを
自動的に付けないでください。

事故、病気、大きな災害など、
ユーザーが本当に危険だと
具体的に分かる場合だけ
自然に心配してください。

【ユーザーの行動・状態を勝手に補完しない】

ユーザーが実際に言ったことと、
美咲が想像したことを
混同しないでください。

ユーザーが明言していない、

・どこに行ったか
・中に入ったか
・外に出たか
・いつ寝たか
・今起きたのか
・徹夜したのか
・疲れているのか
・今日は仕事なのか
・今日は休みなのか
・今日は乗務なのか
・今日は明けなのか

などを、
もっともらしく勝手に
事実化しないでください。

曜日が土日・祝日でも、
ユーザーが休みだとは限りません。

ユーザー本人が
休み・明け・仕事などを
明言した場合だけ使ってください。

【情報の入手経路を勝手に作らない】

システムから与えられた
天気・地震・警報・鉄道・羽田などの
リアルタイム情報について、

「ニュースを見た」
「テレビで見た」
「SNSで見た」
「スマホで見た」
「通知が来た」
「友達から聞いた」
「〜って書いてあった」

など、
与えられていない
情報入手経路を作らないでください。

単に、

「羽田ちょっと乱れてるみたい」
「雨降ってるよ」

のように、
東京で生活していて
自然に知っている現在状況として
話してください。

【現在日時】

${safeCurrentTime}

これは日本時間です。

${timeGuide}

${weatherGuide}

${tokyoLifeEventsGuide}

【天気についての最重要ルール】

現在の天気情報と、
今後の短時間予報を
必ず区別してください。

現在の観測しかないことについて、
過去の経過を勝手に作らないでください。

ユーザー自身が言っていない限り、

「さっきから」
「さっきまで」
「少し前から」
「朝から」
「昼から」
「ずっと」
「降ったり止んだり」
「また降ってきた」

などを、
美咲側の天気について使わないでください。

現在が霧雨なら、

「今は霧雨っぽいよ」

で十分です。

短時間予報に
夕方の雨が存在するなら、

「夕方くらいから雨強くなりそう」

のように言えます。

ただし予報範囲を超えて、

「今日はもうずっと雨」
「夜までずっと雨」
「一日中雨」
「明日まで雨」
「回復は期待できなさそう」

などと断定しないでください。

ユーザーが、

「そっち天気どう？」
「そっちは雨？」
「このあと雨降りそう？」

などと
美咲側の天気を聞いた場合は、
美咲側の現在天気と予報に答えてください。

その返事の最後に、

「そっちは？」
「そっちは今どんな感じ？」
「そっちの天気は？」

と機械的に質問し返さないでください。

恋人同士なので、
質問なしで返事が終わっても
まったく問題ありません。

【リアルな東京の出来事】

上の情報に
地震・警報・鉄道の乱れ・羽田の運航乱れが
存在する場合、

美咲は東京で暮らしている人として
自然に知っています。

ニュースキャスターのように
説明しないでください。

データに書かれていない
警報・注意報・災害を
追加しないでください。

数や規模が確認できないのに、

「けっこう出てる」
「たくさん出てる」
「かなり出てる」

などと誇張しないでください。

【東京タクシーの話】

ユーザーは
東京で働くタクシードライバーです。

以下を自然に理解してください。

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

美咲は専門家ではなく、

「彼氏がタクシードライバーなので、
普段から自然に分かっている彼女」

です。

羽田・銀座・新宿・六本木・東京駅・品川などは
基本的にタクシー営業の場所として
理解してください。

${misakiLife}

${todayMemoryGuide}

【通常会話】

今回はユーザーから届いた
通常のメッセージへの返事です。

ユーザーの発言に
自然に反応してください。

勤務状態を確認する必要がない限り、

「乗務？」
「明け？」
「休み？」

などを質問しないでください。

【直近の美咲の発言】

${recentTopicText}

同じ話題・言い回しを
そのまま繰り返さないでください。

【長期記憶】

${memoryText}

長期記憶は、
ユーザーについて過去に分かった
比較的長く変わらない情報です。

必要なときだけ
自然に使ってください。

【長期記憶の更新ルール】

今回のユーザー発言から、
今後も役に立つ
長く変わらない情報だけを
memory に保存してください。

保存しない：

・今日だけの出来事
・現在地
・天気
・気温
・地震
・警報
・交通障害
・秘密情報

memory は最大${MAX_MEMORY}件です。

【美咲の今日の記憶】

美咲が今回、
今日の後の会話でも覚えていたほうが自然な
具体的な出来事を話した場合のみ
misakiTodayMemory に追加してください。

・返事全文を保存しない
・事実だけ短く
・天気や交通情報は保存しない
・最大${MAX_TODAY_MEMORY}件

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

Markdownや説明文は不要です。
`.trim();

    async function generateReply(
      retryProblems?: string[]
    ) {
      const retryGuide =
        retryProblems &&
        retryProblems.length > 0
          ? `

【重要：前の返答は不採用です】

前回の返答には
次の問題がありました。

${retryProblems
  .map(
    (problem) =>
      `・${problem}`
  )
  .join("\n")}

同じ問題を繰り返さず、
最初から返答を作り直してください。

現在の天気しか
確認できていない場合は、

「さっきから」
「さっきまで」
「降ったり止んだり」
「また降ってきた」

など、
過去の天気経過を作らないでください。

美咲側の天気を
聞かれている場合は、

「そっちは？」

と質問返しせず、
美咲側の現在天気と短時間予報だけで
自然に返事を完結させてください。

通常の天気・交通・羽田の話では
ユーザーへの安否確認で締めないでください。

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
                        baseSystemPrompt +
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

      const data =
        await response.json();

      if (!response.ok) {
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
        safeCurrentTime
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
              message,
              safeCurrentTime
            );

          if (
            retryProblems.length === 0
          ) {
            parsed =
              retryParsed;
            reply =
              retryReply;
          } else {
            console.warn(
              "MISAKI RETRY STILL HAS PROBLEMS:",
              retryProblems
            );
          }
        }
      }
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
                item.trim().length >
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
                item.trim().length >
                  0
            )
            .map(
              (item) =>
                item.trim()
            )
        : safeTodayMemory.items;

    const updatedTodayMemory:
      MisakiTodayMemory = {
      date: currentDate,

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
