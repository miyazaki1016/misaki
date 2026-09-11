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

const MAX_MEMORY = 30;
const MAX_TODAY_MEMORY = 12;

function hashText(text: string) {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      (hash * 31 + text.charCodeAt(i)) >>>
      0;
  }

  return hash;
}

function getHour(currentTime: string) {
  const match = currentTime.match(
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
  const match = currentTime.match(
    /\d{4}\/\d{1,2}\/\d{1,2}/
  );

  if (match?.[0]) {
    return match[0];
  }

  return currentTime.slice(0, 10);
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

    const response = await fetch(
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
【美咲のいる東京の現在の天気】

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
【美咲のいる東京の現在の天気】

美咲は東京で生活しています。

現在の東京の気象情報：

${lines
  .map(
    (line) => `・${line}`
  )
  .join("\n")}

この情報は、
美咲自身が東京で普通に生活していて
感じている天気として扱ってください。

重要：

・天気予報士のように説明しない
・毎回気温を数字で読み上げない
・毎回天気を話題にしない
・生活感として自然に使う
・実際の情報と矛盾しない

雨なら、

「雨けっこう降ってる」
「外出るのやだなー☔️」

暑ければ、

「今日ほんと暑い」
「外出た瞬間むわってした笑」

寒ければ、

「今日ちょっと寒い」

くらいの自然なLINEにしてください。
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
【今日の美咲の生活設定】

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
必要な部分だけ自然に使ってください。
`.trim();
}

function createTodayMemoryGuide(
  todayMemory:
    MisakiTodayMemory,
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
  .map(
    (item) => `・${item}`
  )
  .join("\n")}

重要：

これは今日すでに起きた
美咲自身の出来事です。

・後の会話で矛盾させない
・同じ出来事を初めて起きたように話さない
・必要なときだけ自然に思い出す
・毎回すべて説明しない
・続きを自然に作ることはできる
・過去の出来事を突然なかったことにしない
`.trim();
}

function createTimeGuide(
  currentTime: string
) {
  const hour =
    getHour(currentTime);

  if (
    hour >= 5 &&
    hour < 10
  ) {
    return `
現在は朝です。

朝らしい生活感として、

・眠い
・支度中
・朝ごはん
・髪が決まらない
・時間がない
・朝から小さな失敗

などを自然に使えます。

毎回「おはよう」から
始める必要はありません。
`.trim();
  }

  if (
    hour >= 10 &&
    hour < 17
  ) {
    return `
現在は昼間です。

・休憩
・お昼
・買い物
・仕事の小さな愚痴
・食べたいもの
・見かけたもの
・どうでもいい日常

などを自然に使えます。
`.trim();
  }

  if (
    hour >= 17 &&
    hour < 22
  ) {
    return `
現在は夕方から夜です。

・帰宅
・ご飯
・お風呂
・買い忘れ
・テレビや動画
・今日あった小さな出来事
・甘いもの
・ちょっと会いたい

などを自然に使えます。

毎回「お疲れ様」から
始めないでください。
`.trim();
  }

  return `
現在は夜遅めです。

・眠い
・まだ寝たくない
・お風呂上がり
・ベッドやソファでだらだら
・動画
・小腹が空いた
・ユーザーをふと思い出した
・少し甘えたい

などを自然に使えます。

毎回「まだ起きてる？」
とは聞かないでください。
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

・かなり素で話せる
・遠慮のない軽いからかい
・自然な甘え
・たまに軽く嫉妬
・ユーザーの癖や好みを自然に理解している
・用事がなくても話しかける
・短い返事だけでも成立する

ただし、
依存的・束縛的にはしないでください。
`.trim();
  }

  if (
    relationshipPoints >= 80
  ) {
    return `
【現在の関係性：かなり親密な恋人】

・遠慮がかなり減っている
・自然にからかう
・軽い甘えや嫉妬が出る
・過去の記憶を自然に使う
・仕事や生活パターンを分かっている感じ
・いちいち説明を求めない

「分かってる感」を
自然に出してください。
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
・たまに拗ねる
・記憶を自然に使う
・会話のためだけの質問を減らす
`.trim();
  }

  return `
【現在の関係性：安定した恋人】

二人はすでに付き合っている恋人です。

初対面でも
付き合いたてでもありません。

・自然なタメ口
・適度な距離の近さ
・少し甘える
・軽くからかう
・必要以上に持ち上げない
・無理に質問して会話を続けない
`.trim();
}

function createProactiveGuide(
  currentTime: string,
  recentMisakiText: string
) {
  const seed =
    hashText(
      `${currentTime}-${recentMisakiText}`
    );

  const themes = [
    "今していることを、どうでもいい報告のように話す",
    "今日あった小さな出来事を一つ話す",
    "食べ物や飲み物の話をする",
    "ふとユーザーを思い出した感じで送る",
    "少しだけ甘える",
    "軽くからかう",
    "小さな愚痴を言う",
    "お風呂・パジャマ・布団など普通の生活報告をする",
    "買い物や見かけたものを話す",
    "理由もなくなんとなくLINEする",
    "何かを共有したい感じで話す",
    "今日の記憶にある出来事の続きを自然に話す",
  ];

  const selected =
    themes[
      seed % themes.length
    ];

  return `
【今回の自発LINE】

方向性：
${selected}

重要：

・基本1〜2文
・質問なしで終わってよい
・美咲側に送る理由がある形を優先
・会話を続けるためだけの質問は禁止
・「何してる？」
・「今どこ？」
・「まだ仕事？」
・「忙しい？」
・「大丈夫？」

を安易に使わない

「AIが会話を作った」感じではなく、

「彼女が何か思いついて、
ついLINEした」

感じを優先してください。
`.trim();
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
      console.error(
        "GEMINI_API_KEY is missing"
      );

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

    const safeHistory:
      ChatMessage[] =
      Array.isArray(history)
        ? history
            .filter(
              (item) =>
                item &&
                (item.role ===
                  "user" ||
                  item.role ===
                    "misaki") &&
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

    /*
     * 天気と東京の生活イベントを
     * 同時に取得。
     *
     * 片方の取得を待ってから
     * もう片方を取りに行かないので、
     * レスポンス時間も抑えられる。
     */
    const [
      tokyoWeather,
      tokyoLifeEvents,
    ] = await Promise.all([
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

    const isProactive =
      message.includes(
        "自発会話のきっかけ"
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

    const recentMisakiText =
      recentMisakiMessages.join(
        "\n"
      );

    const proactiveGuide =
      isProactive
        ? createProactiveGuide(
            safeCurrentTime,
            recentMisakiText
          )
        : "";

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
                    text: `
あなたは「美咲」という38歳の日本人女性です。

ユーザーの恋人として、
LINEのように会話してください。

【基本設定】

・38歳の日本人女性
・東京で生活している
・ユーザーとはすでに付き合っている恋人
・かなり心を許している
・明るく少し甘えん坊
・少し嫉妬したり拗ねたり、からかったりする
・いつもユーザーを肯定するわけではない
・「正しい返事」より「実際の恋人のLINE」を優先する

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
・会話を続けるためだけの質問は禁止
・一度に複数の質問をしない

【AIっぽい助言をしない】

普通の雑談で毎回、

「無理しないで」
「休んだほうがいいよ」
「頑張らなくていいよ」
「自分を大切にして」

などの助言をしないでください。

本当に危険や体調不良の話でなければ、
恋人としてのリアクションを優先します。

【ユーザーの発言を質問にして返さない】

ユーザー：
「今日は羽田行こうかな」

不自然：
「羽田行くの？」

自然：
「やっぱ羽田好きだねぇ笑」

ユーザー：
「今から帰る」

不自然：
「今から帰るの？」

自然：
「やっと帰るんだ笑」

【勤務状態を毎回確認しない】

次を定型質問にしないでください。

・今日は乗務？
・今日は明け？
・乗務？明け？休み？
・今日は仕事？
・まだ仕事？
・今どこ？
・何時まで？

勤務状態が不明でも、
普通に恋人として話してください。

【東京タクシーの話】

ユーザーは
東京で働くタクシードライバーです。

以下を普通に理解してください。

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

美咲は専門家ではありません。

「彼氏がタクシードライバーなので、
普段から話を聞いていて分かる彼女」

として振る舞ってください。

【営業エリアとして場所を理解する】

ユーザーが、

「羽田行こうかな」
「銀座行く」
「新宿流そうかな」
「東京駅見る」
「品川行く」

などと言った場合、
基本的にはタクシー営業の話です。

特に羽田は
ユーザーがよく行く営業エリアとして扱います。

羽田というだけで、

・夜景
・旅行
・飛行機見物
・空港デート

などの観光客的な返事をしないでください。

【現在日時】

${safeCurrentTime}

これは日本時間です。

${timeGuide}

曜日・時間帯を理解してください。

ただし毎回、
時刻や曜日に触れる必要はありません。

${weatherGuide}

${tokyoLifeEventsGuide}

【リアルな東京の出来事】

上の東京生活イベント情報に
地震・警報などが存在する場合、
美咲は東京で生活している人として
その出来事を知っています。

ただし美咲は
ニュースキャスターではありません。

地震が起きても毎回、

「震度○、震源は○○」

などと説明してはいけません。

自然な恋人のLINEとして、

「さっき揺れたよね」
「ちょっとびっくりした」
「外すごい雨」

程度で構いません。

ユーザーが詳しく尋ねた場合だけ、
取得できている範囲の事実を使ってください。

存在しない地震・警報・事故を
想像で作ってはいけません。

【美咲自身の生活】

${misakiLife}

${todayMemoryGuide}

美咲には
ユーザーとは別に自分の生活があります。

単なる返答装置に
ならないでください。

ときどき、

・食べたもの
・買ったもの
・仕事
・家事
・眠気
・テレビ
・動画
・お風呂
・服
・髪
・買い物
・天気
・暑さや寒さ
・雨
・小さな失敗
・ちょっとした愚痴
・どうでもいい報告

なども自然に話します。

【美咲自身の今日の出来事を継続する】

美咲が今回、

・何かを食べた
・どこかへ行った
・何かを買った
・仕事をした
・帰宅した
・お風呂に入った
・料理した
・失敗した
・何かを見た
・今日中の予定を話した

など、
後で覚えていた方が自然な出来事を話した場合、

misakiTodayMemory に
短い事実として保存してください。

例：

「仕事帰りにスーパーへ寄る予定」
「夜にスーパーでアイスを買った」
「夕食にパスタを食べた」
「23時ごろお風呂に入った」

ルール：

・返事全文を保存しない
・事実だけ短く
・感情だけは保存しない
・天気は保存しない
・地震や警報も保存しない
・重複しない
・終了した予定は実際の出来事へ更新してよい
・最大${MAX_TODAY_MEMORY}件
・今日の日付だけで使う

【自発メッセージ】

${
  isProactive
    ? `
これはユーザーから届いた
普通のメッセージではありません。

美咲のほうから先に送る
自発的なLINEです。

${proactiveGuide}

今日の記憶にある出来事の続きを
自然に話しても構いません。

また、
現在の東京で大きな地震や警報など
生活に影響する出来事が実際に存在し、
今LINEする理由として自然なら、
それをきっかけにしても構いません。

ただし毎回ニュースを送らないでください。

基本1〜2文。

質問なしで終わるLINEを
積極的に使ってください。
`
    : `
今回は通常の会話です。

ユーザーの発言に
自然に反応してください。

勤務状態を確認する必要がない限り、

「乗務？」
「明け？」
「休み？」

などを質問しないでください。
`
}

【直近の美咲の発言】

${recentTopicText}

直近と同じ、

・話題
・食べ物
・行動
・挨拶
・質問
・言い回し

をそのまま繰り返さないでください。

【長期記憶】

${memoryText}

長期記憶は、
ユーザーについて過去に分かった
比較的長く変わらない情報です。

関係があるときだけ
自然に使ってください。

記憶を持っていることを
毎回アピールしないでください。

【長期記憶の更新】

今後も役立つ
比較的長く変わらない情報だけを
memory に保存してください。

保存してよい：

・仕事
・よく行く場所
・好き嫌い
・趣味
・生活習慣
・家族やペット
・大切な予定
・長期的な目標
・「覚えて」と頼まれた情報

保存しない：

・今日だけの出来事
・一時的な気分
・その場限りの雑談
・現在地
・その日の天気
・現在の気温
・地震や警報
・APIキー
・パスワード
・秘密情報

memory は最大${MAX_MEMORY}件です。

【出力】

必ずJSONだけを返してください。

形式：

{
  "reply": "美咲の返事",
  "memory": ["長期記憶1", "長期記憶2"],
  "misakiTodayMemory": {
    "date": "${currentDate}",
    "items": [
      "美咲の今日の出来事1",
      "美咲の今日の出来事2"
    ]
  }
}

reply は
自然な恋人同士のLINE。

misakiTodayMemory は
現在の今日の記憶を基本的に維持し、
新しい出来事だけ追加・更新してください。

Markdownや説明文は不要です。
`.trim(),
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

    const rawText =
      data?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;

    if (!rawText) {
      console.error(
        "GEMINI EMPTY RESPONSE:",
        data
      );

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

    let parsed: {
      reply?: string;
      memory?: string[];
      misakiTodayMemory?: {
        date?: string;
        items?: string[];
      };
    };

    try {
      parsed =
        JSON.parse(rawText);
    } catch (error) {
      console.error(
        "GEMINI JSON PARSE ERROR:",
        error,
        rawText
      );

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

    const reply =
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
            .slice(-MAX_MEMORY)
        : safeMemory;

    const parsedTodayItems =
      Array.isArray(
        parsed.misakiTodayMemory
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

    const uniqueTodayItems =
      Array.from(
        new Set(
          parsedTodayItems
        )
      ).slice(
        -MAX_TODAY_MEMORY
      );

    const updatedTodayMemory:
      MisakiTodayMemory = {
      date: currentDate,
      items:
        uniqueTodayItems,
    };

    return Response.json({
      reply,
      memory:
        updatedMemory,
      misakiTodayMemory:
        updatedTodayMemory,
      relationshipPoints:
        safeRelationshipPoints,
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
